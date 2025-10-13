import { Injectable, inject, signal } from '@angular/core';
import { from, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Supabase } from './supabase';
import { CouponDTO, CouponsListDTO, CouponQueryParams, UseCouponCommand } from '../types';

/**
 * Coupon Service
 *
 * Manages coupon-related operations including fetching user coupons.
 * Integrates with Supabase for data persistence and real-time updates.
 */
@Injectable({
  providedIn: 'root',
})
export class CouponService {
  private supabase = inject(Supabase);

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

    const currentUser = this.supabase.user();

    if (!currentUser) {
      this.isLoading.set(false);
      throw new Error('User not authenticated');
    }

    return from(
      this.supabase.client
        .from('coupons')
        .select('*', { count: 'exact' })
        .eq('user_id', currentUser.id),
    ).pipe(
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

    return from(this.supabase.client.from('coupons').select('*').eq('id', couponId).single()).pipe(
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

    const currentUser = this.supabase.user();

    if (!currentUser) {
      this.isLoading.set(false);
      return throwError(() => new Error('User not authenticated'));
    }

    return from(
      this.supabase.client
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
}
