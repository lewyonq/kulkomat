import { Component, ChangeDetectionStrategy, input, output, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

/**
 * CustomerSearchComponent
 *
 * Dumb component for searching customers by their short_id.
 * Provides a simple form with validation and emits search events.
 */
@Component({
  selector: 'app-customer-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-md mx-auto">
      <form [formGroup]="searchForm" (ngSubmit)="onSubmit()" class="space-y-4">
        <div>
          <label for="shortId" class="block text-sm font-medium text-gray-700 mb-2">
            Wyszukaj klienta
          </label>
          <div class="relative">
            <input
              id="shortId"
              type="text"
              formControlName="shortId"
              placeholder="Wprowadź 6-znakowy kod"
              maxlength="6"
              class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              [class.border-red-500]="
                searchForm.get('shortId')?.invalid && searchForm.get('shortId')?.touched
              "
              [class.border-gray-300]="
                !searchForm.get('shortId')?.invalid || !searchForm.get('shortId')?.touched
              "
              [disabled]="isSearching()"
            />
            @if (searchForm.get('shortId')?.invalid && searchForm.get('shortId')?.touched) {
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg
                  class="h-5 w-5 text-red-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
            }
          </div>

          <!-- Error messages -->
          @if (searchForm.get('shortId')?.invalid && searchForm.get('shortId')?.touched) {
            <div class="mt-2 text-sm text-red-600">
              @if (searchForm.get('shortId')?.hasError('required')) {
                <p>Kod klienta jest wymagany</p>
              }
              @if (
                searchForm.get('shortId')?.hasError('minlength') ||
                searchForm.get('shortId')?.hasError('maxlength')
              ) {
                <p>Kod musi mieć dokładnie 6 znaków</p>
              }
              @if (searchForm.get('shortId')?.hasError('pattern')) {
                <p>Kod może zawierać tylko litery i cyfry</p>
              }
            </div>
          }
        </div>

        <button
          type="submit"
          [disabled]="searchForm.invalid || isSearching()"
          class="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          @if (isSearching()) {
            <span class="flex items-center justify-center">
              <svg
                class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Wyszukiwanie...
            </span>
          } @else {
            <span>Szukaj</span>
          }
        </button>
      </form>
    </div>
  `,
})
export class CustomerSearchComponent implements OnInit {
  private fb = inject(FormBuilder);

  // Inputs
  readonly isSearching = input<boolean>(false);

  // Outputs
  readonly search = output<string>();

  // Form
  searchForm!: FormGroup;

  ngOnInit(): void {
    this.searchForm = this.fb.group({
      shortId: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(6),
          Validators.pattern(/^[a-zA-Z0-9]+$/),
        ],
      ],
    });
  }

  onSubmit(): void {
    if (this.searchForm.valid && !this.isSearching()) {
      const shortId = this.searchForm.get('shortId')?.value.trim().toUpperCase();
      this.search.emit(shortId);
    }
  }
}
