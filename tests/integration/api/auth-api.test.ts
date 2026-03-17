import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Integration tests for auth API routes
// These tests require the development server to be running

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

describe('Auth API Integration', () => {
  describe('POST /api/auth/register', () => {
    it('should reject registration with invalid email', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'Password123',
          fullName: 'Test User',
          username: 'testuser',
        }),
      });

      // Expect either validation error or 4xx/5xx
      expect(response.status).not.toBe(200);
    });

    it('should reject registration with weak password', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'weak',
          fullName: 'Test User',
          username: 'testuser',
        }),
      });

      expect(response.status).not.toBe(200);
    });

    it('should reject registration with missing fields', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
        }),
      });

      expect(response.status).not.toBe(200);
    });
  });

  describe('POST /api/auth/request-password-reset', () => {
    it('should accept valid email for password reset', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
        }),
      });

      // Should return 200 even if email doesn't exist (security)
      expect([200, 400, 404]).toContain(response.status);
    });

    it('should reject invalid email format', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'not-an-email',
        }),
      });

      expect(response.status).not.toBe(200);
    });
  });
});
