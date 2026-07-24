# Aksamedika Monorepo Makefile
# Usage: make <target>

.PHONY: dev-api dev-web install-api install-web db-migrate db-seed

## Start the Go backend API (development)
dev-api:
	cd apps/api && go run ./cmd/server/...

## Start the Next.js frontend (development)
dev-web:
	cd apps/web && npm run dev

## Install Go dependencies
install-api:
	cd apps/api && go mod download && go mod tidy

## Install Node.js dependencies
install-web:
	cd apps/web && npm install

## Install all dependencies
install: install-api install-web

## Run SQL schema migration against Neon (requires psql and DATABASE_URL)
db-migrate:
	psql "$(DATABASE_URL)" -f infra/db/migrations/001_init_schema.sql
	psql "$(DATABASE_URL)" -f infra/db/migrations/002_rls_policies.sql

## Seed the database with demo data
db-seed:
	psql "$(DATABASE_URL)" -f infra/db/seed.sql

## Build Go binary for production
build-api:
	cd apps/api && go build -o bin/careguard-api ./cmd/server/...

## Build Next.js for production
build-web:
	cd apps/web && npm run build

## Run all tests
test:
	cd apps/api && go test ./...

## Check Go formatting and linting
lint-api:
	cd apps/api && gofmt -l . && go vet ./...
