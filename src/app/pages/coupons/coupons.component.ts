import { Component, OnInit, OnDestroy, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CouponService } from '../../services/coupon.service';
import { CouponCardComponent } from '../../components/coupons/coupon-card.component';
import { CouponDTO, CouponType } from '../../types';
import { CouponCardViewModel } from '../../types/view-models';

/**
 * Coupons Component (Page Container)
 *
 * Main view for displaying user's coupons.
 * Features:
 * - List of all coupons (active and inactive)
 * - Sorted by status (active first) and date (newest first)
 * - Loading and error states
 * - Empty state when no coupons
 * - Retry mechanism on error
 * - Visual distinction between coupon types and statuses
 */
@Component({
  selector: 'app-coupons',
  standalone: true,
  imports: [CommonModule, CouponCardComponent],
  template: `
    <div class="coupons-container">
      <!-- Loading State -->
      @if (isLoading() && !hasCoupons()) {
        <div class="loading-container">
          <div class="spinner"></div>
          <p class="loading-text">Ładowanie kuponów...</p>
        </div>
      }

      <!-- Error State -->
      @else if (error() && !hasCoupons()) {
        <div class="error-container">
          <div class="error-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
              <path d="M12 8V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              <circle cx="12" cy="16" r="1" fill="currentColor" />
            </svg>
          </div>
          <h2 class="error-title">Nie udało się pobrać kuponów</h2>
          <p class="error-message">{{ getErrorMessage() }}</p>
          <button class="retry-button" (click)="onRetry()" type="button">Spróbuj ponownie</button>
        </div>
      }

      <!-- Empty State -->
      @else if (isEmpty()) {
        <div class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M3 8C3 7.44772 3.44772 7 4 7H20C20.5523 7 21 7.44772 21 8V10C19.8954 10 19 10.8954 19 12C19 13.1046 19.8954 14 21 14V16C21 16.5523 20.5523 17 20 17H4C3.44772 17 3 16.5523 3 16V14C4.10457 14 5 13.1046 5 12C5 10.8954 4.10457 10 3 10V8Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M9 7V17"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-dasharray="2 2"
              />
            </svg>
          </div>
          <h2 class="empty-title">Nie masz jeszcze żadnych kuponów</h2>
          <p class="empty-message">Zbieraj pieczątki, aby otrzymać darmową gałkę!</p>
        </div>
      }

      <!-- Content State -->
      @else if (hasCoupons()) {
        <div class="content-wrapper">
          <!-- Header -->
          <header class="coupons-header">
            <h1 class="page-title">Moje kupony</h1>
            @if (activeCouponsCount() > 0) {
              <p class="subtitle">
                Masz <strong>{{ activeCouponsCount() }}</strong>
                {{ activeCouponsCount() === 1 ? 'aktywny kupon' : 'aktywne kupony' }}
              </p>
            }
          </header>

          <!-- Coupons Grid -->
          <main class="coupons-content">
            @for (coupon of sortedCoupons(); track coupon.id) {
              <app-coupon-card [coupon]="coupon"></app-coupon-card>
            }
          </main>

          <!-- Refresh Button -->
          <div class="refresh-container">
            <button
              class="refresh-button"
              (click)="onRefresh()"
              [disabled]="refreshing()"
              type="button"
              aria-label="Odśwież kupony"
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
        </div>
      }
    </div>
  `,
  styles: [
    `
      .coupons-container {
        min-height: 100vh;
        background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
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

      /* Empty State */
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        gap: 1.5rem;
        padding: 2rem;
        text-align: center;
      }

      .empty-icon {
        width: 80px;
        height: 80px;
        color: #9e9e9e;
      }

      .empty-icon svg {
        width: 100%;
        height: 100%;
      }

      .empty-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1a1a1a;
        margin: 0;
      }

      .empty-message {
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

      .coupons-header {
        text-align: center;
        padding: 2rem 1rem;
        margin-bottom: 1rem;
      }

      .page-title {
        font-size: 1.75rem;
        font-weight: 700;
        color: #1a1a1a;
        margin: 0 0 0.5rem 0;
      }

      .subtitle {
        font-size: 1rem;
        color: #666;
        margin: 0;
      }

      .subtitle strong {
        color: #6750a4;
        font-weight: 700;
      }

      .coupons-content {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 0 1rem;
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
        color: #6750a4;
        border: 2px solid #6750a4;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .refresh-button:hover:not(:disabled) {
        background: #f5f3ff;
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

      /* Responsive Design */
      @media (max-width: 640px) {
        .coupons-container {
          padding: 0.5rem;
        }

        .coupons-header {
          padding: 1.5rem 0.5rem;
        }

        .page-title {
          font-size: 1.5rem;
        }

        .subtitle {
          font-size: 0.875rem;
        }

        .coupons-content {
          padding: 0 0.5rem;
        }
      }

      @media (min-width: 768px) {
        .coupons-content {
          gap: 1.5rem;
        }

        .page-title {
          font-size: 2rem;
        }
      }
    `,
  ],
})
export class CouponsComponent implements OnInit, OnDestroy {
  private couponService = inject(CouponService);
  private router = inject(Router);
  private subscription: Subscription | null = null;

  // Loading and error states
  protected isLoading = signal<boolean>(true);
  protected error = signal<Error | null>(null);
  protected refreshing = signal<boolean>(false);

  // Data state
  protected coupons = signal<CouponCardViewModel[]>([]);

  // Computed states
  protected sortedCoupons = computed(() => {
    return this.coupons().sort((a, b) => {
      // Active coupons first
      if (a.isActive !== b.isActive) {
        return a.isActive ? -1 : 1;
      }
      // Then by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  });

  protected activeCoupons = computed(() => this.coupons().filter((c) => c.isActive));

  protected activeCouponsCount = computed(() => this.activeCoupons().length);

  protected isEmpty = computed(() => this.coupons().length === 0);

  protected hasCoupons = computed(() => this.coupons().length > 0);

  ngOnInit(): void {
    this.loadCoupons();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  /**
   * Load coupons from API
   */
  private loadCoupons(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.subscription = this.couponService.getUserCoupons().subscribe({
      next: (response) => {
        const viewModels = response.coupons.map((dto) => this.transformCouponToViewModel(dto));
        this.coupons.set(viewModels);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err);
        this.isLoading.set(false);
        console.error('Failed to load coupons:', err);
      },
    });
  }

  /**
   * Transform CouponDTO to CouponCardViewModel
   */
  private transformCouponToViewModel(dto: CouponDTO): CouponCardViewModel {
    const now = new Date();
    const expiresAt = new Date(dto.expires_at);

    const isExpired = expiresAt <= now;
    const isUsed = dto.status === 'used';
    const isActive = !isExpired && !isUsed;

    return {
      id: dto.id,
      type: dto.type,
      value: dto.value,
      status: dto.status,
      createdAt: dto.created_at,
      expiresAt: dto.expires_at,
      isActive,
      isExpired,
      isUsed,
      title: this.getCouponTitle(dto.type, dto.value),
      description: this.getCouponDescription(dto.type, dto.value),
      formattedExpiryDate: this.formatExpiryDate(dto.expires_at),
      iconGradient: this.getIconGradient(dto.type),
      iconName: this.getIconName(dto.type),
    };
  }

  /**
   * Get coupon title based on type and value
   */
  private getCouponTitle(type: CouponType, value: number | null): string {
    switch (type) {
      case 'free_scoop':
        return 'Darmowa gałka';
      case 'percentage':
        return `Rabat ${value}%`;
      case 'amount':
        return `Rabat ${value} zł`;
      default:
        return 'Kupon';
    }
  }

  /**
   * Get coupon description based on type
   */
  private getCouponDescription(type: CouponType, value: number | null): string {
    switch (type) {
      case 'free_scoop':
        return 'Jedna gałka lodów dowolnego smaku za darmo';
      case 'percentage':
        return `${value}% zniżki na cały zakup`;
      case 'amount':
        return `${value} zł zniżki na cały zakup`;
      default:
        return 'Kupon rabatowy';
    }
  }

  /**
   * Format expiry date to Polish locale
   */
  private formatExpiryDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      return `Ważny do ${date.toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })}`;
    } catch (err) {
      console.warn('Failed to format date:', dateString, err);
      return `Ważny do ${dateString}`;
    }
  }

  /**
   * Get icon gradient based on coupon type
   */
  private getIconGradient(type: CouponType): string {
    switch (type) {
      case 'free_scoop':
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      case 'percentage':
        return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
      case 'amount':
        return 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
      default:
        return 'linear-gradient(135deg, #9e9e9e 0%, #757575 100%)';
    }
  }

  /**
   * Get icon name based on coupon type
   */
  private getIconName(type: CouponType): 'ticket' | 'percent' | 'coins' {
    switch (type) {
      case 'free_scoop':
        return 'ticket';
      case 'percentage':
        return 'percent';
      case 'amount':
        return 'coins';
      default:
        return 'ticket';
    }
  }

  /**
   * Retry loading coupons after error
   */
  protected onRetry(): void {
    this.loadCoupons();
  }

  /**
   * Manual refresh of coupons
   */
  protected onRefresh(): void {
    if (this.refreshing()) return;

    this.refreshing.set(true);
    this.couponService.getUserCoupons().subscribe({
      next: (response) => {
        const viewModels = response.coupons.map((dto) => this.transformCouponToViewModel(dto));
        this.coupons.set(viewModels);
        this.refreshing.set(false);
        console.log('Coupons refreshed successfully');
      },
      error: (err) => {
        console.error('Failed to refresh coupons:', err);
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

    if (message.includes('not authenticated') || message.includes('unauthorized')) {
      return 'Sesja wygasła. Zaloguj się ponownie.';
    }

    return 'Wystąpił błąd podczas ładowania kuponów. Spróbuj ponownie później.';
  }
}
