import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerSearchComponent } from '../../../components/admin/customer-search.component';
import { AdminService } from '../../../services/admin.service';
import { ApiErrorResponse, ProfileDTO } from '../../../types';
import { StampService } from '../../../services/stamp.service';

type SearchStatus = 'idle' | 'loading' | 'success' | 'error';
type ActionStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * AdminDashboardPageComponent
 *
 * Main admin dashboard page for managing customer accounts.
 * Allows sellers to search for customers by short_id and perform actions
 * like adding stamps, creating coupons, and marking coupons as used.
 */
@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [CommonModule, CustomerSearchComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Panel Administracyjny</h1>
          <p class="mt-2 text-sm text-gray-600">
            Zarządzaj kontami klientów w programie lojalnościowym
          </p>
        </div>

        <!-- Search Section -->
        <div class="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Wyszukaj klienta</h2>
          <app-customer-search
            [isSearching]="searchStatus() === 'loading'"
            (search)="onCustomerSearch($event)"
          />
        </div>

        <!-- Error Message -->
        @if (searchStatus() === 'error' && error()) {
          <div class="mb-8">
            <div
              class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start"
              role="alert"
            >
              <svg
                class="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                />
              </svg>
              <div class="flex-1">
                <h3 class="text-sm font-medium text-red-800">Błąd wyszukiwania</h3>
                <p class="mt-1 text-sm text-red-700">{{ error()?.error?.message || 'Nie znaleziono klienta o podanym identyfikatorze.' }}</p>
                <button
                  (click)="resetSearch()"
                  class="mt-3 text-sm font-medium text-red-800 hover:text-red-900 underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
                >
                  Spróbuj ponownie
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Customer Details Section -->
        @if (searchStatus() === 'success' && customer()) {
          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold text-gray-900">Dane klienta</h2>
            </div>

            <div class="mt-6 border-t border-gray-200 px-4 py-5 sm:p-0">
              <dl class="sm:divide-y sm:divide-gray-200">
                <div class="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
                  <dt class="text-sm font-medium text-gray-500">Aktywne pieczątki</dt>
                  <dd class="mt-1 text-sm font-medium text-indigo-600 sm:col-span-2 sm:mt-0">{{ stampCount() ?? 'Brak danych' }}</dd>
                </div>
                <div class="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
                  <dt class="text-sm font-medium text-gray-500">ID Klienta</dt>
                  <dd class="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{{ customer()?.short_id }}</dd>
                </div>
                <div class="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
                  <dt class="text-sm font-medium text-gray-500">Dołączył</dt>
                  <dd class="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{{ formatDate(customer()?.created_at) }}</dd>
                </div>
              </dl>
            </div>

            <!-- Coupons List -->
            <!-- @if (customer()?.coupons && customer()!.coupons.length > 0) {
              <div class="mt-6">
                <h3 class="text-lg font-medium text-gray-900 mb-3">Aktywne kupony</h3>
                <div class="space-y-3">
                  @for (coupon of customer()!.coupons; track coupon.id) {
                    <div class="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                      <div class="flex-1">
                        <p class="font-medium text-gray-900">
                          @if (coupon.type === 'free_scoop') {
                            Darmowa gałka
                          }
                          @if (coupon.type === 'percentage') {
                            Rabat {{ coupon.value }}%
                          }
                          @if (coupon.type === 'amount') {
                            Rabat {{ coupon.value }} zł
                          }
                        </p>
                        <p class="text-sm text-gray-500 mt-1">
                          Ważny do: {{ formatDate(coupon.expires_at) }}
                        </p>
                      </div>
                      <div>
                        <span
                          class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                          [class.bg-green-100]="coupon.status === 'active'"
                          [class.text-green-800]="coupon.status === 'active'"
                          [class.bg-gray-100]="coupon.status === 'used'"
                          [class.text-gray-800]="coupon.status === 'used'"
                        >
                          {{ coupon.status === 'active' ? 'Aktywny' : 'Wykorzystany' }}
                        </span>
                      </div>
                    </div>
                  }
                </div>
              </div>
            } @else {
              <div class="text-center py-8">
                <svg
                  class="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p class="mt-2 text-sm text-gray-500">Klient nie ma aktywnych kuponów</p>
              </div>
            } -->
          </div>
        }

      </div>
    </div>
  `,
})
export class AdminDashboardPageComponent {
  private adminService = inject(AdminService);
  private stampService = inject(StampService);

  // State signals
  readonly customer = signal<ProfileDTO | null>(null);
  readonly stampCount = signal<number | null>(null);
  readonly searchStatus = signal<SearchStatus>('idle');
  readonly actionStatus = signal<ActionStatus>('idle');
  readonly error = signal<ApiErrorResponse | null>(null);

  /**
   * Handle customer search event
   * @param shortId - Customer's short_id from search form
   */
  onCustomerSearch(shortId: string): void {
    if (!shortId || shortId.trim().length === 0) {
      return;
    }

    this.searchStatus.set('loading');
    this.error.set(null);
    this.customer.set(null);
    this.stampCount.set(null);

    this.adminService.getCustomerDetailsByShortId(shortId).subscribe({
      next: (customerData) => {
        this.customer.set(customerData);
        this.stampService.getCustomerStampsCount(customerData.id).subscribe({
          next: (count) => {
            console.log(count);
            this.stampCount.set(count);
            this.searchStatus.set('success');
          },
          error: (err) => {
            console.error('Error fetching stamp count:', err);
            this.searchStatus.set('error');
            this.error.set({
              error: {
                code: 'STAMP_COUNT_ERROR',
                message: 'Nie udało się pobrać liczby pieczątek.',
              },
            });
          },
        });
      },
      error: (err) => {
        console.error('Error searching for customer:', err);
        this.searchStatus.set('error');
        this.error.set({
          error: {
            code: 'CUSTOMER_NOT_FOUND',
            message: err?.message || 'Nie znaleziono klienta o podanym identyfikatorze.',
          },
        });
      },
    });
  }

  /**
   * Reset search state and clear customer data
   * Allows user to perform a new search
   */
  resetSearch(): void {
    this.searchStatus.set('idle');
    this.customer.set(null);
    this.stampCount.set(null);
    this.error.set(null);
  }

  /**
   * Format date for display
   * @param dateString - ISO date string
   * @returns Formatted date string
   */
  formatDate(dateString: string | undefined): string {
    if (!dateString) return '-';

    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
