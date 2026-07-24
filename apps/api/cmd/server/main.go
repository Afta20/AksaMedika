package main

import (
	"log"
	"os"

	"github.com/aksa-medika/api/internal/auth"
	"github.com/aksa-medika/api/internal/audit"
	"github.com/aksa-medika/api/internal/consent"
	"github.com/aksa-medika/api/internal/db"
	"github.com/aksa-medika/api/internal/records"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Try multiple locations for .env depending on where the user runs the command from
	_ = godotenv.Load(".env")
	_ = godotenv.Load("../../.env")
	_ = godotenv.Load("../../../../.env")
	if os.Getenv("DATABASE_URL") == "" {
		log.Println("No .env file found or loaded, reading from environment")
	}

	// Connect to Neon PostgreSQL
	pool, err := db.Connect()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	r := gin.Default()

	// CORS — allow Next.js frontend
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{os.Getenv("FRONTEND_URL"), "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// Handlers
	authHandler := auth.NewHandler(pool)
	consentHandler := consent.NewHandler(pool)
	recordsHandler := records.NewHandler(pool)
	auditHandler := audit.NewHandler(pool)

	// Public routes
	api := r.Group("/api")
	{
		api.POST("/auth/register", authHandler.Register)
		api.POST("/auth/login", authHandler.Login)
	}

	// Protected routes — Patient only
	patient := api.Group("/patient")
	patient.Use(auth.JWTMiddleware("patient"))
	{
		patient.POST("/consent/generate", consentHandler.Generate)
		patient.GET("/records", recordsHandler.ListPatientRecords)
		patient.GET("/audit", auditHandler.GetPatientAuditLog)
	}

	// Protected routes — Doctor only
	doctor := api.Group("/doctor")
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

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Aksamedika API running on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
