import { test, expect } from '@playwright/test';
import { createMockCoupon, mockGetCoupons, mockUseCoupon } from './helpers/mock-api';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Testy flow kuponów z mockowanym API
 *
 * Te testy używają mockowych danych zamiast prawdziwej bazy danych,
 * dzięki czemu mogą działać niezależnie od stanu backendu.
 */
test.describe('Coupon Usage Flow (with API mocks)', () => {
  test.beforeEach(async ({ page }) => {
    // Mockuj endpoint profilu użytkownika (potrzebny dla auth guard)
    // Supabase REST API zwraca tablicę, nawet dla .single()
    await page.route('**/rest/v1/profiles*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '00000000-0000-0000-0000-000000000001',
            short_id: 'TEST123',
            stamp_count: 5,
            created_at: new Date().toISOString(),
          },
        ]),
      });
    });

    // Ustaw mockową sesję w localStorage PRZED pierwszym załadowaniem strony
    const mockAuthFile = path.join(__dirname, 'auth/user.json');
    const authData = JSON.parse(fs.readFileSync(mockAuthFile, 'utf-8'));

    // Pobierz Supabase URL ze zmiennej środowiskowej i wygeneruj klucz
    const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
    const projectRef = supabaseUrl.includes('supabase.co')
      ? new URL(supabaseUrl).hostname.split('.')[0]
      : 'localhost';
    const storageKey = `sb-${projectRef}-auth-token`;

    // Najpierw idź do strony głównej aby ustawić origin dla localStorage
    await page.goto('/');

    // Teraz ustaw localStorage
    await page.evaluate(
      ({ key, value }) => {
        window.localStorage.setItem(key, value);
      },
      { key: storageKey, value: JSON.stringify(authData) },
    );

    // Odśwież stronę aby aplikacja wczytała sesję z localStorage
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('should display active coupons and allow using them', async ({ page }) => {
    // 1. Przygotuj mockowe dane
    const activeCoupon = createMockCoupon({
      id: 'test-coupon-1',
      type: 'free_scoop',
      status: 'active',
    });

    const usedCoupon = createMockCoupon({
      id: 'test-coupon-2',
      type: 'percentage',
      value: 20,
      status: 'used',
    });

    // 2. Mockuj endpoint pobierania kuponów
    await mockGetCoupons(page, [activeCoupon, usedCoupon]);

    // 3. Mockuj endpoint wykorzystania kuponu
    await mockUseCoupon(page, activeCoupon);

    // 4. Przejdź do strony kuponów
    await page.goto('/coupons');
    await page.waitForLoadState('networkidle');

    // 5. Poczekaj na załadowanie kuponów - czekaj na pierwszy element
    await page.locator('.coupon-card').first().waitFor({ state: 'visible', timeout: 10000 });

    // 6. Sprawdź czy oba kupony są widoczne
    const couponCards = page.locator('.coupon-card');
    await expect(couponCards).toHaveCount(2);

    // 7. Znajdź aktywny kupon
    const activeCouponCard = page.locator('.coupon-card.clickable').first();
    await expect(activeCouponCard).toBeVisible();

    // 8. Sprawdź status
    await expect(activeCouponCard.locator('.status-badge.active')).toBeVisible();

    // 9. Kliknij na aktywny kupon
    await activeCouponCard.click();

    // 10. Sprawdź dialog potwierdzenia
    const confirmDialog = page.locator('.dialog-overlay');
    await expect(confirmDialog).toBeVisible();

    // 11. Potwierdź wykorzystanie
    await page.getByRole('button', { name: 'Potwierdź' }).click();

    // 12. Sprawdź komunikat sukcesu
    const successToast = page.locator('.success-toast');
    await expect(successToast).toBeVisible({ timeout: 5000 });
    await expect(successToast.getByText('Kupon został wykorzystany!')).toBeVisible();

    // 13. Toast powinien zniknąć po kilku sekundach
    await expect(successToast).not.toBeVisible({ timeout: 5000 });
  });

  test('should show empty state when no coupons', async ({ page }) => {
    // 1. Mockuj pustą listę kuponów
    await mockGetCoupons(page, []);

    // 2. Przejdź do strony kuponów
    await page.goto('/coupons');
    await page.waitForLoadState('networkidle');

    // 3. Poczekaj na załadowanie - czekaj na empty state
    const emptyState = page.locator('.empty-state');
    await emptyState.waitFor({ state: 'visible', timeout: 10000 });

    // 4. Sprawdź pusty stan
    await expect(emptyState).toBeVisible();

    // 5. Sprawdź tekst
    await expect(page.getByText('Nie masz jeszcze żadnych kuponów')).toBeVisible();
  });

  test('should show only active coupons as clickable', async ({ page }) => {
    // 1. Przygotuj różne typy kuponów
    const coupons = [
      createMockCoupon({ type: 'free_scoop', status: 'active' }),
      createMockCoupon({ type: 'percentage', value: 20, status: 'used' }),
      createMockCoupon({
        type: 'amount',
        value: 10,
        status: 'active',
        expires_at: new Date(Date.now() - 86400000).toISOString(), // wygasły wczoraj
      }),
    ];

    // 2. Mockuj endpoint
    await mockGetCoupons(page, coupons);

    // 3. Przejdź do strony kuponów
    await page.goto('/coupons');
    await page.waitForLoadState('networkidle');

    // 3.5 Poczekaj na załadowanie kuponów
    await page.locator('.coupon-card').first().waitFor({ state: 'visible', timeout: 10000 });

    // 4. Sprawdź że jest dokładnie 1 aktywny (klikalny) kupon
    const clickableCoupons = page.locator('.coupon-card.clickable');
    await expect(clickableCoupons).toHaveCount(1);

    // 5. Sprawdź że są 2 nieaktywne kupony
    const inactiveCoupons = page.locator('.coupon-card.inactive');
    await expect(inactiveCoupons).toHaveCount(2);
  });

  test('should allow canceling coupon usage', async ({ page }) => {
    // 1. Mockuj kupony
    const activeCoupon = createMockCoupon({ type: 'free_scoop', status: 'active' });
    await mockGetCoupons(page, [activeCoupon]);

    // 2. Przejdź do kuponów
    await page.goto('/coupons');
    await page.waitForLoadState('networkidle');

    // 2.5 Poczekaj na kupon
    await page
      .locator('.coupon-card.clickable')
      .first()
      .waitFor({ state: 'visible', timeout: 10000 });

    // 3. Kliknij na kupon
    await page.locator('.coupon-card.clickable').first().click();

    // 4. Dialog się pojawia
    await expect(page.locator('.dialog-overlay')).toBeVisible();

    // 5. Kliknij "Nie"
    await page.getByRole('button', { name: 'Anuluj' }).click();

    // 6. Dialog znika
    await expect(page.locator('.dialog-overlay')).not.toBeVisible();

    // 7. Kupon nadal jest aktywny
    await expect(page.locator('.coupon-card.clickable')).toBeVisible();
  });
});
