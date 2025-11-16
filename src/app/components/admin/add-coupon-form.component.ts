import {
  Component,
  ChangeDetectionStrategy,
  output,
  input,
  OnInit,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { AddCouponFormViewModel, CouponType } from '../../types';

/**
 * AddCouponFormComponent
 *
 * Presentation component for adding a coupon to a customer account.
 * Handles form validation and emits form data to the parent component.
 */
@Component({
  selector: 'app-add-coupon-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="couponForm" (ngSubmit)="onSubmit()" class="space-y-6">
      <!-- Short ID Field -->
      <div>
        <label for="short_id" class="block text-sm font-medium text-gray-700 mb-2">
          ID Klienta
          @if (prefillShortId()) {
            <span class="ml-2 text-xs text-gray-500">(automatycznie uzupełnione)</span>
          }
        </label>
        <input
          id="short_id"
          type="text"
          formControlName="short_id"
          maxlength="6"
          placeholder="np. ABC123"
          class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed sm:text-sm"
          [class.border-red-300]="isFieldInvalid('short_id')"
          aria-label="Wprowadź 6-znakowy identyfikator klienta"
          aria-describedby="short_id-error"
        />
        @if (isFieldInvalid('short_id')) {
          <p id="short_id-error" class="mt-2 text-sm text-red-600" role="alert">
            @if (couponForm.get('short_id')?.hasError('required')) {
              ID klienta jest wymagane.
            }
            @if (couponForm.get('short_id')?.hasError('pattern')) {
              ID klienta musi składać się z dokładnie 6 znaków alfanumerycznych.
            }
          </p>
        }
      </div>

      <!-- Coupon Type Field -->
      <div>
        <label for="type" class="block text-sm font-medium text-gray-700 mb-2"> Typ kuponu </label>
        <select
          id="type"
          formControlName="type"
          class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed sm:text-sm"
          [class.border-red-300]="isFieldInvalid('type')"
          [disabled]="isLoading()"
          aria-label="Wybierz typ kuponu"
          aria-describedby="type-error"
        >
          <option value="" disabled>Wybierz typ kuponu</option>
          <option value="percentage">Rabat procentowy</option>
          <option value="amount">Rabat kwotowy</option>
        </select>
        @if (isFieldInvalid('type')) {
          <p id="type-error" class="mt-2 text-sm text-red-600" role="alert">
            Typ kuponu jest wymagany.
          </p>
        }
      </div>

      <!-- Coupon Value Field -->
      <div>
        <label for="value" class="block text-sm font-medium text-gray-700 mb-2">
          Wartość kuponu
          @if (couponForm.get('type')?.value === 'percentage') {
            <span class="text-gray-500">(1-100%)</span>
          } @else if (couponForm.get('type')?.value === 'amount') {
            <span class="text-gray-500">(w złotych)</span>
          }
        </label>
        <input
          id="value"
          type="number"
          formControlName="value"
          min="0"
          step="0.01"
          placeholder="Wprowadź wartość"
          class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed sm:text-sm"
          [class.border-red-300]="isFieldInvalid('value')"
          [disabled]="isLoading()"
          aria-label="Wprowadź wartość kuponu"
          aria-describedby="value-error"
        />
        @if (isFieldInvalid('value')) {
          <p id="value-error" class="mt-2 text-sm text-red-600" role="alert">
            @if (couponForm.get('value')?.hasError('required')) {
              Wartość kuponu jest wymagana.
            }
            @if (couponForm.get('value')?.hasError('min')) {
              Wartość musi być większa niż 0.
            }
            @if (couponForm.get('value')?.hasError('percentageRange')) {
              Wartość procentowa musi być w zakresie 1-100.
            }
          </p>
        }
      </div>

      <!-- Expiration Date Field -->
      <div>
        <label for="expires_at" class="block text-sm font-medium text-gray-700 mb-2">
          Data ważności
        </label>
        <input
          id="expires_at"
          type="date"
          formControlName="expires_at"
          class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed sm:text-sm"
          [class.border-red-300]="isFieldInvalid('expires_at')"
          [disabled]="isLoading()"
          aria-label="Wybierz datę wygaśnięcia kuponu"
          aria-describedby="expires_at-error"
        />
        @if (isFieldInvalid('expires_at')) {
          <p id="expires_at-error" class="mt-2 text-sm text-red-600" role="alert">
            @if (couponForm.get('expires_at')?.hasError('required')) {
              Data ważności jest wymagana.
            }
            @if (couponForm.get('expires_at')?.hasError('futureDate')) {
              Data ważności musi być w przyszłości.
            }
          </p>
        }
      </div>

      <!-- Submit Button -->
      <div class="flex items-center justify-end gap-4">
        <button
          type="submit"
          [disabled]="couponForm.invalid || isLoading()"
          class="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300"
          aria-label="Dodaj kupon do konta klienta"
        >
          @if (isLoading()) {
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
            Dodaj kupon
          }
        </button>
      </div>
    </form>
  `,
})
export class AddCouponFormComponent implements OnInit {
  // Input: loading state from parent component
  isLoading = input<boolean>(false);

  // Input: pre-filled short_id (optional)
  prefillShortId = input<string | undefined>();

  // Output: emit form data when form is submitted
  formSubmit = output<AddCouponFormViewModel>();

  couponForm!: FormGroup;
  private submitted = signal<boolean>(false);

  private fb = inject(FormBuilder);

  constructor() {}

  ngOnInit(): void {
    this.initializeForm();
    this.setupValueChangeListeners();
  }

  /**
   * Initialize the reactive form with validators
   */
  private initializeForm(): void {
    const prefilledShortId = this.prefillShortId();

    this.couponForm = this.fb.group({
      short_id: [
        { value: prefilledShortId || '', disabled: !!prefilledShortId },
        [Validators.required, Validators.pattern(/^[a-zA-Z0-9]{6}$/)],
      ],
      type: ['', [Validators.required]],
      value: ['', [Validators.required, Validators.min(0.01)]],
      expires_at: ['', [Validators.required, this.futureDateValidator]],
    });
  }

  /**
   * Setup listeners for value changes to apply conditional validation
   */
  private setupValueChangeListeners(): void {
    // Watch for changes in the 'type' field to apply percentage range validation
    this.couponForm.get('type')?.valueChanges.subscribe((type: CouponType) => {
      const valueControl = this.couponForm.get('value');
      if (type === 'percentage') {
        valueControl?.addValidators(this.percentageRangeValidator);
      } else {
        valueControl?.removeValidators(this.percentageRangeValidator);
      }
      valueControl?.updateValueAndValidity();
    });
  }

  /**
   * Custom validator to ensure date is in the future
   */
  private futureDateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate <= today) {
      return { futureDate: true };
    }

    return null;
  }

  /**
   * Custom validator to ensure percentage value is between 1 and 100
   */
  private percentageRangeValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const value = parseFloat(control.value);
    if (value < 1 || value > 100) {
      return { percentageRange: true };
    }

    return null;
  }

  /**
   * Check if a field is invalid and has been touched or form was submitted
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.couponForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || this.submitted()));
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    this.submitted.set(true);

    if (this.couponForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.couponForm.controls).forEach((key) => {
        this.couponForm.get(key)?.markAsTouched();
      });
      return;
    }

    // Emit form data to parent component
    // Use getRawValue() to include disabled fields (short_id when pre-filled)
    const formData: AddCouponFormViewModel = this.couponForm.getRawValue();
    this.formSubmit.emit(formData);
  }

  /**
   * Reset the form to initial state
   */
  resetForm(): void {
    this.couponForm.reset({
      short_id: '',
      type: '',
      value: '',
      expires_at: '',
    });
    this.submitted.set(false);
  }
}
