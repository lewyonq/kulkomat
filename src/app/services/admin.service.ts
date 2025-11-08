import { Injectable, inject, signal } from '@angular/core';
import { from, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ProfileDTO, CouponDTO } from '../types';

/**
 * Admin Service
 *
 * Manages admin-specific operations such as customer lookup and management.
 * Used by admin panel components to interact with customer data.
 */
@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private authService = inject(AuthService);

  public isLoading = signal<boolean>(false);
  public error = signal<Error | null>(null);

  /**
   * Get Customer Details By Short ID
   * Fetches customer profile and active coupons using their short_id.
   *
   * @param shortId - The customer's short_id (6-character alphanumeric code)
   * @returns Observable<CustomerDetailsViewModel> - Combined customer data
   */
  getCustomerDetailsByShortId(shortId: string): Observable<ProfileDTO> {
    this.isLoading.set(true);
    this.error.set(null);

    const currentUser = this.authService.user();
    if (!currentUser) {
      this.isLoading.set(false);
      return throwError(() => new Error('Admin not authenticated'));
    }

    return from(
      this.authService.client.from('profiles').select('*').eq('short_id', shortId).single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        if (!data) {
          throw new Error('Customer not found');
        }

        return data as ProfileDTO;
      }),
      tap(() => {
        this.isLoading.set(false);
      }),
      catchError((err) => {
        const errorMessage = err?.message || 'Failed to fetch customer details';
        console.error('Error fetching customer details:', errorMessage);
        this.error.set(new Error(errorMessage));
        this.isLoading.set(false);
        return throwError(() => new Error(errorMessage));
      }),
    );
  }

  /**
   * Add Stamps to Customer
   * Adds specified number of stamps to a customer's account.
   *
   * @param userId - The customer's user_id
   * @param count - Number of stamps to add (1-10)
   * @returns Observable<void>
   */
  addStampsToCustomer(userId: string, count: number): Observable<void> {
    this.isLoading.set(true);
    this.error.set(null);

    return from(
      this.authService.client.rpc('add_stamps_to_user', {
        p_user_id: userId,
        p_count: count,
      }),
    ).pipe(
      map(({ error }) => {
        if (error) {
          throw error;
        }
      }),
      tap(() => {
        this.isLoading.set(false);
      }),
      catchError((err) => {
        const errorMessage = err?.message || 'Failed to add stamps';
        console.error('Error adding stamps:', errorMessage);
        this.error.set(new Error(errorMessage));
        this.isLoading.set(false);
        return throwError(() => new Error(errorMessage));
      }),
    );
  }

  /**
   * Create Manual Coupon
   * Creates a coupon manually for a customer.
   *
   * @param userId - The customer's user_id
   * @param type - Coupon type
   * @param value - Coupon value (null for free_scoop)
   * @param expiresAt - Expiration date
   * @returns Observable<CouponDTO>
   */
  createManualCoupon(
    userId: string,
    type: string,
    value: number | null,
    expiresAt: string,
  ): Observable<CouponDTO> {
    this.isLoading.set(true);
    this.error.set(null);

    return from(
      this.authService.client.rpc('create_manual_coupon', {
        p_user_id: userId,
        p_type: type,
        p_value: value,
        p_expires_at: expiresAt,
      }),
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        return data as CouponDTO;
      }),
      tap(() => {
        this.isLoading.set(false);
      }),
      catchError((err) => {
        const errorMessage = err?.message || 'Failed to create coupon';
        console.error('Error creating coupon:', errorMessage);
        this.error.set(new Error(errorMessage));
        this.isLoading.set(false);
        return throwError(() => new Error(errorMessage));
      }),
    );
  }

  /**
   * Use Coupon
   * Marks a coupon as used.
   *
   * @param couponId - The coupon ID
   * @param userId - The customer's user_id
   * @returns Observable<CouponDTO>
   */
  useCoupon(couponId: number, userId: string): Observable<CouponDTO> {
    this.isLoading.set(true);
    this.error.set(null);

    return from(
      this.authService.client.rpc('use_coupon', {
        p_coupon_id: couponId,
        p_user_id: userId,
      }),
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        return data as CouponDTO;
      }),
      tap(() => {
        this.isLoading.set(false);
      }),
      catchError((err) => {
        const errorMessage = err?.message || 'Failed to use coupon';
        console.error('Error using coupon:', errorMessage);
        this.error.set(new Error(errorMessage));
        this.isLoading.set(false);
        return throwError(() => new Error(errorMessage));
      }),
    );
  }
}
