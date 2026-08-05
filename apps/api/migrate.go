package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	// Parse .env from root directory (2 levels up)
	envFile, err := os.ReadFile("../../.env")
	if err == nil {
		lines := strings.Split(string(envFile), "\n")
		for _, line := range lines {
			if strings.HasPrefix(line, "DATABASE_URL=") {
				url := strings.TrimSpace(strings.TrimPrefix(line, "DATABASE_URL="))
				os.Setenv("DATABASE_URL", url)
			}
		}
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	config, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		log.Fatalf("failed to parse config: %v", err)
	}

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		log.Fatalf("failed to create pool: %v", err)
	}
	defer pool.Close()

	// 1. Add NIK to users
	fmt.Println("Altering users table to add NIK...")
	_, err = pool.Exec(context.Background(), "ALTER TABLE users ADD COLUMN IF NOT EXISTS nik VARCHAR(16) UNIQUE;")
	if err != nil {
		log.Fatalf("failed to alter users: %v", err)
	}

	// 2. Add data_integrity_hash to medical_records
	fmt.Println("Altering medical_records table to add data_integrity_hash...")
	_, err = pool.Exec(context.Background(), "ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS data_integrity_hash TEXT;")
	if err != nil {
		log.Fatalf("failed to alter medical_records: %v", err)
	}

	fmt.Println("Migrations completed successfully!")
}
