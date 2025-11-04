import { Injectable, inject, signal } from '@angular/core';
import { from, Observable, throwError, Subscriber, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Stamp Service
 *
 * Manages stamp-related operations, such as fetching the count of active stamps.
 */
@Injectable({
  providedIn: 'root',
})
export class StampService {
  private authService = inject(AuthService);

  public isLoading = signal<boolean>(false);
  public error = signal<Error | null>(null);

  private stampCountCache = signal<number | null>(null);

  /**
   * Get Active Stamps Count
   * Fetches the count of active stamps for the authenticated user.
   *
   * @returns Observable<number> - The count of active stamps.
   */
  /**
   * Get Customer's Active Stamps Count
   * Fetches the count of active stamps for a specific customer.
   *
   * @param userId - The ID of the user.
   * @returns Observable<number> - The count of active stamps.
   */
  getCustomerStampsCount(userId: string): Observable<number> {
    this.isLoading.set(true);
    this.error.set(null);

    return from(
      this.authService.client
        .from('stamps')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'active')
    ).pipe(
      map(({ count, error }) => {
        if (error) {
          throw error;
        }
        return count ?? 0;
      }),
      tap(() => {
        this.isLoading.set(false);
      }),
      catchError((err) => {
        const errorMessage = err?.message || 'Failed to fetch customer stamps count';
        console.error('Error fetching customer stamps count:', errorMessage);
        this.error.set(new Error(errorMessage));
        this.isLoading.set(false);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  getActiveStampsCount(): Observable<number> {
    if (this.stampCountCache() !== null) {
      return of(this.stampCountCache()!);
    }

    this.isLoading.set(true);
    this.error.set(null);

    const currentUser = this.authService.user();
    if (!currentUser) {
      this.isLoading.set(false);
      return throwError(() => new Error('User not authenticated'));
    }

    return from(
      this.authService.client
        .from('stamps')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id)
        .eq('status', 'active')
    ).pipe(
      map(({ count, error }) => {
        if (error) {
          throw error;
        }
        const stampCount = count ?? 0;
        this.stampCountCache.set(stampCount);
        console.log("api call made to get stamps");
        return stampCount;
      }),
      tap(() => {
        this.isLoading.set(false);
      }),
      catchError((err) => {
        const errorMessage = err?.message || 'Failed to fetch active stamps count';
        console.error('Error fetching active stamps count:', errorMessage);
        this.error.set(new Error(errorMessage));
        this.isLoading.set(false);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Watch Active Stamps Count
   * Subscribes to realtime updates for the count of active stamps.
   *
   * @returns Observable<number> - A stream of active stamp counts.
   */
  watchActiveStampsCount(): Observable<number> {
    this.isLoading.set(true);
    const currentUser = this.authService.user();
    if (!currentUser) {
      this.isLoading.set(false);
      return throwError(() => new Error('User not authenticated'));
    }

    return new Observable((subscriber: Subscriber<number>) => {
      let channel: RealtimeChannel | null = null;

      const setupRealtimeChannel = (initialCount: number) => {
        let stampCount = initialCount;
        
        channel = this.authService.client
          .channel('public:stamps')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'stamps', filter: `user_id=eq.${currentUser.id}` },
            (payload) => {
              if (payload.new['status'] === 'active') {
                stampCount++;
                this.stampCountCache.set(stampCount);
                subscriber.next(stampCount);
              }
            }
          )
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'stamps', filter: `user_id=eq.${currentUser.id}` },
            (payload) => {
              const oldStatus = payload.old['status'];
              const newStatus = payload.new['status'];
              if (oldStatus !== newStatus) {
                if (oldStatus === 'active' && newStatus !== 'active') {
                  stampCount--;
                  this.stampCountCache.set(stampCount);
                } else if (oldStatus !== 'active' && newStatus === 'active') {
                  stampCount++;
                  this.stampCountCache.set(stampCount);
                }
                subscriber.next(stampCount);
              }
            }
          )
          .on(
            'postgres_changes',
            { event: 'DELETE', schema: 'public', table: 'stamps', filter: `user_id=eq.${currentUser.id}` },
            (payload) => {
              if (payload.old['status'] === 'active') {
                stampCount--;
                this.stampCountCache.set(stampCount);
                subscriber.next(stampCount);
              }
            }
          )
          .subscribe();
      };

      // Fetch initial count and setup realtime after
      this.getActiveStampsCount().subscribe({
        next: (initialStampCount) => {
          this.stampCountCache.set(initialStampCount);
          subscriber.next(initialStampCount);
          setupRealtimeChannel(initialStampCount);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error fetching active stamps count:', err);
          this.error.set(err);
          this.isLoading.set(false);
          subscriber.error(err);
        },
      });

      return () => {
        if (channel) {
          this.authService.client.removeChannel(channel);
        }
      };
    });
  }
}
