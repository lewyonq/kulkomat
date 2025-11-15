import { Page } from '@playwright/test';
import { CouponDTO } from '../../src/app/types';

/**
 * Mock API responses for testing
 * Używaj tych helperów aby symulować odpowiedzi backendu bez potrzeby prawdziwej bazy danych
 */

export interface MockCouponOptions {
  id?: number;
  type?: 'free_scoop' | 'percentage' | 'amount';
  status?: 'active' | 'used' | 'expired';
  value?: number | null;
  created_at?: string;
  expires_at?: string;
  user_id?: string;
  used_at?: string;
}

/**
 * Utwórz mockowy kupon z domyślnymi wartościami
 */
export function createMockCoupon(options: MockCouponOptions = {}): CouponDTO {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);

  return {
    id: options.id || 123,
    type: options.type || 'free_scoop',
    status: options.status || 'active',
    value: options.value !== undefined ? options.value : null,
    created_at: options.created_at || now.toISOString(),
    expires_at: options.expires_at || futureDate.toISOString(),
    user_id: options.user_id || '00000000-0000-0000-0000-000000000001',
    used_at: options.used_at || null,
  };
}

/**
 * Mockuj endpoint /api/coupons aby zwracał podane kupony
 */
export async function mockGetCoupons(page: Page, coupons: CouponDTO[]) {
  await page.route('**/rest/v1/coupons*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(coupons),
    });
  });
}

/**
 * Mockuj endpoint POST /api/coupons/:id/use aby zwracał użyty kupon
 */
export async function mockUseCoupon(page: Page, coupon: CouponDTO) {
  const usedCoupon: CouponDTO = {
    ...coupon,
    status: 'used',
  };

  await page.route(`**/rest/v1/rpc/use_coupon`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(usedCoupon),
    });
  });
}

/**
 * Przykład użycia:
 *
 * ```typescript
 * test('should show coupons', async ({ page }) => {
 *   const mockCoupons = [
 *     createMockCoupon({ type: 'free_scoop', status: 'active' }),
 *     createMockCoupon({ type: 'percentage', value: 20, status: 'used' }),
 *   ];
 *
 *   await mockGetCoupons(page, mockCoupons);
 *   await page.goto('/coupons');
 *
 *   // ... assercje
 * });
 * ```
 */
