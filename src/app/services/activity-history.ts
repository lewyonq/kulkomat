import { Injectable, inject, signal } from '@angular/core';
import { from, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Supabase } from './supabase';
import {
  ActivityHistoryDTO,
  ActivityHistoryQueryParams,
  ActivityItemDTO,
  ActivityHistoryViewRow,
  ActivityDetails,
  ActivityType,
} from '../types';

@Injectable({
  providedIn: 'root'
})
export class ActivityHistory {
  private supabase = inject(Supabase);

  public isLoading = signal<boolean>(false);
  public error = signal<Error | null>(null);

  /**
   * Get User Activity History
   * Fetches activity history for the authenticated user from the activity_history view
   *
   * @param params - Optional query parameters for filtering and pagination
   * @returns Observable<ActivityHistoryDTO> - Paginated list of activity items
   */
  getUserActivityHistory(params?: ActivityHistoryQueryParams): Observable<ActivityHistoryDTO> {
    const currentUser = this.supabase.user();

    if (!currentUser) {
      const authError = new Error('User not authenticated');
      this.error.set(authError);
      return throwError(() => authError);
    }

    return this._fetchActivityHistory(currentUser.id, params);
  }

  /**
   * Get Activity History by User ID (Seller Only)
   * Fetches activity history for a specific user by their ID
   *
   * @param userId - The user ID to fetch activity for
   * @param params - Optional query parameters for filtering and pagination
   * @returns Observable<ActivityHistoryDTO> - Paginated list of activity items
   */
  getActivityHistoryByUserId(
    userId: string,
    params?: ActivityHistoryQueryParams,
  ): Observable<ActivityHistoryDTO> {
    return this._fetchActivityHistory(userId, params);
  }

  /**
   * Private method to fetch activity history for a given user ID.
   * Reduces code duplication between public methods.
   */
  private _fetchActivityHistory(
    userId: string,
    params?: ActivityHistoryQueryParams
  ): Observable<ActivityHistoryDTO> {
    this.isLoading.set(true);
    this.error.set(null);

    const limit = params?.limit ?? 50;
    const offset = params?.offset ?? 0;

    return from(
      this.supabase.client
        .from('activity_history')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),
    ).pipe(
      map(({ data, error, count }) => {
        if (error) {
          throw error;
        }

        const activities = (data as ActivityHistoryViewRow[]).map((row) =>
          this.mapViewRowToActivityItem(row)
        );

        return {
          activities,
          total: count ?? 0,
          limit,
          offset,
        };
      }),
      tap(() => {
        this.isLoading.set(false);
      }),
      catchError((err: Error) => {
        this.error.set(err);
        this.isLoading.set(false);
        return throwError(() => err);
      })
    );
  }

  /**
   * Map View Row to Activity Item DTO
   * Transforms raw view row data into typed ActivityItemDTO
   *
   * @param row - Raw row from activity_history view
   * @returns ActivityItemDTO - Typed activity item
   */
  private mapViewRowToActivityItem(row: ActivityHistoryViewRow): ActivityItemDTO {
    return {
      type: row.type as ActivityType,
      id: row.id,
      user_id: row.user_id,
      details: row.details as ActivityDetails,
      created_at: row.created_at,
    };
  }
}
