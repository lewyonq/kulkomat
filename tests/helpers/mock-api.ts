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
 * UWAGA: Ta funkcja NIE dodaje nowego route handler, tylko zapisuje state
 * Użyj setupMockRoutes() w beforeEach aby skonfigurować routing
 */
let mockCouponsData: CouponDTO[] = [];

export async function mockGetCoupons(page: Page, coupons: CouponDTO[]) {
  mockCouponsData = coupons;
}

/**
 * Mockuj endpoint PATCH /api/coupons (używane przez useCoupon)
 */
let mockUsedCoupon: CouponDTO | null = null;

export async function mockUseCoupon(page: Page, coupon: CouponDTO) {
  mockUsedCoupon = {
    ...coupon,
    status: 'used',
    used_at: new Date().toISOString(),
  };
}

/**
 * Setupuje wszystkie route handlers dla Supabase API oraz localStorage
 * Wywołaj to RAZ w beforeEach przed innymi mockami
 *
 * @param page - Playwright page object
 * @param supabaseUrl - URL Supabase (z environment.supabase.url aplikacji)
 */
export async function setupMockRoutes(page: Page, supabaseUrl?: string) {
  // Setup route handlers
  await page.route('**rest/v1/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    // Mock profiles endpoint
    if (url.includes('/rest/v1/profiles')) {
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
      return;
    }

    // Mock GET coupons endpoint
    if (method === 'GET' && url.includes('/rest/v1/coupons')) {
      const contentRange =
        mockCouponsData.length > 0
          ? `0-${mockCouponsData.length - 1}/${mockCouponsData.length}`
          : '0-0/0';

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Content-Range': contentRange,
        },
        body: JSON.stringify(mockCouponsData),
      });
      return;
    }

    // Mock PATCH coupons endpoint (use coupon)
    if (method === 'PATCH' && url.includes('/rest/v1/coupons') && mockUsedCoupon) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockUsedCoupon]),
      });
      return;
    }

    // For all other requests, continue
    await route.continue();
  });

  // Setup localStorage with mock auth session
  // If supabaseUrl is provided, use it to generate the correct localStorage key
  if (supabaseUrl) {
    const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
    const storageKey = `sb-${projectRef}-auth-token`;

    await page.evaluate(
      ({ key, value }) => {
        window.localStorage.setItem(key, value);
      },
      {
        key: storageKey,
        value: JSON.stringify({
          access_token: 'mock-test-access-token',
          token_type: 'bearer',
          expires_in: 315360000,
          expires_at: 2050000000,
          refresh_token: 'mock-test-refresh-token',
          user: {
            id: '00000000-0000-0000-0000-000000000001',
            aud: 'authenticated',
            role: 'authenticated',
            email: 'test@kulkomat.test',
          },
        }),
      },
    );
  }
}

/**
 * Przykład użycia:
 *
 * ```typescript
 * test.beforeEach(async ({ page }) => {
 *   await setupMockRoutes(page);
 *   await page.goto('/');
 * });
 *
 * test('should show coupons', async ({ page }) => {
 *   const mockCoupons = [
 *     createMockCoupon({ type: 'free_scoop', status: 'active' }),
 *     createMockCoupon({ type: 'percentage', value: 20, status: 'used' }),
 *   ];
 *
 *   // Ustaw mockowe dane (NIE dodaje route handler)
 *   await mockGetCoupons(page, mockCoupons);
 *
 *   // Przejdź do strony (setupMockRoutes z beforeEach obsłuży request)
 *   await page.goto('/coupons');
 *
 *   // ... assercje
 * });
 * ```
 */
