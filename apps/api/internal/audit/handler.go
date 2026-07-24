package audit

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Handler holds the DB pool for audit operations.
type Handler struct {
	db *pgxpool.Pool
}

// NewHandler creates a new audit handler.
func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{db: db}
}

// AuditEntry represents one access event in the audit trail.
type AuditEntry struct {
	ID           string `json:"id"`
	DoctorName   string `json:"doctor_name"`
	AccessMethod string `json:"access_method"`
	IPAddress    string `json:"ip_address,omitempty"`
	AccessedAt   string `json:"accessed_at"`
}

// GetPatientAuditLog returns all access events for the authenticated patient.
// GET /api/patient/audit
func (h *Handler) GetPatientAuditLog(c *gin.Context) {
	patientID := c.GetString("user_id")

	rows, err := h.db.Query(context.Background(),
		`SELECT id, doctor_name, access_method, COALESCE(ip_address, ''), accessed_at::text
		 FROM audit_logs
		 WHERE patient_id = $1
		 ORDER BY accessed_at DESC
		 LIMIT 50`,
		patientID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch audit log"})
		return
	}
	defer rows.Close()

	var entries []AuditEntry
	for rows.Next() {
		var e AuditEntry
		if err := rows.Scan(&e.ID, &e.DoctorName, &e.AccessMethod, &e.IPAddress, &e.AccessedAt); err != nil {
			continue
		}
		entries = append(entries, e)
	}

	if entries == nil {
		entries = []AuditEntry{}
	}

	c.JSON(http.StatusOK, gin.H{"logs": entries, "total": len(entries)})
}

// DoctorHistoryEntry is one access event from the doctor's perspective.
type DoctorHistoryEntry struct {
	ID           string `json:"id"`
	PatientID    string `json:"patient_id"`
	PatientName  string `json:"patient_name"`
	AccessMethod string `json:"access_method"`
	AccessedAt   string `json:"accessed_at"`
}

// GetDoctorStats returns summary stats for the authenticated doctor.
// GET /api/doctor/stats
func (h *Handler) GetDoctorStats(c *gin.Context) {
	doctorID := c.GetString("user_id")

	var totalAccesses int
	var todayAccesses int
	var lastAccessedAt *string

	// Total accesses by this doctor
	h.db.QueryRow(context.Background(),
		`SELECT COUNT(*) FROM audit_logs WHERE doctor_id = $1`, doctorID,
	).Scan(&totalAccesses)

	// Today's accesses
	h.db.QueryRow(context.Background(),
		`SELECT COUNT(*) FROM audit_logs
		 WHERE doctor_id = $1 AND accessed_at >= CURRENT_DATE`, doctorID,
	).Scan(&todayAccesses)

	// Last access time
	var lastAt string
	err := h.db.QueryRow(context.Background(),
		`SELECT accessed_at::text FROM audit_logs
		 WHERE doctor_id = $1 ORDER BY accessed_at DESC LIMIT 1`, doctorID,
	).Scan(&lastAt)
	if err == nil {
		lastAccessedAt = &lastAt
	}

	c.JSON(http.StatusOK, gin.H{
		"total_accesses": totalAccesses,
		"today_accesses": todayAccesses,
		"last_accessed_at": lastAccessedAt,
	})
}

// GetDoctorHistory returns the list of patients this doctor has accessed.
// GET /api/doctor/my-history
func (h *Handler) GetDoctorHistory(c *gin.Context) {
	doctorID := c.GetString("user_id")

	rows, err := h.db.Query(context.Background(),
		`SELECT al.id, al.patient_id, u.name as patient_name,
		        al.access_method, al.accessed_at::text
		 FROM audit_logs al
		 JOIN users u ON u.id = al.patient_id
		 WHERE al.doctor_id = $1
		 ORDER BY al.accessed_at DESC
		 LIMIT 20`,
		doctorID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch history"})
		return
	}
	defer rows.Close()

	var entries []DoctorHistoryEntry
	for rows.Next() {
		var e DoctorHistoryEntry
		if err := rows.Scan(&e.ID, &e.PatientID, &e.PatientName, &e.AccessMethod, &e.AccessedAt); err != nil {
			continue
		}
		entries = append(entries, e)
	}

	if entries == nil {
		entries = []DoctorHistoryEntry{}
	}

	c.JSON(http.StatusOK, gin.H{"history": entries, "total": len(entries)})
}

