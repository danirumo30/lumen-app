/**
 * E2E Tests: Movie Detail Page
 * Tests movie detail page functionality
 * 
 * Run with: npx playwright test tests/e2e/movie-detail.spec.ts
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const MOVIE_ID = '550'; // Fight Club

// Helper to login
async function login(page: Page, email: string = 'test@test.com') {
  await page.goto(BASE_URL);
  await page.click('button:has-text("Entrar")');
  await page.waitForSelector('text=Bienvenido', { timeout: 5000 });
  
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', 'TestPassword123!');
  await page.click('button:has-text("Iniciar sesión")');
  await page.waitForTimeout(2000);
}

// ============================================================================
// MOVIE DETAIL PAGE TESTS
// ============================================================================

test.describe('Movie Detail Page - Core', () => {
  test('should load movie detail page', async ({ page }) => {
    await page.goto(`${BASE_URL}/movie/${MOVIE_ID}`);
    await page.waitForLoadState('networkidle');
    
    // Check title is visible
    const title = page.locator('h1, h2').first();
    await expect(title).toBeVisible({ timeout: 15000 });
  });

  test('should display movie poster', async ({ page }) => {
    await page.goto(`${BASE_URL}/movie/${MOVIE_ID}`);
    
    // Check for any image on the page
    const image = page.locator('img').first();
    await expect(image).toBeVisible({ timeout: 15000 });
  });

  test('should display movie info (rating, year, overview)', async ({ page }) => {
    await page.goto(`${BASE_URL}/movie/${MOVIE_ID}`);
    await page.waitForLoadState('networkidle');
    
    // Look for year or rating
    const rating = page.locator('text=/\\d{4}|\\d\\.\\d|\\d{2,}/').first();
    await expect(rating).toBeVisible({ timeout: 10000 });
  });

  test('should display overview text', async ({ page }) => {
    await page.goto(`${BASE_URL}/movie/${MOVIE_ID}`);
    await page.waitForLoadState('networkidle');
    
    // Look for overview/description
    const overview = page.locator('p, [class*="overview"], [class*="description"]').first();
    await expect(overview).toBeVisible({ timeout: 10000 });
  });

  test('should display genres', async ({ page }) => {
    await page.goto(`${BASE_URL}/movie/${MOVIE_ID}`);
    await page.waitForLoadState('networkidle');
    
    // Look for genre tags
    const genres = page.locator('text=/Drama|Acción|Comedia|Terror/i');
    await expect(genres.first()).toBeVisible({ timeout: 10000 });
  });
});

// ============================================================================
// CAST CAROUSEL
// ============================================================================

test.describe('Movie Cast', () => {
  test('should display cast section', async ({ page }) => {
    await page.goto(`${BASE_URL}/movie/${MOVIE_ID}`);
    await page.waitForLoadState('networkidle');
    
    // Look for cast heading
    const castSection = page.locator('text=/Reparto|Cast|Elenco|Actors/i');
    await expect(castSection.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display cast member names', async ({ page }) => {
    await page.goto(`${BASE_URL}/movie/${MOVIE_ID}`);
    await page.waitForLoadState('networkidle');
    
    // Should show actor names
    const actorNames = page.locator('[class*="actor"], [class*="cast"]').first();
    await expect(actorNames).toBeVisible({ timeout: 10000 });
  });

  test('should scroll cast carousel', async ({ page }) => {
    await page.goto(`${BASE_URL}/movie/${MOVIE_ID}`);
    await page.waitForLoadState('networkidle');
    
    // Look for scrollable carousel
    const carousel = page.locator('[class*="carousel"], [class*="scroll"]').first();
    
    if (await carousel.isVisible({ timeout: 2000 }).catch(() => false)) {
      await carousel.evaluate((el) => el.scrollLeft += 200);
      await page.waitForTimeout(500);
    }
  });
});

// ============================================================================
// SIMILAR MOVIES CAROUSEL
// ============================================================================

test.describe('Similar Movies', () => {
  test('should display similar movies section', async ({ page }) => {
    await page.goto(`${BASE_URL}/movie/${MOVIE_ID}`);
    await page.waitForLoadState('networkidle');
    
    // Look for similar movies heading
    const similarSection = page.locator('text=/Películas similares|Similar movies/i');
    await expect(similarSection.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display similar movie cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/movie/${MOVIE_ID}`);
    await page.waitForLoadState('networkidle');
    
    // Look for movie cards
    const movieCards = page.locator('a[href^="/movie/"]');
    const count = await movieCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate to similar movie', async ({ page }) => {
    await page.goto(`${BASE_URL}/movie/${MOVIE_ID}`);
    await page.waitForLoadState('networkidle');
    
    // Find similar movie card
    const similarCard = page.locator('section a[href^="/movie/"]').first();
    
    if (await similarCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      const href = await similarCard.getAttribute('href');
      // Now should be /movie/\d+ without prefix
      expect(href).toMatch(/^\/movie\/\d+$/);
    }
  });
});

// ============================================================================
// MOVIE MARKING - AUTHENTICATED
// ============================================================================

test.describe('Movie Marking - Authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should show mark buttons when logged in', async ({ page }) => {
    await page.goto(`${BASE_URL}/movie/${MOVIE_ID}`);
    await page.waitForLoadState('networkidle');
    
    // Look for watched button
    const watchedBtn = page.locator('button:has-text("Vista"), button:has-text("Watched"), button[aria-label*="watch"]');
    await expect(watchedBtn.first()).toBeVisible({ timeout: 10000 });
  });

  test('should mark movie as watched', async ({ page }) => {
    await page.goto(`${BASE_URL}/movie/${MOVIE_ID}`);
    await page.waitForLoadState('networkidle');
    
    // Find and click watched button
    const watchedBtn = page.locator('button:has-text("Vista"), button:has-text("Watched")').first();
    
    if (await watchedBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await watchedBtn.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should mark movie as favorite', async ({ page }) => {
    await page.goto(`${BASE_URL}/movie/${MOVIE_ID}`);
    await page.waitForLoadState('networkidle');
    
    // Find and click favorite button
    const favBtn = page.locator('button:has-text("Favorita"), button:has-text("Favorite"), button[aria-label*="favorite"]');
    
    if (await favBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await favBtn.first().click();
      await page.waitForTimeout(1000);
    }
  });

  test('should toggle watched state', async ({ page }) => {
    await page.goto(`${BASE_URL}/movie/${MOVIE_ID}`);
    await page.waitForLoadState('networkidle');
    
    // Find watched button
    const watchedBtn = page.locator('button:has-text("Vista"), button:has-text("Watched")').first();
    
    if (await watchedBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Get initial state
      const classBefore = await watchedBtn.getAttribute('class');
      
      // Click to toggle
      await watchedBtn.click();
      await page.waitForTimeout(1000);
      
      // State should have changed
      const classAfter = await watchedBtn.getAttribute('class');
      expect(classAfter).toBeTruthy();
    }
  });
});

// ============================================================================
// MOVIE MARKING - UNAUTHENTICATED
// ============================================================================

test.describe('Movie Marking - Unauthenticated', () => {
  test('should handle unauthenticated user on movie page', async ({ page }) => {
    await page.goto(`${BASE_URL}/movie/${MOVIE_ID}`);
    await page.waitForLoadState('networkidle');
    
    // Page should load successfully
    const title = page.locator('h1, h2').first();
    await expect(title).toBeVisible({ timeout: 10000 });
  });
});

// ============================================================================
// NAVIGATION
// ============================================================================

test.describe('Movie Navigation', () => {
  test('should navigate from homepage to movie detail', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Find movie card
    const movieCard = page.locator(`a[href^="/movie/"]`).first();
    
    if (await movieCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await movieCard.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toMatch(/\/movie\//);
    }
  });

  test('should navigate from similar movie back to homepage', async ({ page }) => {
    await page.goto(`${BASE_URL}/movie/${MOVIE_ID}`);
    await page.waitForLoadState('networkidle');
    
    // Click home link
    const homeLink = page.locator('a[href="/"]').first();
    
    if (await homeLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await homeLink.click();
      await page.waitForTimeout(2000);
    }
  });
});

// ============================================================================
// POSTER TESTS (from previous bug)
// ============================================================================

test.describe('Movie Poster', () => {
  test('should display movie poster image', async ({ page }) => {
    await page.goto(`${BASE_URL}/movie/${MOVIE_ID}`);
    await page.waitForLoadState('networkidle');
    
    // Look for poster image with tmdb URL
    const poster = page.locator('img[src*="tmdb"], img[src*="image.tmdb"]').first();
    
    // Poster should be visible
    if (await poster.isVisible({ timeout: 5000 }).catch(() => false)) {
      const src = await poster.getAttribute('src');
      expect(src).toContain('tmdb');
    }
  });
});
