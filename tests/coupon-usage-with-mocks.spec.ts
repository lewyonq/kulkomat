import { test, expect } from '@playwright/test';
import { createMockCoupon, mockGetCoupons, mockUseCoupon } from './helpers/mock-api';

/**
 * Testy flow kuponów z mockowanym API
 *
 * Te testy używają mockowych danych zamiast prawdziwej bazy danych,
 * dzięki czemu mogą działać niezależnie od stanu backendu.
 */
test.describe('Coupon Usage Flow (with API mocks)', () => {
  test.beforeEach(async ({ page }) => {
    // Przed każdym testem przejdź do strony głównej
    await page.goto('/');
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

    // 5. Poczekaj na załadowanie kuponów
    await page.waitForTimeout(1000);

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
    const confirmDialog = page.locator('app-confirmation-dialog');
    await expect(confirmDialog).toBeVisible();

    // 11. Potwierdź wykorzystanie
    await page.getByRole('button', { name: 'Tak' }).click();

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

    // 3. Poczekaj na załadowanie
    await page.waitForTimeout(1000);

    // 4. Sprawdź pusty stan
    const emptyState = page.locator('.empty-state');
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
    await page.waitForTimeout(1000);

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
    await page.waitForTimeout(1000);

    // 3. Kliknij na kupon
    await page.locator('.coupon-card.clickable').first().click();

    // 4. Dialog się pojawia
    await expect(page.locator('app-confirmation-dialog')).toBeVisible();

    // 5. Kliknij "Nie"
    await page.getByRole('button', { name: 'Nie' }).click();

    // 6. Dialog znika
    await expect(page.locator('app-confirmation-dialog')).not.toBeVisible();

    // 7. Kupon nadal jest aktywny
    await expect(page.locator('.coupon-card.clickable')).toBeVisible();
  });
});
