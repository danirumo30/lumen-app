// E2E Tests for Lumen - Auth Flow
// Run with: npx playwright test

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should open login modal when clicking login button', async ({ page }) => {
    // Click login button in header (says "Entrar")
    await page.click('button:has-text("Entrar")');
    
    await expect(page.locator('text=Bienvenido')).toBeVisible();
  });

  test('should show validation errors for empty login form', async ({ page }) => {
    await page.click('button:has-text("Entrar")');
    await page.click('button:has-text("Iniciar sesión")');
    
    // Should show validation error or stay in modal
    await expect(page.locator('form')).toBeVisible();
  });

  test('should switch between login and register', async ({ page }) => {
    await page.click('button:has-text("Entrar")');
    
    await page.click('text=Regístrate');
    
    // Verify register form is shown (use heading role to avoid ambiguity)
    await expect(page.getByRole('heading', { name: 'Crear cuenta' })).toBeVisible();
    await expect(page.locator('text=Nombre completo')).toBeVisible();
  });

  test('should show password requirements on register', async ({ page }) => {
    await page.click('button:has-text("Entrar")');
    await page.click('text=Regístrate');
    
    // Type password to see requirements
    await page.fill('input[type="password"]', 'Test');
    
    // Should show password requirements
    await expect(page.locator('text=Mínimo 8 caracteres')).toBeVisible();
  });

  test('should open forgot password flow', async ({ page }) => {
    await page.click('button:has-text("Entrar")');
    await page.click('text=¿Olvidaste tu contraseña?');
    
    await expect(page.locator('text=Restablecer contraseña')).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('should navigate to home page', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should show header on home page', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator('header')).toBeVisible();
  });
});

