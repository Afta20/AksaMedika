package api

import (
	"log"
	"net/http"
	"os"
	"sync"

	"github.com/aksa-medika/api/pkg/audit"
	"github.com/aksa-medika/api/pkg/auth"
	"github.com/aksa-medika/api/pkg/consent"
	"github.com/aksa-medika/api/pkg/db"
	"github.com/aksa-medika/api/pkg/kiosk"
	"github.com/aksa-medika/api/pkg/records"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

var (
	app  *gin.Engine
	once sync.Once
)

func init() {
	once.Do(func() {
		log.Println("Initializing Vercel Serverless Go API...")

		// Connect to Neon PostgreSQL
		pool, err := db.Connect()
		if err != nil {
			log.Printf("Failed to connect to database: %v", err)
		}

		app = gin.Default()

		frontendURL := os.Getenv("FRONTEND_URL")
		var origins []string
		if frontendURL != "" {
			origins = append(origins, frontendURL)
		}
		origins = append(origins, "http://localhost:3000", "https://aksa-medika.vercel.app")

		// CORS — allow Next.js frontend
		app.Use(cors.New(cors.Config{
			AllowOrigins:     origins,
			AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
			AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
			AllowCredentials: true,
		}))

		if pool != nil {
			authHandler := auth.NewHandler(pool)
			consentHandler := consent.NewHandler(pool)
			recordsHandler := records.NewHandler(pool)
			auditHandler := audit.NewHandler(pool)
			kioskHandler := kiosk.NewHandler(pool)

			// Health check route for root URL
			app.GET("/", func(c *gin.Context) {
				c.JSON(200, gin.H{
					"status":  "success",
					"message": "Aksamedika API is running on Vercel Serverless!",
				})
			})

			// Vercel routes all /api/... to this file, so we match the prefix
			apiGroup := app.Group("/api")
			{
				apiGroup.POST("/auth/register", authHandler.Register)
				apiGroup.POST("/auth/login", authHandler.Login)
			}
			
			// Kiosk public routes (no token required, it uses Doctor credentials directly)
			kioskGroup := apiGroup.Group("/kiosk")
			{
				kioskGroup.POST("/emergency-access", kioskHandler.EmergencyAccess)
			}

			patient := apiGroup.Group("/patient")
			patient.Use(auth.JWTMiddleware("patient"))
			{
				patient.POST("/consent/generate", consentHandler.Generate)
				patient.GET("/records", recordsHandler.ListPatientRecords)
				patient.GET("/audit", auditHandler.GetPatientAuditLog)
				patient.GET("/settings", authHandler.GetPatientSettings)
				patient.PUT("/settings", authHandler.UpdatePatientSettings)
			}

			doctor := apiGroup.Group("/doctor")
			doctor.Use(auth.JWTMiddleware("doctor"))
			{
				doctor.POST("/access", consentHandler.ValidateAccess)
				doctor.POST("/emergency-access", consentHandler.EmergencyAccess)
				doctor.GET("/records/:patient_id", recordsHandler.GetPatientRecordsForDoctor)
				doctor.POST("/records/:patient_id", recordsHandler.CreateRecord)
				doctor.GET("/records/:patient_id/summary", recordsHandler.GetPatientSummaryAI)
				doctor.GET("/stats", auditHandler.GetDoctorStats)
				doctor.GET("/my-history", auditHandler.GetDoctorHistory)
				doctor.GET("/profile", authHandler.GetDoctorProfile)
			}
		} else {
			app.Any("/*path", func(c *gin.Context) {
				c.JSON(500, gin.H{"error": "Database connection failed during Serverless cold start"})
			})
		}
	})
}

// Handler is the Vercel serverless entrypoint
func Handler(w http.ResponseWriter, r *http.Request) {
	app.ServeHTTP(w, r)
}
