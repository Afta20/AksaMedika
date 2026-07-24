package auth

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

// Handler holds the DB pool for auth operations.
type Handler struct {
	db *pgxpool.Pool
}

// NewHandler creates a new auth handler.
func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{db: db}
}

// RegisterRequest is the expected body for POST /api/auth/register.
type RegisterRequest struct {
	Email     string `json:"email" binding:"required,email"`
	Name      string `json:"name" binding:"required"`
	Password  string `json:"password" binding:"required,min=8"`
	Role      string `json:"role" binding:"required,oneof=patient doctor"`
	Specialty string `json:"specialty"`  // doctor only
	LicenseNo string `json:"license_no"` // doctor only
}

// Register handles new user registration.
func (h *Handler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	var userID string
	query := `
		INSERT INTO users (email, name, role, password_hash, specialty, license_no)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id`

	err = h.db.QueryRow(context.Background(), query,
		req.Email, req.Name, req.Role, string(hash),
		nullIfEmpty(req.Specialty), nullIfEmpty(req.LicenseNo),
	).Scan(&userID)
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email already registered"})
		return
	}

	token, err := GenerateToken(userID, req.Role, req.Name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"token": token,
		"user": gin.H{
			"id":   userID,
			"name": req.Name,
			"role": req.Role,
		},
	})
}

// LoginRequest is the expected body for POST /api/auth/login.
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// Login handles user authentication.
func (h *Handler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var (
		userID   string
		name     string
		role     string
		passHash string
	)

	query := `SELECT id, name, role, password_hash FROM users WHERE email = $1`
	err := h.db.QueryRow(context.Background(), query, req.Email).
		Scan(&userID, &name, &role, &passHash)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	token, err := GenerateToken(userID, role, name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id":   userID,
			"name": name,
			"role": role,
		},
	})
}

func nullIfEmpty(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}

// GetDoctorProfile returns the authenticated doctor's profile details.
// GET /api/doctor/profile
func (h *Handler) GetDoctorProfile(c *gin.Context) {
	doctorID := c.GetString("user_id")

	var name, email string
	var specialty, licenseNo *string

	err := h.db.QueryRow(context.Background(),
		`SELECT name, email, specialty, license_no FROM users WHERE id = $1 AND role = 'doctor'`,
		doctorID,
	).Scan(&name, &email, &specialty, &licenseNo)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Doctor profile not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":         doctorID,
		"name":       name,
		"email":      email,
		"specialty":  specialty,
		"license_no": licenseNo,
	})
}

