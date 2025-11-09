import { Component, OnInit, computed, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ActivityHistory } from '../../../services/activity-history';
import { ActivityHistoryViewModel, ActivityItemViewModel } from '../../../types/view-models';
import { ActivityItemDTO, CouponType } from '../../../types';
import { ActivityListComponent } from '../../../components/history/activity-list.component';

/**
 * Customer History Page Component (Smart)
 *
 * Customer activity history view for the admin panel.
 * Displays chronological list of activities for the selected customer (seller).
 *
 * Features:
 * - Loading, error and empty states
 * - Fetching userId from URL parameters
 * - UUID validation
 * - DTO to ViewModel mapping
 * - Date and content formatting in Polish language
 */
@Component({
  selector: 'app-customer-history-page',
  standalone: true,
  imports: [CommonModule, ActivityListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-50 pt-8 pb-20 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <!-- Loading State -->
        @if (isLoading() && viewModel().activities.length === 0) {
          <div class="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p class="text-sm font-medium text-gray-600">Ładowanie historii klienta...</p>
          </div>
        }

        <!-- Error State -->
        @else if (error() && viewModel().activities.length === 0) {
          <div class="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 text-center">
            <div class="w-16 h-16 text-red-500">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                <path d="M12 8V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                <circle cx="12" cy="16" r="1" fill="currentColor" />
              </svg>
            </div>
            <h2 class="text-xl sm:text-2xl font-bold text-gray-900">Nie udało się pobrać historii</h2>
            <p class="text-sm text-gray-600 max-w-md">{{ getErrorMessage() }}</p>
            <div class="flex flex-col sm:flex-row gap-3 w-full max-w-md">
              <button
                (click)="onRetry()"
                type="button"
                class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full sm:w-auto"
              >
                Spróbuj ponownie
              </button>
              <button
                (click)="goBack()"
                type="button"
                class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full sm:w-auto"
              >
                Powrót do dashboardu
              </button>
            </div>
          </div>
        }

        <!-- Empty State -->
        @else if (!isLoading() && viewModel().activities.length === 0) {
          <div class="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h1 class="text-xl sm:text-2xl font-bold text-gray-900">Historia klienta</h1>
              <button
                (click)="goBack()"
                type="button"
                class="inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full sm:w-auto"
              >
                <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Powrót
              </button>
            </div>

            <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div class="w-16 h-16 text-gray-400 mb-4">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 7H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  <path d="M3 12H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  <path d="M3 17H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
              </div>
              <h2 class="text-xl font-semibold text-gray-900 mb-2">Brak historii aktywności</h2>
              <p class="text-sm text-gray-500 max-w-md">
                Ten klient nie posiada jeszcze żadnej historii aktywności w programie lojalnościowym.
              </p>
            </div>
          </div>
        }

        <!-- Content State -->
        @else {
          <div class="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <!-- Header -->
            <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div class="flex-1">
                <h1 class="text-xl sm:text-2xl font-bold text-gray-900">Historia klienta</h1>
                <p class="mt-1 text-sm text-gray-600">
                  Chronologiczna lista aktywności w programie lojalnościowym
                </p>
              </div>
              <button
                (click)="goBack()"
                type="button"
                class="inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full sm:w-auto flex-shrink-0"
              >
                <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Powrót
              </button>
            </div>

            <!-- Activity List -->
            <div class="mt-6">
              <app-activity-list [activities]="viewModel().activities" />
            </div>

            <!-- Total Count -->
            @if (viewModel().total > 0) {
              <div class="mt-6 pt-6 border-t border-gray-200 text-center">
                <p class="text-sm text-gray-500">
                  Wyświetlono {{ viewModel().activities.length }} z {{ viewModel().total }}
                  {{
                    viewModel().total === 1
                      ? 'aktywności'
                      : viewModel().total < 5
                        ? 'aktywności'
                        : 'aktywności'
                  }}
                </p>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [],
})
export class CustomerHistoryPage implements OnInit {
  private activityHistoryService = inject(ActivityHistory);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // State signals
  protected viewModel = signal<ActivityHistoryViewModel>({
    activities: [],
    total: 0,
    hasMore: false,
  });

  protected isLoading = computed(() => this.activityHistoryService.isLoading());
  protected error = computed(() => this.activityHistoryService.error());
  protected userId = signal<string | null>(null);

  ngOnInit(): void {
    // Pobierz userId z parametrów URL
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      console.error('Customer ID not found in URL');
      this.router.navigate(['/admin/dashboard']);
      return;
    }

    this.userId.set(id);
    this.loadCustomerHistory(id);
  }

  /**
   * Load customer activity history
   */
  private loadCustomerHistory(userId: string): void {
    this.activityHistoryService
      .getActivityHistoryByUserId(userId, {
        limit: 50,
        offset: 0,
      })
      .subscribe({
        next: (response) => {
          const viewModel = this.mapDTOToViewModel(response);
          this.viewModel.set(viewModel);
        },
        error: (err) => {
          console.error('Failed to load customer activity history:', err);
          // Error handled by service signal
        },
      });
  }

  /**
   * Retry loading after error
   */
  protected onRetry(): void {
    const id = this.userId();
    if (id) {
      this.loadCustomerHistory(id);
    }
  }

  /**
   * Navigate back to admin dashboard
   */
  protected goBack(): void {
    this.router.navigate(['/admin/dashboard']);
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

    return 'Nie udało się załadować historii klienta. Spróbuj ponownie później.';
  }

  /**
   * Map ActivityHistoryDTO to ActivityHistoryViewModel
   */
  private mapDTOToViewModel(
    dto: import('../../../types').ActivityHistoryDTO,
  ): ActivityHistoryViewModel {
    return {
      activities: dto.activities.map((item) => this.mapActivityItemToViewModel(item)),
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
          color:
            'linear-gradient(135deg, rgb(var(--color-primary-dark)), rgb(var(--color-primary)))',
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
          color:
            'linear-gradient(135deg, rgb(var(--color-success)), rgb(var(--color-success-light)))',
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
          color:
            'linear-gradient(135deg, rgb(var(--color-primary)), rgb(var(--color-primary-light)))',
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
