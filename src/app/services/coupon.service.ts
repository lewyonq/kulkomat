import { Injectable, inject, signal } from '@angular/core';
import { from, Observable, throwError, timeout } from 'rxjs';
import { catchError, map, tap, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import {
  CouponDTO,
  CouponsListDTO,
  CouponQueryParams,
  AddCouponFormViewModel,
} from '../types';
import { environment } from '../environment/environment';

/**
 * Coupon Service
 *
 * Manages coupon-related operations including fetching user coupons.
 * Uses AuthService for authentication state and Supabase client access.
 */
@Injectable({
  providedIn: 'root',
})
export class CouponService {
  private authService = inject(AuthService);

  public isLoading = signal<boolean>(false);
  public error = signal<Error | null>(null);

  /**
   * Get User Coupons
   * Fetches all coupons for the authenticated user
   *
   * @param params - Optional query parameters for filtering
   * @returns Observable<CouponsListDTO> - Paginated list of coupons
   */
  getUserCoupons(params?: CouponQueryParams): Observable<CouponsListDTO> {
    this.isLoading.set(true);
    this.error.set(null);

    const currentUser = this.authService.user();
    if (!currentUser) {
      this.isLoading.set(false);
      return throwError(() => new Error('User not authenticated'));
    }

    const session = this.authService.session();
    if (!session) {
      this.isLoading.set(false);
      return throwError(() => new Error('No active session'));
    }

    const accessToken = session.access_token;

    // Use native fetch API to avoid Supabase client blocking issues
    // This ensures queries work independently from realtime subscriptions
    const fetchPromise = fetch(
      `${environment.supabase.url}/rest/v1/coupons?user_id=eq.${currentUser.id}&select=*`,
      {
        method: 'GET',
        headers: {
          apikey: environment.supabase.anonKey,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Prefer: 'count=exact',
        },
      },
    ).then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const contentRange = response.headers.get('content-range');
      const count = contentRange ? parseInt(contentRange.split('/')[1]) : data.length;

      return { data, error: null, count };
    });

    return from(fetchPromise).pipe(
      timeout({
        each: 10000, // 10 second timeout
        with: () => throwError(() => new Error('Request timeout')),
      }),
      map(({ data, error, count }) => {
        if (error) {
          throw error;
        }

        return {
          coupons: data as CouponDTO[],
          total: count ?? 0,
          limit: params?.limit ?? 100,
          offset: params?.offset ?? 0,
        };
      }),
      tap(() => {
        this.isLoading.set(false);
      }),
      catchError((err) => {
        const errorMessage = err?.message || 'Failed to fetch coupons';
        console.error('Error fetching coupons:', errorMessage);
        this.error.set(new Error(errorMessage));
        this.isLoading.set(false);
        return throwError(() => new Error(errorMessage));
      }),
    );
  }

  /**
   * Get Coupon by ID
   * Fetches a single coupon by its ID
   *
   * @param couponId - The coupon ID to fetch
   * @returns Observable<CouponDTO> - The coupon data
   */
  getCouponById(couponId: number): Observable<CouponDTO> {
    this.isLoading.set(true);
    this.error.set(null);

    return from(
      this.authService.client.from('coupons').select('*').eq('id', couponId).single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error('Coupon not found');
        }

        return data as CouponDTO;
      }),
      tap(() => {
        this.isLoading.set(false);
      }),
      catchError((err) => {
        const errorMessage = err?.message || 'Failed to fetch coupon';
        this.error.set(new Error(errorMessage));
        this.isLoading.set(false);
        return throwError(() => new Error(errorMessage));
      }),
    );
  }

  /**
   * Use Coupon
   * Marks a coupon as used by the authenticated user
   *
   * @param couponId - The coupon ID to use
   * @returns Observable<CouponDTO> - The updated coupon data
   */
  useCoupon(couponId: number): Observable<CouponDTO> {
    this.isLoading.set(true);
    this.error.set(null);

    const currentUser = this.authService.user();

    if (!currentUser) {
      this.isLoading.set(false);
      return throwError(() => new Error('User not authenticated'));
    }

    return from(
      this.authService.client
        .from('coupons')
        .update({ status: 'used', used_at: new Date().toISOString() })
        .eq('id', couponId)
        .eq('user_id', currentUser.id)
        .eq('status', 'active')
        .select()
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error('Coupon not found or already used');
        }

        return data as CouponDTO;
      }),
      tap(() => {
        this.isLoading.set(false);
      }),
      catchError((err) => {
        const errorMessage = err?.message || 'Failed to use coupon';
        this.error.set(new Error(errorMessage));
        this.isLoading.set(false);
        return throwError(() => new Error(errorMessage));
      }),
    );
  }

  /**
   * Add Coupon (Admin)
   * Creates a new coupon for a customer by their short_id.
   * This method is used by admin panel to manually add coupons.
   *
   * Steps:
   * 1. Fetch user_id from profiles table using short_id
   * 2. Create coupon using the RPC function create_manual_coupon
   *
   * @param formData - Form data containing short_id, type, value, and expires_at
   * @returns Observable<CouponDTO> - The created coupon data
   */
  addCoupon(formData: AddCouponFormViewModel): Observable<CouponDTO> {
    this.isLoading.set(true);
    this.error.set(null);

    const currentUser = this.authService.user();
    if (!currentUser) {
      this.isLoading.set(false);
      return throwError(() => new Error('Admin not authenticated'));
    }

    // Step 1: Get user_id from short_id
    return from(
      this.authService.client
        .from('profiles')
        .select('id')
        .eq('short_id', formData.short_id)
        .single(),
    ).pipe(
      switchMap(({ data: profile, error: profileError }) => {
        if (profileError) {
          throw profileError;
        }

        if (!profile) {
          throw new Error('Nie znaleziono klienta o podanym ID');
        }

        // Step 2: Create coupon using RPC function
        // Convert date from YYYY-MM-DD to ISO 8601 format
        const expiresAtISO = new Date(formData.expires_at).toISOString();

        return from(
          this.authService.client
            .from('coupons')
            .insert({
              user_id: profile.id,
              type: formData.type,
              value: formData.value,
              expires_at: expiresAtISO,
              status: 'active',
            })
            .select()
            .single(),
        );
      }),
      map(({ data, error }) => {
        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error('Nie udało się utworzyć kuponu');
        }

        return data as CouponDTO;
      }),
      tap(() => {
        this.isLoading.set(false);
      }),
      catchError((err) => {
        const errorMessage = err?.message || 'Nie udało się dodać kuponu';
        console.error('Error adding coupon:', errorMessage);
        this.error.set(new Error(errorMessage));
        this.isLoading.set(false);
        return throwError(() => new Error(errorMessage));
      }),
    );
  }
}
