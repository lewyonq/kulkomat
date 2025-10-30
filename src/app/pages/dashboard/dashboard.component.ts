import { Component, OnInit, OnDestroy, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Supabase } from '../../services/supabase';
import { CouponService } from '../../services/coupon.service';
import { ProfileDTO } from '../../types';
import { StampProgressViewModel } from '../../types/view-models';
import { StampProgressComponent } from '../../components/dashboard/stamp-progress.component';
import { CouponNavigationCardComponent } from '../../components/dashboard/coupon-navigation-card.component';
import { IceCreamFlavorsList } from '../../components/ice-cream-flavors/ice-cream-flavors-list/ice-cream-flavors-list';

/**
 * Dashboard Component (Page Container)
 *
 * Main view accessible after user authentication.
 * Displays key information about the loyalty program:
 * - User's unique short_id with QR code
 * - Stamp collection progress (X/10)
 * - Navigation card to coupons
 *
 * Features:
 * - Realtime updates via Supabase subscription
 * - Loading and error states
 * - Retry mechanism on error
 * - Mobile-first responsive design
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    StampProgressComponent,
    CouponNavigationCardComponent,
    IceCreamFlavorsList,
  ],
  template: `
    <div class="dashboard-container">
      <!-- Loading State -->
      @if (isLoading() && !profile()) {
        <div class="loading-container">
          <div class="spinner"></div>
          <p class="loading-text">Ładowanie danych...</p>
        </div>
      }

      <!-- Error State -->
      @else if (error() && !profile()) {
        <div class="error-container">
          <div class="error-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
              <path d="M12 8V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              <circle cx="12" cy="16" r="1" fill="currentColor" />
            </svg>
          </div>
          <h2 class="error-title">Nie udało się pobrać danych</h2>
          <p class="error-message">{{ getErrorMessage() }}</p>
          <button class="retry-button" (click)="onRetry()" type="button">Spróbuj ponownie</button>
        </div>
      }

      <!-- Content State -->
      @else if (profile()) {
        <div class="content-wrapper">
          <!-- Header -->
          <!-- <header class="dashboard-header">
            <h1 class="welcome-title">
              Witaj w programie lojalnościowym! 👋
            </h1>
            <p class="welcome-subtitle">
              Zbieraj pieczątki i odbieraj darmowe lody
            </p>
          </header> -->

          <!-- Main Content -->
          <main class="dashboard-content">
            <!-- Coupon Navigation -->
            <section class="section">
              <app-coupon-navigation-card [activeCouponsCount]="activeCouponsCount()">
              </app-coupon-navigation-card>
            </section>
            <!-- Stamp Progress -->
            <section class="section">
              <app-stamp-progress [stampCount]="profile()!.stamp_count" [maxStamps]="10">
              </app-stamp-progress>
            </section>
            <!-- Ice Cream Flavors -->
            <section class="section">
              <app-ice-cream-flavors-list></app-ice-cream-flavors-list>
            </section>
          </main>

          <!-- Optional: Refresh Button (for manual refresh if realtime fails) -->
          @if (showRefreshButton()) {
            <div class="refresh-container">
              <button
                class="refresh-button"
                (click)="onRefresh()"
                [disabled]="refreshing()"
                type="button"
                aria-label="Odśwież dane"
              >
                <svg
                  class="refresh-icon"
                  [class.spinning]="refreshing()"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M21.5 2V8M21.5 8H16M21.5 8L18 4.5C16.5 3 14.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17 22 21 18.5 21.5 13.5"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                {{ refreshing() ? 'Odświeżanie...' : 'Odśwież' }}
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        min-height: 100vh;
        padding: 1rem;
      }

      /* Loading State */
      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        gap: 1.5rem;
      }

      .spinner {
        width: 48px;
        height: 48px;
        border: 4px solid #e0e0e0;
        border-top-color: #6750a4;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .loading-text {
        font-size: 1rem;
        color: #666;
        font-weight: 500;
      }

      /* Error State */
      .error-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        gap: 1.5rem;
        padding: 2rem;
        text-align: center;
      }

      .error-icon {
        width: 64px;
        height: 64px;
        color: #d32f2f;
      }

      .error-icon svg {
        width: 100%;
        height: 100%;
      }

      .error-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1a1a1a;
        margin: 0;
      }

      .error-message {
        font-size: 1rem;
        color: #666;
        margin: 0;
        max-width: 400px;
        line-height: 1.5;
      }

      .retry-button {
        padding: 0.875rem 2rem;
        background: #6750a4;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(103, 80, 164, 0.3);
      }

      .retry-button:hover {
        background: #5842a0;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(103, 80, 164, 0.4);
      }

      .retry-button:active {
        transform: translateY(0);
      }

      /* Content State */
      .content-wrapper {
        max-width: 800px;
        margin: 0 auto;
        padding-bottom: 2rem;
      }

      .dashboard-header {
        text-align: center;
        padding: 2rem 1rem;
        margin-bottom: 1rem;
      }

      .welcome-title {
        font-size: 1.75rem;
        font-weight: 700;
        color: #1a1a1a;
        margin: 0 0 0.5rem 0;
      }

      .welcome-subtitle {
        font-size: 1rem;
        color: #666;
        margin: 0;
      }

      .dashboard-content {
        flex-direction: column;
      }

      .section {
        width: 100%;
      }

      /* Refresh Button */
      .refresh-container {
        display: flex;
        justify-content: center;
        padding: 2rem 1rem;
      }

      .refresh-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: white;
        color: rgba(219, 39, 119, 1);
        border: 2px solid rgba(219, 39, 119, 1);
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .refresh-button:hover:not(:disabled) {
        background: rgba(236, 72, 153, 0.1);
        transform: translateY(-1px);
      }

      .refresh-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .refresh-icon {
        width: 20px;
        height: 20px;
      }

      .refresh-icon.spinning {
        animation: spin 1s linear infinite;
      }
    `,
  ],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private supabase = inject(Supabase);
  private couponService = inject(CouponService);
  private router = inject(Router);
  private realtimeSubscription: RealtimeChannel | null = null;

  // Loading and error states
  protected isLoading = signal<boolean>(true);
  protected error = signal<Error | null>(null);
  protected refreshing = signal<boolean>(false);

  // Data state
  protected profile = signal<ProfileDTO | null>(null);

  // Computed states
  protected shortId = computed<string | null>(() => {
    return this.profile()?.short_id ?? null;
  });

  protected stampProgress = computed<StampProgressViewModel | null>(() => {
    const currentProfile = this.profile();
    if (!currentProfile) return null;

    const current = currentProfile.stamp_count;
    const total = 10;

    return {
      current,
      total,
      percentage: (current / total) * 100,
      stampsToReward: Math.max(0, total - current),
      isComplete: current >= total,
    };
  });

  // Optional: Active coupons count (for future implementation)
  protected activeCouponsCount = signal<number | undefined>(undefined);

  // Show refresh button only if realtime connection fails
  protected showRefreshButton = signal<boolean>(false);

  ngOnInit(): void {
    this.loadProfile();
    this.loadActiveCouponsCount();
    this.setupRealtimeSubscription();
  }

  ngOnDestroy(): void {
    this.cleanupRealtimeSubscription();
  }

  /**
   * Load user profile from Supabase
   * Uses the centralized currentProfile signal to avoid concurrent API calls
   */
  private loadProfile(): void {
    const currentProfile = this.supabase.currentProfile();
    
    if (currentProfile) {
      this.profile.set(currentProfile);
      this.isLoading.set(false);
    } else {
      // Only fetch if not already loaded
      this.isLoading.set(true);
      this.error.set(null);

      this.supabase.getCurrentUserProfile().subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.error.set(err);
          this.isLoading.set(false);
        },
      });
    }
  }

  /**
   * Load active coupons count
   */
  private loadActiveCouponsCount(): void {
    this.couponService.getUserCoupons({ status: 'active' }).subscribe({
      next: (response) => {
        // Count only non-expired active coupons
        const now = new Date();
        const activeCount = response.coupons.filter((coupon) => {
          const expiresAt = new Date(coupon.expires_at);
          return coupon.status === 'active' && expiresAt > now;
        }).length;

        this.activeCouponsCount.set(activeCount);
      },
      error: (err) => {
        console.error('Failed to load active coupons count:', err);
        // Don't set error state, just log it
        // We don't want to block the dashboard if coupons fail to load
      },
    });
  }

  /**
   * Setup Realtime subscription for profile updates
   */
  private setupRealtimeSubscription(): void {
    const userId = this.supabase.user()?.id;
    if (!userId) {
      console.warn('Cannot setup realtime: user not authenticated');
      this.showRefreshButton.set(true);
      return;
    }

    try {
      this.realtimeSubscription = this.supabase.client
        .channel('profile-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${userId}`,
          },
          (payload) => {
            console.log('Realtime update received:', payload);
              // Update profile signal with new data
              this.profile.set(payload.new as ProfileDTO);
              // Reload active coupons count in case stamp count changed
              this.loadActiveCouponsCount();

              // Optional: Show toast notification
              // this.showToast('Otrzymałeś pieczątkę!');
          },
        )
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              this.showRefreshButton.set(true);
          } else if (status === 'CHANNEL_ERROR') {
            this.showRefreshButton.set(false);
            }
        });
    } catch (err) {
      this.showRefreshButton.set(true);
    }
  }

  /**
   * Cleanup Realtime subscription
   */
  private cleanupRealtimeSubscription(): void {
    if (this.realtimeSubscription) {
      this.supabase.client.removeChannel(this.realtimeSubscription);
      this.realtimeSubscription = null;
    }
  }

  /**
   * Retry loading profile after error
   */
  protected onRetry(): void {
    this.loadProfile();
  }

  /**
   * Manual refresh of profile data
   */
  protected onRefresh(): void {
    if (this.refreshing()) return;

    this.refreshing.set(true);
    this.supabase.refreshCurrentUserProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.loadActiveCouponsCount();
        this.refreshing.set(false);
      },
      error: (err) => {
        console.error('Failed to refresh profile:', err);
        this.refreshing.set(false);
      },
    });
  }

  /**
   * Get user-friendly error message
   */
  protected getErrorMessage(): string {
    const err = this.error();
    if (!err) return 'Wystąpił nieoczekiwany błąd.';

    const message = err.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return 'Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe.';
    }

    if (message.includes('not found')) {
      return 'Profil nie został znaleziony. Spróbuj wylogować się i zalogować ponownie.';
    }

    if (message.includes('not authenticated')) {
      return 'Sesja wygasła. Zaloguj się ponownie.';
    }

    return 'Wystąpił błąd podczas ładowania danych. Spróbuj ponownie później.';
  }

  /**
   * Optional: Show toast notification (requires toast service)
   */
  // private showToast(message: string): void {
  //   // Implementation with MatSnackBar or custom toast service
  // }
}
