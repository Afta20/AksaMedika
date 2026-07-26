package kiosk

import (
	"context"
	"fmt"
	"net/http"

	"github.com/aksa-medika/api/pkg/auth"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

// Handler holds the DB pool
type Handler struct {
	db *pgxpool.Pool
}

func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{db: db}
}

type EmergencyKioskRequest struct {
	NIK            string `json:"nik" binding:"required,len=16"`
	DoctorEmail    string `json:"doctor_email" binding:"required,email"`
	DoctorPassword string `json:"doctor_password" binding:"required"`
}

// EmergencyAccess bypasses normal consent using NIK and Doctor Credentials
// POST /api/kiosk/emergency-access
func (h *Handler) EmergencyAccess(c *gin.Context) {
	var req EmergencyKioskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input. NIK must be exactly 16 digits."})
		return
	}

	// 1. Validate Doctor Credentials
	var (
		doctorID   string
		doctorName string
		hashedPwd  string
	)
	err := h.db.QueryRow(context.Background(),
		`SELECT id, name, password_hash FROM users WHERE email = $1 AND role = 'doctor'`,
		req.DoctorEmail,
	).Scan(&doctorID, &doctorName, &hashedPwd)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Kredensial Dokter tidak valid"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hashedPwd), []byte(req.DoctorPassword)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Password Dokter salah"})
		return
	}

	// 2. Find Patient by NIK
	var (
		patientID   string
		patientName string
	)
	err = h.db.QueryRow(context.Background(),
		`SELECT id, name FROM users WHERE nik = $1 AND role = 'patient'`,
		req.NIK,
	).Scan(&patientID, &patientName)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pasien dengan NIK tersebut tidak ditemukan"})
		return
	}

	// 3. Write EMERGENCY audit log
	auditName := fmt.Sprintf("%s (EMERGENCY via NIK)", doctorName)
	_, err = h.db.Exec(context.Background(),
		`INSERT INTO audit_logs (patient_id, doctor_id, doctor_name, access_method, ip_address)
		 VALUES ($1, $2, $3, $4, $5)`,
		patientID, doctorID, auditName, "EMERGENCY", c.ClientIP(),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mencatat log darurat"})
		return
	}

	// 4. Generate Doctor JWT so the frontend can fetch records
	token, err := auth.GenerateJWT(doctorID, "doctor", doctorName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat sesi darurat"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "EMERGENCY ACCESS GRANTED",
		"token":        token,
		"patient_id":   patientID,
		"patient_name": patientName,
	})
}
