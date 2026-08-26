package records

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/aksa-medika/api/pkg/crypto"
)

// Handler holds the DB pool for records operations.
type Handler struct {
	db *pgxpool.Pool
}

// NewHandler creates a new records handler.
func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{db: db}
}

// MedicalRecord represents a single medical record.
type MedicalRecord struct {
	ID          string `json:"id"`
	PatientID   string `json:"patient_id"`
	DoctorID    string `json:"doctor_id,omitempty"`
	DoctorName  string `json:"doctor_name,omitempty"`
	Diagnosis   string `json:"diagnosis"`
	Prescription string `json:"prescription,omitempty"`
	Notes       string `json:"notes,omitempty"`
	VisitDate   string `json:"visit_date"`
	CreatedAt   string `json:"created_at"`
}

// MaskedRecord represents patient medical records.
type MaskedRecord struct {
	ID           string `json:"id"`
	VisitDate    string `json:"visit_date"`
	Diagnosis    string `json:"diagnosis"`
	Prescription string `json:"prescription,omitempty"`
	Notes        string `json:"notes,omitempty"`
	DoctorName   string `json:"doctor_name,omitempty"`
	ICDCode      string `json:"icd_code,omitempty"`
	CreatedAt    string `json:"created_at"`
}

// ListPatientRecords returns records for the authenticated patient.
// GET /api/patient/records
func (h *Handler) ListPatientRecords(c *gin.Context) {
	patientID := c.GetString("user_id")

	rows, err := h.db.Query(context.Background(),
		`SELECT mr.id, mr.visit_date::text, mr.diagnosis, COALESCE(mr.prescription, ''), COALESCE(mr.notes, ''), COALESCE(u.name, 'Dokter Aksamedika'), COALESCE(mr.icd_code, ''), mr.created_at::text, COALESCE(mr.data_integrity_hash, '')
		 FROM medical_records mr
		 LEFT JOIN users u ON u.id = mr.doctor_id
		 WHERE mr.patient_id = $1
		 ORDER BY mr.visit_date DESC`,
		patientID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch records"})
		return
	}
	defer rows.Close()

	var records []MaskedRecord
	for rows.Next() {
		var r MaskedRecord
		var diag, pres, notes, hash string
		if err := rows.Scan(&r.ID, &r.VisitDate, &diag, &pres, &notes, &r.DoctorName, &r.ICDCode, &r.CreatedAt, &hash); err != nil {
			continue
		}
		
		decryptedDiag, _ := crypto.Decrypt(diag)
		decryptedPres, _ := crypto.Decrypt(pres)
		decryptedNotes, _ := crypto.Decrypt(notes)
		
		if hash != "" {
			computedHash := crypto.GenerateDataHash(patientID, decryptedDiag, r.VisitDate)
			if computedHash != hash {
				r.Diagnosis = "⚠️ DATA TERINDIKASI DIMANIPULASI"
				records = append(records, r)
				continue
			}
		}

		r.Diagnosis = decryptedDiag
		r.Prescription = decryptedPres
		r.Notes = decryptedNotes
		records = append(records, r)
	}

	if records == nil {
		records = []MaskedRecord{}
	}

	c.JSON(http.StatusOK, gin.H{"records": records, "total": len(records)})
}

// GetPatientRecordsForDoctor returns full (unmasked) records after consent validation.
// The doctor must have called POST /api/doctor/access first to validate their token.
// The patient_id is returned by the validate endpoint and the doctor uses it here.
// GET /api/doctor/records/:patient_id
func (h *Handler) GetPatientRecordsForDoctor(c *gin.Context) {
	patientID := c.Param("patient_id")

	// Security check: verify there's a recently consumed (is_used=true) token
	// for this doctor + patient combination within the last 5 minutes.
	// This prevents doctors from hitting this endpoint directly without going
	// through the consent flow first.
	doctorID := c.GetString("user_id")

	var exists bool
	err := h.db.QueryRow(context.Background(),
		`SELECT EXISTS (
			SELECT 1 FROM audit_logs
			WHERE doctor_id = $1
			  AND patient_id = $2
			  AND accessed_at > now() - interval '5 minutes'
		)`, doctorID, patientID,
	).Scan(&exists)

	if err != nil || !exists {
		c.JSON(http.StatusForbidden, gin.H{"error": "Consent not validated. Please enter a valid PIN first."})
		return
	}

	// Fetch full records — unmasked
	rows, err := h.db.Query(context.Background(),
		`SELECT mr.id, mr.patient_id, mr.doctor_id, COALESCE(u.name, 'Unknown') as doctor_name,
		        mr.diagnosis, COALESCE(mr.prescription, ''), COALESCE(mr.notes, ''),
		        mr.visit_date::text, mr.created_at::text, COALESCE(mr.data_integrity_hash, '')
		 FROM medical_records mr
		 LEFT JOIN users u ON u.id = mr.doctor_id
		 WHERE mr.patient_id = $1
		 ORDER BY mr.visit_date DESC`,
		patientID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch records"})
		return
	}
	defer rows.Close()

	var records []MedicalRecord
	for rows.Next() {
		var r MedicalRecord
		var diag, pres, notes, hash string
		if err := rows.Scan(
			&r.ID, &r.PatientID, &r.DoctorID, &r.DoctorName,
			&diag, &pres, &notes, &r.VisitDate, &r.CreatedAt, &hash,
		); err != nil {
			continue
		}

		decryptedDiag, _ := crypto.Decrypt(diag)
		decryptedPres, _ := crypto.Decrypt(pres)
		decryptedNotes, _ := crypto.Decrypt(notes)

		if hash != "" {
			computedHash := crypto.GenerateDataHash(r.PatientID, decryptedDiag, r.VisitDate)
			if computedHash != hash {
				c.JSON(http.StatusConflict, gin.H{"error": "Security Alert: Data terindikasi dimanipulasi pada level database!"})
				return
			}
		}

		r.Diagnosis = decryptedDiag
		r.Prescription = decryptedPres
		r.Notes = decryptedNotes

		records = append(records, r)
	}

	if records == nil {
		records = []MedicalRecord{}
	}

	c.JSON(http.StatusOK, gin.H{"records": records, "total": len(records)})
}

// CreateRecordRequest is the expected body for POST /api/doctor/records/:patient_id
type CreateRecordRequest struct {
	Diagnosis    string `json:"diagnosis" binding:"required"`
	Prescription string `json:"prescription"`
	Notes        string `json:"notes"`
	ICDCode      string `json:"icd_code"`
	VisitDate    string `json:"visit_date" binding:"required"` // "YYYY-MM-DD"
}

// CreateRecord allows a doctor to add a new medical record for a patient.
// The doctor must have a valid, recently consumed consent token (within last 5 minutes).
// POST /api/doctor/records/:patient_id
func (h *Handler) CreateRecord(c *gin.Context) {
	patientID := c.Param("patient_id")
	doctorID := c.GetString("user_id")

	// Security: verify active consent within the last 5 minutes
	var exists bool
	err := h.db.QueryRow(context.Background(),
		`SELECT EXISTS (
			SELECT 1 FROM audit_logs
			WHERE doctor_id = $1
			  AND patient_id = $2
			  AND accessed_at > now() - interval '5 minutes'
		)`, doctorID, patientID,
	).Scan(&exists)

	if err != nil || !exists {
		c.JSON(http.StatusForbidden, gin.H{"error": "Active consent required. Please validate the patient PIN first."})
		return
	}

	var req CreateRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Web3-Ready: Generate Data Integrity Hash on plaintext
	dataHash := crypto.GenerateDataHash(patientID, req.Diagnosis, req.VisitDate)

	// Column-Level Encryption for sensitive fields
	encryptedDiag, _ := crypto.Encrypt(req.Diagnosis)
	encryptedPres, _ := crypto.Encrypt(req.Prescription)
	encryptedNotes, _ := crypto.Encrypt(req.Notes)

	var recordID string
	insertErr := h.db.QueryRow(context.Background(),
		`INSERT INTO medical_records (patient_id, doctor_id, diagnosis, prescription, notes, icd_code, visit_date, data_integrity_hash)
		 VALUES ($1, $2, $3, $4, $5, $6, $7::date, $8)
		 RETURNING id`,
		patientID, doctorID,
		encryptedDiag,
		nullIfEmpty(encryptedPres),
		nullIfEmpty(encryptedNotes),
		nullIfEmpty(req.ICDCode),
		req.VisitDate,
		dataHash,
	).Scan(&recordID)

	if insertErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create record: " + insertErr.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":   "Medical record created successfully",
		"record_id": recordID,
	})
}

func nullIfEmpty(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}

// Groq API structures
type GroqMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type GroqPayload struct {
	Model    string        `json:"model"`
	Messages []GroqMessage `json:"messages"`
}

type GroqResponse struct {
	Choices []struct {
		Message GroqMessage `json:"message"`
	} `json:"choices"`
}

// GetPatientSummaryAI fetches the patient records and asks Groq AI to summarize them.
// GET /api/doctor/records/:patient_id/summary
func (h *Handler) GetPatientSummaryAI(c *gin.Context) {
	patientID := c.Param("patient_id")
	doctorID := c.GetString("user_id")

	// Security: verify active consent within the last 5 minutes (including EMERGENCY)
	var exists bool
	err := h.db.QueryRow(context.Background(),
		`SELECT EXISTS (
			SELECT 1 FROM audit_logs
			WHERE doctor_id = $1
			  AND patient_id = $2
			  AND accessed_at > now() - interval '5 minutes'
		)`, doctorID, patientID,
	).Scan(&exists)

	if err != nil || !exists {
		c.JSON(http.StatusForbidden, gin.H{"error": "Active consent required. Please validate the patient PIN or use Emergency Access first."})
		return
	}

	// Fetch full records
	rows, err := h.db.Query(context.Background(),
		`SELECT diagnosis, COALESCE(prescription, ''), COALESCE(notes, ''), visit_date::text, COALESCE(data_integrity_hash, '')
		 FROM medical_records
		 WHERE patient_id = $1
		 ORDER BY visit_date DESC`,
		patientID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch records for AI"})
		return
	}
	defer rows.Close()

	var contextText string
	for rows.Next() {
		var diag, pres, notes, vdate, hash string
		if err := rows.Scan(&diag, &pres, &notes, &vdate, &hash); err == nil {
			decryptedDiag, _ := crypto.Decrypt(diag)
			decryptedPres, _ := crypto.Decrypt(pres)
			decryptedNotes, _ := crypto.Decrypt(notes)
			
			if hash != "" {
				computedHash := crypto.GenerateDataHash(patientID, decryptedDiag, vdate)
				if computedHash != hash {
					continue // skip tampered data for AI summary
				}
			}
			contextText += fmt.Sprintf("Date: %s, Diagnosis: %s, Prescription: %s, Notes: %s\n", vdate, decryptedDiag, decryptedPres, decryptedNotes)
		}
	}

	if contextText == "" {
		c.JSON(http.StatusOK, gin.H{"summary": "Belum ada rekam medis yang bisa dirangkum."})
		return
	}

	// Call Groq AI
	apiKey := os.Getenv("GROQ_API_KEY")
	if apiKey == "" {
		fmt.Println("[AI ERROR] GROQ_API_KEY env var is not set in this Vercel project")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "AI service is not configured"})
		return
	}

	prompt := "You are a professional medical assistant. Read the following patient records and provide a quick 3-bullet summary in Indonesian. Focus on chronic conditions, recent major issues, and highlight any potential drug interactions or warnings. Be very concise and professional.\n\nRecords:\n" + contextText

	// Try models in order of preference (most current first)
	modelsToTry := []string{
		"openai/gpt-oss-20b",
		"llama-3.3-70b-versatile",
		"llama-3.1-8b-instant",
	}

	var summaryText string
	for _, model := range modelsToTry {
		payload := GroqPayload{
			Model:    model,
			Messages: []GroqMessage{{Role: "user", Content: prompt}},
		}

		jsonData, _ := json.Marshal(payload)
		req, _ := http.NewRequest("POST", "https://api.groq.com/openai/v1/chat/completions", bytes.NewBuffer(jsonData))
		req.Header.Set("Authorization", "Bearer "+apiKey)
		req.Header.Set("Content-Type", "application/json")

		client := &http.Client{Timeout: 20 * time.Second}
		resp, err := client.Do(req)
		if err != nil {
			fmt.Printf("[AI] Model %s HTTP error: %v\n", model, err)
			continue
		}

		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()

		if resp.StatusCode != 200 {
			fmt.Printf("[AI] Model %s returned %d: %s\n", model, resp.StatusCode, string(body))
			continue
		}

		var groqResp GroqResponse
		if err := json.Unmarshal(body, &groqResp); err != nil || len(groqResp.Choices) == 0 {
			fmt.Printf("[AI] Model %s parse error: %s\n", model, string(body))
			continue
		}

		summaryText = groqResp.Choices[0].Message.Content
		fmt.Printf("[AI] Successfully used model: %s\n", model)
		break
	}

	if summaryText == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "All AI models unavailable. Check GROQ_API_KEY permissions."})
		return
	}

	c.JSON(http.StatusOK, gin.H{"summary": summaryText})
}

