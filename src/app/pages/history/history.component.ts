import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityHistory } from '../../services/activity-history';
import {
  ActivityHistoryViewModel,
  ActivityItemViewModel,
} from '../../types/view-models';
import {
  ActivityItemDTO,
  CouponType,
} from '../../types';
import { ActivityListComponent } from '../../components/history/activity-list.component';

/**
 * History View Component (Smart)
 *
 * Widok Historia - główny kontener strony /history.
 * Wyświetla chronologiczną listę aktywności użytkownika.
 *
 * Features:
 * - Loading, error i empty states
 * - Realtime mapowanie DTO na ViewModel
 * - Formatowanie dat i treści w języku polskim
 */
@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, ActivityListComponent],
  template: `
    <div class="history-container">
      <!-- Loading State (Initial Load) -->
      @if (isLoading() && viewModel().activities.length === 0) {
        <div class="loading-container">
          <div class="spinner"></div>
          <p class="loading-text">Ładowanie historii...</p>
        </div>
      }

      <!-- Error State -->
      @else if (error() && viewModel().activities.length === 0) {
        <div class="error-container">
          <div class="error-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
              <path d="M12 8V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              <circle cx="12" cy="16" r="1" fill="currentColor" />
            </svg>
          </div>
          <h2 class="error-title">Nie udało się pobrać historii</h2>
          <p class="error-message">{{ getErrorMessage() }}</p>
          <button class="retry-button" (click)="onRetry()" type="button">
            Spróbuj ponownie
          </button>
        </div>
      }

      <!-- Empty State -->
      @else if (!isLoading() && viewModel().activities.length === 0) {
        <div class="empty-container">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 7H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M3 12H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M3 17H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <h2 class="empty-title">Brak historii aktywności</h2>
          <p class="empty-message">
            Twoje aktywności pojawią się tutaj po zebraniu pierwszych pieczątek lub otrzymaniu kuponów.
          </p>
        </div>
      }

      <!-- Content State -->
      @else {
        <div class="content-wrapper">
          <!-- Header -->
          <header class="history-header">
            <h1 class="history-title">Historia aktywności</h1>
            <p class="history-subtitle">
              Twoja chronologiczna lista aktywności w programie lojalnościowym
            </p>
          </header>

          <!-- Activity List -->
          <main class="history-content">
            <app-activity-list
              [activities]="viewModel().activities"
            />
          </main>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .history-container {
        min-height: 100vh;
        padding: 1rem;
        padding-bottom: 5rem;
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
        border: 4px solid rgba(var(--color-primary), 0.2);
        border-top-color: rgb(var(--color-primary));
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
        color: rgb(var(--color-text-secondary));
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
        color: rgb(var(--color-error));
      }

      .error-icon svg {
        width: 100%;
        height: 100%;
      }

      .error-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: rgb(var(--color-text-primary));
        margin: 0;
      }

      .error-message {
        font-size: 1rem;
        color: rgb(var(--color-text-secondary));
        margin: 0;
        max-width: 400px;
        line-height: 1.5;
      }

      .retry-button {
        padding: 0.875rem 2rem;
        background: rgb(var(--color-primary));
        color: rgb(var(--color-text-on-primary));
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: var(--shadow-pink);
      }

      .retry-button:hover {
        background: rgb(var(--color-primary-light));
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
      }

      .retry-button:active {
        transform: translateY(0);
      }

      /* Empty State */
      .empty-container {
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
        width: 64px;
        height: 64px;
        color: rgb(var(--color-text-tertiary));
      }

      .empty-icon svg {
        width: 100%;
        height: 100%;
      }

      .empty-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: rgb(var(--color-text-primary));
        margin: 0;
      }

      .empty-message {
        font-size: 1rem;
        color: rgb(var(--color-text-secondary));
        margin: 0;
        max-width: 400px;
        line-height: 1.5;
      }

      /* Content State */
      .content-wrapper {
        max-width: 800px;
        margin: 0 auto;
      }

      .history-header {
        text-align: center;
        padding: 1.5rem 1rem;
        margin-bottom: 1.5rem;
      }

      .history-title {
        font-size: 1.75rem;
        font-weight: 700;
        color: rgb(var(--color-text-primary));
        margin: 0 0 0.5rem 0;
      }

      .history-subtitle {
        font-size: 1rem;
        color: rgb(var(--color-text-secondary));
        margin: 0;
      }

      .history-content {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

    `,
  ],
})
export class HistoryComponent implements OnInit {
  private activityHistoryService = inject(ActivityHistory);

  // State signals
  protected viewModel = signal<ActivityHistoryViewModel>({
    activities: [],
    total: 0,
    hasMore: false,
  });

  protected isLoading = computed(() => this.activityHistoryService.isLoading());
  protected error = computed(() => this.activityHistoryService.error());

  ngOnInit(): void {
    this.loadInitialData();
  }

  /**
   * Load all activity history
   */
  private loadInitialData(): void {
    this.activityHistoryService
      .getUserActivityHistory({
        limit: 50,
        offset: 0,
      })
      .subscribe({
        next: (response) => {
          const viewModel = this.mapDTOToViewModel(response);
          this.viewModel.set(viewModel);
        },
        error: (err) => {
          console.error('Failed to load activity history:', err);
          // Error handled by service signal
        },
      });
  }


  /**
   * Retry loading after error
   */
  protected onRetry(): void {
    this.loadInitialData();
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

    if (message.includes('not authenticated')) {
      return 'Sesja wygasła. Zaloguj się ponownie.';
    }

    return 'Nie udało się załadować historii. Spróbuj ponownie później.';
  }

  /**
   * Map ActivityHistoryDTO to ActivityHistoryViewModel
   */
  private mapDTOToViewModel(
    dto: import('../../types').ActivityHistoryDTO
  ): ActivityHistoryViewModel {
    return {
      activities: dto.activities.map((item) =>
        this.mapActivityItemToViewModel(item)
      ),
      total: dto.total,
      hasMore: dto.offset + dto.limit < dto.total,
    };
  }

  /**
   * Map ActivityItemDTO to ActivityItemViewModel
   * Generates title, description, date, icon, and color based on activity type
   */
  private mapActivityItemToViewModel(dto: ActivityItemDTO): ActivityItemViewModel {
    const date = this.formatDate(dto.created_at);

    switch (dto.type) {
      case 'stamp_added':
        return {
          id: dto.id,
          type: dto.type,
          title: 'Dodano pieczątkę',
          description: 'Otrzymano pieczątkę do kolekcji',
          date,
          icon: 'stamp-plus',
          color: 'linear-gradient(135deg, rgb(var(--color-primary-dark)), rgb(var(--color-primary)))',
        };

      case 'coupon_generated':
        const couponType = (dto.details as { coupon_type: CouponType }).coupon_type;
        const couponTitle = this.getCouponTitle(couponType);
        return {
          id: dto.id,
          type: dto.type,
          title: 'Otrzymano kupon',
          description: `Wygenerowano kupon: ${couponTitle}`,
          date,
          icon: 'coupon-generated',
          color: 'linear-gradient(135deg, rgb(var(--color-success)), rgb(var(--color-success-light)))',
        };

      case 'coupon_used':
        return {
          id: dto.id,
          type: dto.type,
          title: 'Wykorzystano kupon',
          description: 'Kupon został wykorzystany na zakupy',
          date,
          icon: 'coupon-used',
          color: 'var(--gradient-primary)',
        };

      case 'coupon_expired':
        return {
          id: dto.id,
          type: dto.type,
          title: 'Kupon wygasł',
          description: 'Kupon utracił ważność',
          date,
          icon: 'coupon-expired',
          color: 'linear-gradient(135deg, rgb(var(--color-error)), rgb(var(--color-error-light)))',
        };

      default:
        return {
          id: dto.id,
          type: dto.type,
          title: 'Aktywność',
          description: 'Nieznany typ aktywności',
          date,
          icon: 'stamp-plus',
          color: 'linear-gradient(135deg, rgb(var(--color-primary)), rgb(var(--color-primary-light)))',
        };
    }
  }

  /**
   * Format date to Polish locale string
   * Example: "14 października 2025"
   */
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  /**
   * Get coupon title based on type
   */
  private getCouponTitle(type: CouponType): string {
    switch (type) {
      case 'free_scoop':
        return 'Darmowa gałka';
      case 'percentage':
        return 'Rabat procentowy';
      case 'amount':
        return 'Rabat kwotowy';
      default:
        return 'Kupon';
    }
  }
}
