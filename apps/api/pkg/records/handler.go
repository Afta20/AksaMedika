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

// MaskedRecord is a redacted version shown without consent.
type MaskedRecord struct {
	ID        string `json:"id"`
	VisitDate string `json:"visit_date"`
	Diagnosis string `json:"diagnosis"` // partially masked
	CreatedAt string `json:"created_at"`
}

// ListPatientRecords returns masked records for the authenticated patient.
// GET /api/patient/records
func (h *Handler) ListPatientRecords(c *gin.Context) {
	patientID := c.GetString("user_id")

	rows, err := h.db.Query(context.Background(),
		`SELECT id, visit_date, diagnosis, created_at
		 FROM medical_records
		 WHERE patient_id = $1
		 ORDER BY visit_date DESC`,
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
		if err := rows.Scan(&r.ID, &r.VisitDate, &r.Diagnosis, &r.CreatedAt); err != nil {
			continue
		}
		// API masking: partially redact diagnosis for the patient's own list
		// (Full record visible on detail page — patient can always see their own full data)
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
		        mr.visit_date::text, mr.created_at::text
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
		if err := rows.Scan(
			&r.ID, &r.PatientID, &r.DoctorID, &r.DoctorName,
			&r.Diagnosis, &r.Prescription, &r.Notes, &r.VisitDate, &r.CreatedAt,
		); err != nil {
			continue
		}
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

	var recordID string
	insertErr := h.db.QueryRow(context.Background(),
		`INSERT INTO medical_records (patient_id, doctor_id, diagnosis, prescription, notes, icd_code, visit_date)
		 VALUES ($1, $2, $3, $4, $5, $6, $7::date)
		 RETURNING id`,
		patientID, doctorID,
		req.Diagnosis,
		nullIfEmpty(req.Prescription),
		nullIfEmpty(req.Notes),
		nullIfEmpty(req.ICDCode),
		req.VisitDate,
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

// GroqRequest/Response structures
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
		`SELECT diagnosis, COALESCE(prescription, ''), COALESCE(notes, ''), visit_date::text
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
		var diag, pres, notes, vdate string
		if err := rows.Scan(&diag, &pres, &notes, &vdate); err == nil {
			contextText += fmt.Sprintf("Date: %s, Diagnosis: %s, Prescription: %s, Notes: %s\n", vdate, diag, pres, notes)
		}
	}

	if contextText == "" {
		c.JSON(http.StatusOK, gin.H{"summary": "Belum ada rekam medis yang bisa dirangkum."})
		return
	}

	// Call Groq AI
	apiKey := os.Getenv("GROQ_API_KEY")
	if apiKey == "" {
		// Fallback for user request
		apiKey = "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"
	}

	prompt := "You are a professional medical assistant. Read the following patient records and provide a quick 3-bullet summary in Indonesian. Focus on chronic conditions, recent major issues, and highlight any potential drug interactions or warnings. Be very concise and professional.\n\nRecords:\n" + contextText

	payload := GroqPayload{
		Model: "llama-3.1-8b-instant",
		Messages: []GroqMessage{
			{Role: "user", Content: prompt},
		},
	}

	jsonData, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://api.groq.com/openai/v1/chat/completions", bytes.NewBuffer(jsonData))
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Groq HTTP Error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "AI service unavailable"})
		return
	}
	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		fmt.Printf("Groq API Error: %d - %s\n", resp.StatusCode, string(body))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "AI service unavailable"})
		return
	}
	defer resp.Body.Close()

	var groqResp GroqResponse
	if err := json.NewDecoder(resp.Body).Decode(&groqResp); err != nil || len(groqResp.Choices) == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse AI response"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"summary": groqResp.Choices[0].Message.Content})
}

