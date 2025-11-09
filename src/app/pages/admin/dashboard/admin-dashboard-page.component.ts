import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CustomerSearchComponent } from '../../../components/admin/customer-search.component';
import { AdminService } from '../../../services/admin.service';
import { ApiErrorResponse, ProfileDTO } from '../../../types';
import { StampService } from '../../../services/stamp.service';

type SearchStatus = 'idle' | 'loading' | 'success' | 'error';
type ActionStatus = 'idle' | 'loading' | 'success' | 'error';
type SuccessMessage = string | null;

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
  imports: [CommonModule, CustomerSearchComponent, RouterLink],
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
                <p class="mt-1 text-sm text-red-700">
                  {{
                    error()?.error?.message || 'Nie znaleziono klienta o podanym identyfikatorze.'
                  }}
                </p>
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
                  <dd class="mt-1 text-sm font-medium text-indigo-600 sm:col-span-2 sm:mt-0">
                    {{ stampCount() ?? 'Brak danych' }}
                  </dd>
                </div>
                <div class="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
                  <dt class="text-sm font-medium text-gray-500">ID Klienta</dt>
                  <dd class="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    {{ customer()?.short_id }}
                  </dd>
                </div>
                <div class="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
                  <dt class="text-sm font-medium text-gray-500">Dołączył</dt>
                  <dd class="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    {{ formatDate(customer()?.created_at) }}
                  </dd>
                </div>
              </dl>
            </div>

            <!-- Add Stamps Section -->
            <div class="mt-6 pt-6 border-t border-gray-200">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Dodaj pieczątki</h3>

              <!-- Success Message -->
              @if (actionStatus() === 'success' && successMessage()) {
                <div
                  class="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start"
                  role="status"
                  aria-live="polite"
                >
                  <svg
                    class="h-5 w-5 text-green-400 mt-0.5 mr-3 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <p class="text-sm font-medium text-green-800">{{ successMessage() }}</p>
                </div>
              }

              <div class="flex items-end gap-4 mb-5">
                <div class="flex-1 max-w-xs">
                  <label for="stamps-input" class="block text-sm font-medium text-gray-700 mb-2">
                    Liczba pieczątek
                  </label>
                  <input
                    id="stamps-input"
                    type="number"
                    min="1"
                    step="1"
                    [value]="stampsToAdd()"
                    (input)="updateStampsToAdd(+$any($event.target).value)"
                    [disabled]="actionStatus() === 'loading'"
                    class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed sm:text-sm"
                    aria-label="Wprowadź liczbę pieczątek do dodania"
                    aria-describedby="stamps-input-description"
                  />
                  <p id="stamps-input-description" class="mt-1 text-xs text-gray-500">
                    Wprowadź liczbę pieczątek (minimum 1)
                  </p>
                </div>
                <button
                  type="button"
                  (click)="addStamps()"
                  [disabled]="actionStatus() === 'loading' || stampsToAdd() < 1"
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300"
                  aria-label="Dodaj pieczątki do konta klienta"
                >
                  @if (actionStatus() === 'loading') {
                    <svg
                      class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                      />
                      <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Dodawanie...
                  } @else {
                    Dodaj pieczątki
                  }
                </button>
              </div>
            </div>

            <!-- Actions Section -->
            <div class="mt-6 pt-6 border-t border-gray-200 mb-4">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Akcje</h3>
              <div class="flex flex-wrap gap-3">
                <!-- Add Coupon Button -->
                <a
                  [routerLink]="['/admin/customer', customer()?.id, 'add-coupon']"
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                  aria-label="Dodaj kupon dla klienta"
                >
                  <svg
                    class="h-5 w-5 mr-2 -ml-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Dodaj kupon
                </a>

                <!-- View History Button -->
                <a
                  [routerLink]="['/admin/customer', customer()?.id, 'history']"
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  aria-label="Wyświetl historię aktywności klienta"
                >
                  <svg
                    class="h-5 w-5 mr-2 -ml-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Wyświetl historię
                </a>
              </div>
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
  readonly stampsToAdd = signal<number>(1);
  readonly successMessage = signal<SuccessMessage>(null);

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
    this.successMessage.set(null);
    this.actionStatus.set('idle');
    this.stampsToAdd.set(1);

    this.adminService.getCustomerDetailsByShortId(shortId).subscribe({
      next: (customerData) => {
        this.customer.set(customerData);
        this.stampService.getCustomerStampsCount(customerData.id).subscribe({
          next: (count) => {
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
    this.successMessage.set(null);
    this.actionStatus.set('idle');
    this.stampsToAdd.set(1);
  }

  /**
   * Update stamps to add value
   * @param value - Number of stamps to add
   */
  updateStampsToAdd(value: number): void {
    if (value < 1) {
      this.stampsToAdd.set(1);
      return;
    }
    this.stampsToAdd.set(value);
  }

  /**
   * Add stamps to customer account
   * Validates input and calls AdminService to add stamps
   */
  addStamps(): void {
    const currentCustomer = this.customer();
    if (!currentCustomer) {
      this.error.set({
        error: {
          code: 'NO_CUSTOMER',
          message: 'Brak wybranego klienta.',
        },
      });
      return;
    }

    const count = this.stampsToAdd();
    if (count < 1) {
      this.error.set({
        error: {
          code: 'INVALID_COUNT',
          message: 'Liczba pieczątek musi być większa niż 0.',
        },
      });
      return;
    }

    this.actionStatus.set('loading');
    this.error.set(null);
    this.successMessage.set(null);

    this.adminService.addStampsToCustomer(currentCustomer.id, count).subscribe({
      next: () => {
        this.successMessage.set(
          `Dodano ${count} ${count === 1 ? 'pieczątkę' : count < 5 ? 'pieczątki' : 'pieczątek'} dla klienta.`,
        );
        this.actionStatus.set('success');
        this.stampsToAdd.set(1);

        // Refresh stamp count
        this.stampService.getCustomerStampsCount(currentCustomer.id).subscribe({
          next: (newCount) => {
            this.stampCount.set(newCount);
          },
          error: (err) => {
            console.error('Error refreshing stamp count:', err);
          },
        });
      },
      error: (err) => {
        console.error('Error adding stamps:', err);
        this.actionStatus.set('error');
        this.error.set({
          error: {
            code: 'ADD_STAMPS_ERROR',
            message: err?.message || 'Nie udało się dodać pieczątek.',
          },
        });
      },
    });
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
