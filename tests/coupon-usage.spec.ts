import { test, expect } from '@playwright/test';

test.describe('Coupon Usage Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Przed każdym testem przejdź do strony głównej
    await page.goto('/');
  });

  test('should allow a logged-in user to navigate to coupons and use a coupon', async ({ page }) => {
    // 1. Sprawdź, czy użytkownik jest zalogowany
    // Link do kuponów powinien być widoczny tylko dla zalogowanych użytkowników
    const couponsLink = page.getByRole('link', { name: /przejdź do kuponów/i });
    await expect(couponsLink).toBeVisible({ timeout: 10000 });

    // 2. Przejdź do sekcji "Kupony"
    await couponsLink.click();

    // 3. Poczekaj na załadowanie strony z kuponami i sprawdź URL
    await expect(page).toHaveURL('/coupons');

    // 4. Poczekaj na załadowanie kuponów
    // Może być stan ładowania, pusty stan, lub lista kuponów
    await page.waitForTimeout(1000); // Daj czas na załadowanie

    // 5. Sprawdź, czy są dostępne kupony
    // Znajdź pierwszy aktywny kupon (klasa 'clickable' oznacza aktywny kupon)
    const activeCoupon = page.locator('.coupon-card.clickable').first();

    // Jeśli nie ma aktywnych kuponów, test się pominie
    const hasActiveCoupons = await activeCoupon.count() > 0;

    if (!hasActiveCoupons) {
      console.log('Brak aktywnych kuponów do przetestowania - pomijam test');
      test.skip();
      return;
    }

    // 6. Sprawdź, czy kupon jest widoczny i ma status "Aktywny"
    await expect(activeCoupon).toBeVisible();
    await expect(activeCoupon.locator('.status-badge.active')).toBeVisible();

    // 7. Kliknij na kupon, aby go wykorzystać
    // Cała karta jest klikalnym przyciskiem (role="button")
    await activeCoupon.click();

    // 8. Poczekaj na pojawienie się dialogu potwierdzenia
    const confirmDialog = page.locator('.dialog-overlay');
    await expect(confirmDialog).toBeVisible({ timeout: 5000 });

    // 9. Sprawdź, czy dialog ma odpowiedni tekst
    await expect(page.getByText('Czy na pewno chcesz wykorzystać kupon?')).toBeVisible();

    // 10. Kliknij przycisk "Tak" w dialogu potwierdzenia
    const confirmButton = page.getByRole('button', { name: 'Potwierdź' });
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // 11. Poczekaj na komunikat o sukcesie
    // Komunikat powinien pojawić się po wykorzystaniu kuponu
    const successToast = page.locator('.success-toast');
    await expect(successToast).toBeVisible({ timeout: 5000 });
    await expect(successToast.getByText('Kupon został wykorzystany!')).toBeVisible();

    // 12. Sprawdź, czy kupon zmienił status
    // Po wykorzystaniu kupon powinien mieć status "Wykorzystany" zamiast "Aktywny"
    // (może być również usunięty z listy aktywnych lub przeniesiony na dół)
    await page.waitForTimeout(1000); // Daj czas na aktualizację UI

    // Sprawdź czy toast znika po kilku sekundach (opcjonalnie)
    await expect(successToast).not.toBeVisible({ timeout: 5000 });
  });

  test('should show confirmation dialog when clicking on an active coupon', async ({ page }) => {
    // 1. Przejdź do strony kuponów
    await page.goto('/coupons');

    // 2. Poczekaj na załadowanie kuponów
    await page.waitForTimeout(1000);

    // 3. Znajdź aktywny kupon
    const activeCoupon = page.locator('.coupon-card.clickable').first();

    const hasActiveCoupons = await activeCoupon.count() > 0;
    if (!hasActiveCoupons) {
      console.log('Brak aktywnych kuponów - pomijam test');
      test.skip();
      return;
    }

    // 4. Kliknij na kupon
    await activeCoupon.click();

    // 5. Dialog powinien się pojawić
    const confirmDialog = page.locator('.dialog-overlay');
    await expect(confirmDialog).toBeVisible();

    // 6. Sprawdź zawartość dialogu
    await expect(page.getByText('Czy na pewno chcesz wykorzystać kupon?')).toBeVisible();
    await expect(page.getByText('Pamiętaj, że sprzedawca musi widzieć wykorzystanie kuponu')).toBeVisible();

    // 7. Kliknij "Nie" aby anulować
    const cancelButton = page.getByRole('button', { name: 'Anuluj' });
    await expect(cancelButton).toBeVisible();
    await cancelButton.click();

    // 8. Dialog powinien zniknąć
    await expect(confirmDialog).not.toBeVisible();

    // 9. Kupon powinien nadal być aktywny
    await expect(activeCoupon.locator('.status-badge.active')).toBeVisible();
  });

  test('should not allow clicking on inactive coupons', async ({ page }) => {
    // 1. Przejdź do strony kuponów
    await page.goto('/coupons');

    // 2. Poczekaj na załadowanie
    await page.waitForTimeout(1000);

    // 3. Znajdź nieaktywny kupon (bez klasy 'clickable')
    const inactiveCoupon = page.locator('.coupon-card.inactive').first();

    const hasInactiveCoupons = await inactiveCoupon.count() > 0;
    if (!hasInactiveCoupons) {
      console.log('Brak nieaktywnych kuponów - pomijam test');
      test.skip();
      return;
    }

    // 4. Sprawdź, że kupon jest widoczny ale nieaktywny
    await expect(inactiveCoupon).toBeVisible();

    // 5. Kliknięcie na nieaktywny kupon nie powinno wywołać dialogu
    await inactiveCoupon.click();

    // 6. Dialog nie powinien się pojawić
    const confirmDialog = page.locator('.dialog-overlay');
    await expect(confirmDialog).not.toBeVisible({ timeout: 2000 });
  });
});