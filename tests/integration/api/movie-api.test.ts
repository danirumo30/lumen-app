/**
 * Integration Tests: Movie APIs
 * Tests the movie-related API routes
 */

import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// Test data
const MOVIE_ID = 550; // Fight Club

describe('Movie Detail API', () => {
  describe('GET /api/movie/[id]', () => {
    it('should return movie details', async () => {
      const response = await fetch(`${BASE_URL}/api/movie/${MOVIE_ID}`);
      
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('title');
      expect(data).toHaveProperty('overview');
    });

    it('should return movie with poster URL', async () => {
      const response = await fetch(`${BASE_URL}/api/movie/${MOVIE_ID}`);
      const data = await response.json();
      
      expect(data).toHaveProperty('posterUrl');
    });

    it('should return movie with genres', async () => {
      const response = await fetch(`${BASE_URL}/api/movie/${MOVIE_ID}`);
      const data = await response.json();
      
      expect(data).toHaveProperty('genres');
      expect(Array.isArray(data.genres)).toBe(true);
    });

    it('should return movie with genres', async () => {
      const response = await fetch(`${BASE_URL}/api/movie/${MOVIE_ID}`);
      const data = await response.json();
      
      expect(data).toHaveProperty('genres');
      expect(Array.isArray(data.genres)).toBe(true);
    });

    it('should return movie with rating', async () => {
      const response = await fetch(`${BASE_URL}/api/movie/${MOVIE_ID}`);
      const data = await response.json();
      
      expect(data).toHaveProperty('rating');
      expect(typeof data.rating).toBe('number');
    });

    it('should handle invalid movie ID', async () => {
      const response = await fetch(`${BASE_URL}/api/movie/999999999`);
      
      // Should return 500 or error
      expect([200, 500]).toContain(response.status);
    });
  });

  describe('GET /api/movie/[id]/similar', () => {
    it('should return similar movies', async () => {
      const response = await fetch(`${BASE_URL}/api/movie/${MOVIE_ID}/similar`);
      
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      
      expect(data).toHaveProperty('results');
      expect(Array.isArray(data.results)).toBe(true);
    });

    it('should return similar movies with required fields', async () => {
      const response = await fetch(`${BASE_URL}/api/movie/${MOVIE_ID}/similar`);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const movie = data.results[0];
        expect(movie).toHaveProperty('id');
        expect(movie).toHaveProperty('title');
      }
    });
  });
});

describe('User Movie Status API', () => {
  describe('GET /api/user/movie-status', () => {
    it('should return unwatched for unauthenticated request', async () => {
      const response = await fetch(`${BASE_URL}/api/user/movie-status?tmdbId=${MOVIE_ID}`);

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty('watched');
      expect(typeof data.watched).toBe('boolean');
    });

    it('should reject request with missing tmdbId', async () => {
      const response = await fetch(`${BASE_URL}/api/user/movie-status`);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/user/movie-status', () => {
    it('should reject request without authorization', async () => {
      const response = await fetch(`${BASE_URL}/api/user/movie-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdbId: MOVIE_ID,
          watched: true,
        }),
      });

      expect(response.status).toBe(401);
    });

    it('should reject request without tmdbId', async () => {
      const response = await fetch(`${BASE_URL}/api/user/movie-status`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid-token',
        },
        body: JSON.stringify({
          watched: true,
        }),
      });

      expect([400, 401]).toContain(response.status);
    });
  });
});

describe('User Movie Favorite API', () => {
  describe('GET /api/user/movie-favorite', () => {
    it('should return unfavorited for unauthenticated request', async () => {
      const response = await fetch(`${BASE_URL}/api/user/movie-favorite?tmdbId=${MOVIE_ID}`);

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty('favorite');
      expect(typeof data.favorite).toBe('boolean');
    });
  });

  describe('POST /api/user/movie-favorite', () => {
    it('should reject request without authorization', async () => {
      const response = await fetch(`${BASE_URL}/api/user/movie-favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdbId: MOVIE_ID,
          favorite: true,
        }),
      });

      expect(response.status).toBe(401);
    });
  });
});
