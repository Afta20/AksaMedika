package notify

import (
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Handler manages SSE connections for real-time patient notifications.
type Handler struct {
	db      *pgxpool.Pool
	mu      sync.RWMutex
	clients map[string][]chan string // patientID -> list of open channels
}

// NewHandler creates a new SSE handler.
func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{
		db:      db,
		clients: make(map[string][]chan string),
	}
}

// addClient registers a new SSE channel for a patient.
func (h *Handler) addClient(patientID string) chan string {
	ch := make(chan string, 8)
	h.mu.Lock()
	h.clients[patientID] = append(h.clients[patientID], ch)
	h.mu.Unlock()
	return ch
}

// removeClient cleans up a closed SSE channel.
func (h *Handler) removeClient(patientID string, ch chan string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	channels := h.clients[patientID]
	filtered := channels[:0]
	for _, c := range channels {
		if c != ch {
			filtered = append(filtered, c)
		}
	}
	h.clients[patientID] = filtered
}

// NotifyPatient broadcasts a JSON message to all live SSE streams of a patient.
func (h *Handler) NotifyPatient(patientID string, message string) {
	h.mu.RLock()
	channels := h.clients[patientID]
	h.mu.RUnlock()

	for _, ch := range channels {
		select {
		case ch <- message:
		default:
			// channel full — drop the message rather than blocking
		}
	}
}

// PollAndNotify builds a JSON payload and pushes it to the patient's SSE streams.
// It is called by other handlers (e.g., consent) right after writing an audit log.
func (h *Handler) PollAndNotify(patientID, doctorName, accessMethod string) {
	msg := fmt.Sprintf(
		`{"doctor_name":%q,"access_method":%q,"timestamp":%q}`,
		doctorName,
		accessMethod,
		time.Now().UTC().Format(time.RFC3339),
	)
	h.NotifyPatient(patientID, msg)
}

// Stream is the GET /api/notify/stream endpoint (JWT-protected, patient role only).
// It holds the HTTP connection open and pushes SSE events to the browser.
func (h *Handler) Stream(c *gin.Context) {
	// JWTMiddleware stores the patient's UUID under "user_id"
	raw, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	patientID := fmt.Sprintf("%v", raw)

	ch := h.addClient(patientID)
	defer h.removeClient(patientID, ch)

	// SSE response headers
	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("X-Accel-Buffering", "no") // disable Nginx / Vercel buffering
	c.Writer.WriteHeader(http.StatusOK)

	// Initial ping so the frontend knows the stream is live
	fmt.Fprintf(c.Writer, "event: connected\ndata: {\"status\":\"ok\"}\n\n")
	c.Writer.Flush()

	ticker := time.NewTicker(20 * time.Second)
	defer ticker.Stop()

	log.Printf("[SSE] Patient %s connected", patientID)

	for {
		select {
		case msg := <-ch:
			fmt.Fprintf(c.Writer, "event: access\ndata: %s\n\n", msg)
			c.Writer.Flush()

		case <-ticker.C:
			// Heartbeat comment (ignored by browsers, keeps proxy alive)
			fmt.Fprintf(c.Writer, ": heartbeat\n\n")
			c.Writer.Flush()

		case <-c.Request.Context().Done():
			log.Printf("[SSE] Patient %s disconnected", patientID)
			return
		}
	}
}

// ── Package-level singleton ──────────────────────────────────────────────────

var (
	globalHandler *Handler
	globalOnce   sync.Once
)

// GetGlobal returns the package-level singleton, initialising it on first call.
// Other packages (e.g. consent) call this to push notifications.
func GetGlobal(db *pgxpool.Pool) *Handler {
	globalOnce.Do(func() {
		globalHandler = NewHandler(db)
	})
	// In case db was nil during cold start, update it now
	if db != nil && globalHandler.db == nil {
		globalHandler.db = db
	}
	return globalHandler
}
