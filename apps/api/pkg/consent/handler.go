package consent

import (
	"context"
	"crypto/rand"
	"fmt"
	"math/big"
	"net/http"
	"time"

	"github.com/aksa-medika/api/pkg/notify"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Handler holds the DB pool for consent operations.
type Handler struct {
	db *pgxpool.Pool
}

// NewHandler creates a new consent handler.
func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{db: db}
}

// GenerateResponse is returned to the patient after generating consent.
type GenerateResponse struct {
	TokenID    string    `json:"token_id"`
	PIN        string    `json:"pin"`
	QRPayload  string    `json:"qr_payload"`
	ExpiresAt  time.Time `json:"expires_at"`
	ExpiresIn  int       `json:"expires_in_seconds"` // countdown helper
}

// Generate creates a 6-digit PIN and QR payload for the authenticated patient.
// POST /api/patient/consent/generate
func (h *Handler) Generate(c *gin.Context) {
	patientID := c.GetString("user_id")

	// Invalidate any existing unexpired tokens for this patient
	_, err := h.db.Exec(context.Background(),
		`UPDATE access_tokens SET is_used = true WHERE patient_id = $1 AND is_used = false AND expires_at > now()`,
		patientID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to invalidate existing tokens"})
		return
	}

	// Generate cryptographically secure 6-digit PIN
	pin, err := generatePIN()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate PIN"})
		return
	}

	// Generate unique QR payload (UUID-based)
	qrPayload := uuid.New().String()
	expiresAt := time.Now().Add(30 * time.Minute)

	// Store in DB
	var tokenID string
	query := `
		INSERT INTO access_tokens (patient_id, pin, qr_payload, expires_at)
		VALUES ($1, $2, $3, $4)
		RETURNING id`
	err = h.db.QueryRow(context.Background(), query,
		patientID, pin, qrPayload, expiresAt,
	).Scan(&tokenID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store access token"})
		return
	}

	c.JSON(http.StatusCreated, GenerateResponse{
		TokenID:   tokenID,
		PIN:       pin,
		QRPayload: qrPayload,
		ExpiresAt: expiresAt,
		ExpiresIn: 30 * 60, // 1800 seconds
	})
}

// ValidateRequest is the body for doctor access validation.
type ValidateRequest struct {
	PIN       string `json:"pin"`
	QRPayload string `json:"qr_payload"`
}

// ValidateAccessResponse is returned after successful validation.
type ValidateAccessResponse struct {
	PatientID   string `json:"patient_id"`
	PatientName string `json:"patient_name"`
	Message     string `json:"message"`
}

// ValidateAccess lets a doctor validate a PIN or QR payload to unlock patient records.
// POST /api/doctor/access
func (h *Handler) ValidateAccess(c *gin.Context) {
	var req ValidateRequest
	if err := c.ShouldBindJSON(&req); err != nil || (req.PIN == "" && req.QRPayload == "") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "PIN or QR payload is required"})
		return
	}

	doctorID := c.GetString("user_id")
	doctorName := c.GetString("user_name")

	var (
		tokenID   string
		patientID string
		patientName string
	)

	var query string
	var arg string

	if req.PIN != "" {
		query = `
			SELECT at.id, at.patient_id, u.name
			FROM access_tokens at
			JOIN users u ON u.id = at.patient_id
			WHERE at.pin = $1
			  AND at.is_used = false
			  AND at.expires_at > now()
			LIMIT 1`
		arg = req.PIN

		err := h.db.QueryRow(context.Background(), query, arg).
			Scan(&tokenID, &patientID, &patientName)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired access code"})
			return
		}

		// Mark token as used (single-use)
		_, _ = h.db.Exec(context.Background(),
			`UPDATE access_tokens SET is_used = true WHERE id = $1`,
			tokenID,
		)
	} else {
		// First check if it's a dynamic access_token QR
		query = `
			SELECT at.id, at.patient_id, u.name
			FROM access_tokens at
			JOIN users u ON u.id = at.patient_id
			WHERE at.qr_payload = $1
			  AND at.is_used = false
			  AND at.expires_at > now()
			LIMIT 1`
		err := h.db.QueryRow(context.Background(), query, req.QRPayload).
			Scan(&tokenID, &patientID, &patientName)

		if err == nil {
			// Mark token as used
			_, _ = h.db.Exec(context.Background(),
				`UPDATE access_tokens SET is_used = true WHERE id = $1`,
				tokenID,
			)
		} else {
			// Fallback: check if QR payload is formatted as "PATIENT:<uuid>" or a raw patient ID
			cleanID := req.QRPayload
			if len(cleanID) > 8 && cleanID[:8] == "PATIENT:" {
				cleanID = cleanID[8:]
			}

			err = h.db.QueryRow(context.Background(),
				`SELECT id, name FROM users WHERE id = $1 AND role = 'patient'`,
				cleanID,
			).Scan(&patientID, &patientName)

			if err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "QR Code tidak valid atau pasien tidak ditemukan"})
				return
			}
		}
	}

	// Write audit log
	method := "QR"
	if req.PIN != "" {
		method = "PIN"
	}

	_, err := h.db.Exec(context.Background(),
		`INSERT INTO audit_logs (patient_id, doctor_id, doctor_name, access_method, ip_address)
		 VALUES ($1, $2, $3, $4, $5)`,
		patientID, doctorID, doctorName, method, c.ClientIP(),
	)
	if err != nil {
		// Log but don't fail the request — audit should not block access
		fmt.Printf("Failed to write audit log: %v\n", err)
	}

	// ✅ Push a real-time SSE notification to the patient's browser
	notify.GetGlobal(nil).PollAndNotify(patientID, doctorName, method)

	c.JSON(http.StatusOK, ValidateAccessResponse{
		PatientID:   patientID,
		PatientName: patientName,
		Message:     "Access granted",
	})
}

// generatePIN creates a cryptographically secure 6-digit PIN string.
func generatePIN() (string, error) {
	max := big.NewInt(1000000)
	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}

// EmergencyAccessRequest is the body for break-glass emergency access.
type EmergencyAccessRequest struct {
	PatientNIK string `json:"patient_nik" binding:"required,len=16"`
	Reason     string `json:"reason" binding:"required"`
}

// EmergencyAccess bypasses normal consent and grants immediate access, logging it as an EMERGENCY.
// POST /api/doctor/emergency-access
func (h *Handler) EmergencyAccess(c *gin.Context) {
	var req EmergencyAccessRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	doctorID := c.GetString("user_id")
	doctorName := c.GetString("user_name")

	var (
		patientID   string
		patientName string
	)

	err := h.db.QueryRow(context.Background(),
		`SELECT id, name FROM users WHERE nik = $1 AND role = 'patient'`,
		req.PatientNIK,
	).Scan(&patientID, &patientName)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Patient not found"})
		return
	}

	// Write EMERGENCY audit log. Note: We use EMERGENCY access_method.
	// We prepend the reason to the IP address or we could add a new column,
	// but to avoid more schema changes, we can just store the reason in the ip_address field
	// or log it locally. Let's just store it in ip_address or doctor_name field to be visible.
	// Actually, changing doctor_name to include reason:
	auditName := fmt.Sprintf("%s (EMERGENCY: %s)", doctorName, req.Reason)
	if len(auditName) > 255 {
		auditName = auditName[:255]
	}

	_, err = h.db.Exec(context.Background(),
		`INSERT INTO audit_logs (patient_id, doctor_id, doctor_name, access_method, ip_address)
		 VALUES ($1, $2, $3, $4, $5)`,
		patientID, doctorID, auditName, "EMERGENCY", c.ClientIP(),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write emergency audit log"})
		return
	}

	// ✅ Push a real-time EMERGENCY SSE notification to the patient's browser
	notify.GetGlobal(nil).PollAndNotify(patientID, doctorName, "EMERGENCY")

	c.JSON(http.StatusOK, ValidateAccessResponse{
		PatientID:   patientID,
		PatientName: patientName,
		Message:     "EMERGENCY ACCESS GRANTED",
	})
}

// RevokeAccess allows a patient to forcibly revoke any active sessions by writing a REVOKED audit log.
// POST /api/patient/revoke-access
func (h *Handler) RevokeAccess(c *gin.Context) {
	patientID := c.GetString("user_id")
	patientName := c.GetString("user_name")

	// Insert a REVOKED audit log to signal that the session is dead
	_, err := h.db.Exec(context.Background(),
		`INSERT INTO audit_logs (patient_id, doctor_id, doctor_name, access_method, ip_address)
		 VALUES ($1, NULL, $2, 'REVOKED', 'Pasien mencabut izin akses')`,
		patientID, patientName,
	)

	if err != nil {
		fmt.Printf("RevokeAccess DB Error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mencabut izin akses"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Izin akses berhasil dicabut"})
}
