import { Component, ChangeDetectionStrategy, signal, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AddCouponFormComponent } from '../../../components/admin/add-coupon-form.component';
import { CouponService } from '../../../services/coupon.service';
import { AddCouponFormViewModel, ApiErrorResponse } from '../../../types';

/**
 * AdminAddCouponPageComponent
 *
 * Main page component for adding coupons to customer accounts.
 * This page is part of the admin panel and allows sellers to create
 * discount coupons (percentage or amount) for customers by their short_id.
 *
 * Protected by AdminGuard to ensure only authenticated sellers can access it.
 */
@Component({
  selector: 'app-admin-add-coupon-page',
  standalone: true,
  imports: [CommonModule, AddCouponFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center gap-4 mb-4">
            <button
              type="button"
              (click)="goBack()"
              class="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
              aria-label="Powrót do panelu administracyjnego"
            >
              <svg
                class="h-5 w-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
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
          <h1 class="text-3xl font-bold text-gray-900">Dodaj kupon dla klienta</h1>
          <p class="mt-2 text-sm text-gray-600">
            Wypełnij formularz, aby utworzyć rabat procentowy lub kwotowy dla wybranego klienta.
          </p>
        </div>

        <!-- Success Message -->
        @if (success()) {
          <div
            class="mb-8 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start"
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
            <div class="flex-1">
              <h3 class="text-sm font-medium text-green-800">Sukces!</h3>
              <p class="mt-1 text-sm text-green-700">
                Kupon został pomyślnie dodany do konta klienta.
              </p>
              <div class="mt-4 flex gap-3">
                <button
                  type="button"
                  (click)="addAnother()"
                  class="text-sm font-medium text-green-800 hover:text-green-900 underline focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded"
                >
                  Dodaj kolejny kupon
                </button>
                <button
                  type="button"
                  (click)="goBack()"
                  class="text-sm font-medium text-green-800 hover:text-green-900 underline focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded"
                >
                  Powrót do panelu
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Error Message -->
        @if (error()) {
          <div
            class="mb-8 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start"
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
              <h3 class="text-sm font-medium text-red-800">Błąd</h3>
              <p class="mt-1 text-sm text-red-700">
                {{ error()?.error?.message || 'Wystąpił błąd podczas dodawania kuponu.' }}
              </p>
              <button
                type="button"
                (click)="dismissError()"
                class="mt-3 text-sm font-medium text-red-800 hover:text-red-900 underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
              >
                Zamknij
              </button>
            </div>
          </div>
        }

        <!-- Form Section -->
        @if (!success()) {
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-6">Dane kuponu</h2>
            <app-add-coupon-form
              [isLoading]="isLoading()"
              (formSubmit)="onFormSubmit($event)"
            />
          </div>
        }

        <!-- Info Card -->
        <div class="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg
                class="h-5 w-5 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="ml-3 flex-1">
              <h3 class="text-sm font-medium text-blue-800">Informacje o kuponach</h3>
              <div class="mt-2 text-sm text-blue-700">
                <ul class="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Rabat procentowy:</strong> Wartość musi być w zakresie 1-100%.
                  </li>
                  <li>
                    <strong>Rabat kwotowy:</strong> Wartość w złotych (np. 10 zł rabatu).
                  </li>
                  <li>
                    <strong>Data ważności:</strong> Kupon będzie aktywny do wybranej daty.
                  </li>
                  <li>
                    <strong>ID Klienta:</strong> 6-znakowy kod alfanumeryczny widoczny na karcie
                    klienta.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminAddCouponPageComponent {
  private couponService = inject(CouponService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Get reference to the form component for resetting
  private formComponent = viewChild(AddCouponFormComponent);

  // State signals
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<ApiErrorResponse | null>(null);
  readonly success = signal<boolean>(false);

  /**
   * Handle form submission
   * Calls CouponService to add the coupon and manages state
   *
   * @param formData - Form data from AddCouponFormComponent
   */
  onFormSubmit(formData: AddCouponFormViewModel): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.success.set(false);

    this.couponService.addCoupon(formData).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.success.set(true);
        this.error.set(null);

        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err) => {
        console.error('Error adding coupon:', err);
        this.isLoading.set(false);
        this.success.set(false);
        this.error.set({
          error: {
            code: 'ADD_COUPON_ERROR',
            message: err?.message || 'Nie udało się dodać kuponu.',
          },
        });

        // Scroll to top to show error message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });
  }

  /**
   * Dismiss error message
   */
  dismissError(): void {
    this.error.set(null);
  }

  /**
   * Reset form and allow adding another coupon
   */
  addAnother(): void {
    this.success.set(false);
    this.error.set(null);
    this.isLoading.set(false);

    // Reset the form component
    const form = this.formComponent();
    if (form) {
      form.resetForm();
    }
  }

  /**
   * Navigate back to admin dashboard
   */
  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }
}
