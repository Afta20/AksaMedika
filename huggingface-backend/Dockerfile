# =============================================================================
# Multi-stage Dockerfile for Go API — optimized for Railway deployment
# =============================================================================

# ---- Build Stage ----
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Install build deps
RUN apk add --no-cache git ca-certificates

# Copy module files and download deps first (Docker cache layer)
COPY go.mod go.sum ./
RUN go mod download

# Copy source
COPY . .

# Build binary
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-w -s" \
    -o /aksamedika-api \
    ./cmd/server/...

# ---- Run Stage ----
FROM alpine:3.19

WORKDIR /app

# Add CA certs for HTTPS (Neon SSL connection)
RUN apk add --no-cache ca-certificates tzdata

# Set up a non-root user (Hugging Face requirement)
RUN adduser -D -u 1000 user
USER user

# Copy binary from builder
COPY --from=builder /aksamedika-api .

# Expose Hugging Face default port
ENV PORT=7860
EXPOSE 7860

# Run
CMD ["./aksamedika-api"]
