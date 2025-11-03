import { Component, OnInit, OnDestroy, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RealtimeChannel } from '@supabase/supabase-js';
import { take } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { CouponService } from '../../services/coupon.service';
import { StampProgressComponent } from '../../components/dashboard/stamp-progress.component';
import { CouponNavigationCardComponent } from '../../components/dashboard/coupon-navigation-card.component';
import { IceCreamFlavorsList } from '../../components/ice-cream-flavors/ice-cream-flavors-list/ice-cream-flavors-list';

/**
 * Dashboard Component (Page Container)
 *
 * Main view accessible after user authentication.
 * Displays key information about the loyalty program:
 * - Stamp collection progress (X/10)
 * - Navigation card to coupons
 * - Ice cream flavors list
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
      @if (isLoading() && !isAuthenticated()) {
        <div class="loading-container">
          <div class="spinner"></div>
          <p class="loading-text">Ładowanie danych...</p>
        </div>
      }

      <!-- Error State -->
      @else if (error() && !isAuthenticated()) {
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
        </div>
      }

      <!-- Content State -->
      @else if (isAuthenticated()) {
        <div class="content-wrapper">
          <main class="dashboard-content">
          
            <section class="section">
              <app-stamp-progress [maxStamps]="10"></app-stamp-progress>
            </section>
            <section class="section">
              <app-coupon-navigation-card [activeCouponsCount]="activeCouponsCount()">
              </app-coupon-navigation-card>
            </section>
            <section class="section">
              <app-ice-cream-flavors-list></app-ice-cream-flavors-list>
            </section>
          </main>
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

      /* Content State */
      .content-wrapper {
        max-width: 800px;
        margin: 0 auto;
        padding-bottom: 2rem;
      }

      .dashboard-content {
        flex-direction: column;
      }

      .section {
        width: 100%;
      }

      /* Removed unused header and refresh styles */
    `,
  ],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private couponService = inject(CouponService);
  private realtimeSubscription: RealtimeChannel | null = null;

  // Loading and error states
  protected isLoading = signal<boolean>(true);
  protected error = signal<Error | null>(null);

  protected isAuthenticated = computed(() => this.authService.isAuthenticated());
  protected activeCouponsCount = signal<number | undefined>(undefined);

  ngOnInit(): void {
    this.loadActiveCouponsCount();
  }

  ngOnDestroy(): void {
  }

  /**
   * Load active coupons count
   */
  private loadActiveCouponsCount(): void {
    this.couponService
      .getUserCoupons({ status: 'active' })
      .pipe(take(1)) // Auto-unsubscribe after first emission to prevent memory leaks
      .subscribe({
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
}
