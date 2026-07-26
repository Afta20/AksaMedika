package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"io"
	"os"
)

// getSecretKey retrieves the 32-byte encryption key from environment variable.
func getSecretKey() ([]byte, error) {
	keyStr := os.Getenv("ENCRYPTION_KEY")
	if keyStr == "" {
		// Fallback for development if not set (NOT RECOMMENDED for production)
		keyStr = "aksamedika_super_secret_key_2025!"
	}
	// Key must be 16, 24, or 32 bytes for AES
	if len(keyStr) < 32 {
		// Pad with zero bytes if less than 32
		padded := make([]byte, 32)
		copy(padded, []byte(keyStr))
		return padded, nil
	}
	return []byte(keyStr[:32]), nil
}

// Encrypt encrypts a plaintext string using AES-GCM and returns a base64 encoded string.
func Encrypt(plaintext string) (string, error) {
	if plaintext == "" {
		return "", nil
	}
	key, err := getSecretKey()
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, aesGCM.NonceSize())
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := aesGCM.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// Decrypt decrypts a base64 encoded AES-GCM encrypted string back to plaintext.
func Decrypt(encryptedBase64 string) (string, error) {
	if encryptedBase64 == "" {
		return "", nil
	}
	key, err := getSecretKey()
	if err != nil {
		return "", err
	}

	encryptedData, err := base64.StdEncoding.DecodeString(encryptedBase64)
	if err != nil {
		// If it's not base64, it might be legacy plaintext, return as is (useful during migration)
		return encryptedBase64, nil
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := aesGCM.NonceSize()
	if len(encryptedData) < nonceSize {
		// If data is too short, it might be legacy plaintext
		return encryptedBase64, nil
	}

	nonce, ciphertext := encryptedData[:nonceSize], encryptedData[nonceSize:]
	plaintext, err := aesGCM.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		// Decryption failed (could be legacy plaintext)
		return encryptedBase64, nil
	}

	return string(plaintext), nil
}

// GenerateDataHash computes a SHA-256 hash of the combined inputs.
// This is used for Web3-ready Data Immutability.
func GenerateDataHash(patientID, diagnosis, visitDate string) string {
	dataToHash := fmt.Sprintf("%s|%s|%s", patientID, diagnosis, visitDate)
	hash := sha256.Sum256([]byte(dataToHash))
	return fmt.Sprintf("%x", hash)
}
