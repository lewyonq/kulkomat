import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ContactService } from '../../services/contact.service';
import { CreateContactSubmissionCommand } from '../../types';

/**
 * Contact Form View Model
 * Type for reactive form controls
 */
interface ContactFormViewModel {
  email: FormControl<string>;
  message: FormControl<string>;
}

/**
 * Contact Page Component
 *
 * Allows authenticated users to send messages, feedback, or issue reports
 * to the application support team.
 *
 * Features:
 * - Reactive form with email (readonly) and message fields
 * - Form validation (required, minLength)
 * - Loading and success/error states
 * - Integration with ContactService for API calls
 */
@Component({
  selector: 'app-contact',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="contact-container">
      <div class="content-wrapper">
        <!-- Page Header -->
        <header class="page-header">
          <h1 class="page-title">Kontakt</h1>
          <p class="page-description">Masz pytanie lub sugestię? Skontaktuj się z nami!</p>
        </header>

        <!-- Success Message -->
        @if (isSuccess()) {
          <div class="success-message" role="alert" aria-live="polite">
            <div class="success-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                <path
                  d="M8 12L11 15L16 9"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <div class="success-content">
              <h2 class="success-title">Dziękujemy za wiadomość!</h2>
              <p class="success-text">
                Twoja wiadomość została wysłana. Odpowiemy najszybciej jak to możliwe.
              </p>
            </div>
          </div>
        }

        <!-- Error Message -->
        @if (error()) {
          <div class="error-message" role="alert" aria-live="assertive">
            <div class="error-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                <path d="M12 8V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                <circle cx="12" cy="16" r="1" fill="currentColor" />
              </svg>
            </div>
            <div class="error-content">
              <h2 class="error-title">Wystąpił błąd</h2>
              <p class="error-text">{{ error() }}</p>
            </div>
          </div>
        }

        <!-- Contact Form -->
        <form [formGroup]="contactForm" (ngSubmit)="onSubmit()" class="contact-form">
          <!-- Email Field (Readonly) -->
          <div class="form-group">
            <label for="email" class="form-label">
              <span class="label-text">Email</span>
              <span class="label-badge">Twój adres email</span>
            </label>
            <div class="input-wrapper">
              <div class="input-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M22 6L12 13L2 6"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
              <input
                type="email"
                id="email"
                formControlName="email"
                class="form-input readonly"
                readonly
                aria-readonly="true"
                aria-label="Twój adres email (pole tylko do odczytu)"
              />
            </div>
          </div>

          <!-- Message Field -->
          <div class="form-group">
            <label for="message" class="form-label">
              <span class="label-text">Wiadomość</span>
              <span class="label-required">*</span>
            </label>
            <textarea
              id="message"
              formControlName="message"
              class="form-textarea"
              rows="6"
              placeholder="Napisz swoją wiadomość... (minimum 10 znaków)"
              aria-required="true"
              aria-describedby="message-error"
              [attr.aria-invalid]="
                contactForm.controls.message.invalid && contactForm.controls.message.touched
              "
            ></textarea>

            <!-- Validation Error -->
            @if (getMessageError()) {
              <p id="message-error" class="field-error" role="alert">
                {{ getMessageError() }}
              </p>
            }
          </div>

          <!-- Submit Button -->
          <div class="form-actions">
            <button
              type="submit"
              class="submit-button"
              [disabled]="isSubmitDisabled()"
              [attr.aria-busy]="isLoading()"
            >
              @if (isLoading()) {
                <span class="button-spinner"></span>
                <span>Wysyłanie...</span>
              } @else {
                <svg
                  class="button-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22 2L11 13"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M22 2L15 22L11 13L2 9L22 2Z"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <span>Wyślij wiadomość</span>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .contact-container {
        min-height: 100vh;
        padding: 1rem;
        background: linear-gradient(to bottom, #fdf2f8, #fef3f9);
      }

      .content-wrapper {
        max-width: 600px;
        margin: 0 auto;
        padding-bottom: 2rem;
      }

      /* Page Header */
      .page-header {
        text-align: center;
        padding: 2rem 1rem 1.5rem;
        margin-bottom: 1.5rem;
      }

      .page-title {
        font-size: 2rem;
        font-weight: 700;
        color: #1a1a1a;
        margin: 0 0 0.5rem 0;
      }

      .page-description {
        font-size: 1rem;
        color: #666;
        margin: 0;
        line-height: 1.5;
      }

      /* Success Message */
      .success-message {
        display: flex;
        gap: 1rem;
        padding: 1.5rem;
        background: #f0fdf4;
        border: 2px solid #86efac;
        border-radius: 12px;
        margin-bottom: 1.5rem;
        animation: slideIn 0.3s ease-out;
      }

      .success-icon {
        width: 32px;
        height: 32px;
        color: #16a34a;
        flex-shrink: 0;
      }

      .success-icon svg {
        width: 100%;
        height: 100%;
      }

      .success-content {
        flex: 1;
      }

      .success-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: #15803d;
        margin: 0 0 0.25rem 0;
      }

      .success-text {
        font-size: 0.875rem;
        color: #166534;
        margin: 0;
        line-height: 1.5;
      }

      /* Error Message */
      .error-message {
        display: flex;
        gap: 1rem;
        padding: 1.5rem;
        background: #fef2f2;
        border: 2px solid #fca5a5;
        border-radius: 12px;
        margin-bottom: 1.5rem;
        animation: slideIn 0.3s ease-out;
      }

      .error-icon {
        width: 32px;
        height: 32px;
        color: #dc2626;
        flex-shrink: 0;
      }

      .error-icon svg {
        width: 100%;
        height: 100%;
      }

      .error-content {
        flex: 1;
      }

      .error-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: #b91c1c;
        margin: 0 0 0.25rem 0;
      }

      .error-text {
        font-size: 0.875rem;
        color: #991b1b;
        margin: 0;
        line-height: 1.5;
      }

      /* Contact Form */
      .contact-form {
        background: white;
        border-radius: 16px;
        padding: 2rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .form-group {
        margin-bottom: 1.5rem;
      }

      .form-group:last-of-type {
        margin-bottom: 2rem;
      }

      .form-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
      }

      .label-text {
        font-size: 0.875rem;
        font-weight: 600;
        color: #1a1a1a;
      }

      .label-required {
        color: #dc2626;
        font-weight: 700;
      }

      .label-badge {
        font-size: 0.75rem;
        color: #666;
        background: #f3f4f6;
        padding: 0.125rem 0.5rem;
        border-radius: 4px;
      }

      /* Input Wrapper */
      .input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
      }

      .input-icon {
        position: absolute;
        left: 1rem;
        width: 20px;
        height: 20px;
        color: #9ca3af;
        pointer-events: none;
      }

      .input-icon svg {
        width: 100%;
        height: 100%;
      }

      /* Form Input */
      .form-input {
        width: 100%;
        padding: 0.875rem 1rem 0.875rem 3rem;
        font-size: 1rem;
        color: #1a1a1a;
        background: white;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        outline: none;
        transition: all 0.2s ease;
      }

      .form-input.readonly {
        background: #f9fafb;
        color: #6b7280;
        cursor: not-allowed;
      }

      .form-input:focus:not(.readonly) {
        border-color: rgba(219, 39, 119, 1);
        box-shadow: 0 0 0 3px rgba(219, 39, 119, 0.1);
      }

      /* Form Textarea */
      .form-textarea {
        width: 100%;
        padding: 0.875rem 1rem;
        font-size: 1rem;
        font-family: inherit;
        color: #1a1a1a;
        background: white;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        outline: none;
        resize: vertical;
        transition: all 0.2s ease;
        min-height: 120px;
      }

      .form-textarea:focus {
        border-color: rgba(219, 39, 119, 1);
        box-shadow: 0 0 0 3px rgba(219, 39, 119, 0.1);
      }

      .form-textarea[aria-invalid='true'] {
        border-color: #dc2626;
      }

      .form-textarea::placeholder {
        color: #9ca3af;
      }

      /* Field Error */
      .field-error {
        margin-top: 0.5rem;
        font-size: 0.875rem;
        color: #dc2626;
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }

      /* Form Actions */
      .form-actions {
        display: flex;
        justify-content: center;
      }

      /* Submit Button */
      .submit-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        padding: 1rem 2rem;
        font-size: 1rem;
        font-weight: 600;
        color: white;
        background: var(--gradient-primary);
        border: none;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(219, 39, 119, 0.3);
        min-width: 200px;
      }

      .submit-button:hover:not(:disabled) {
        filter: brightness(1.1);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(219, 39, 119, 0.4);
      }

      .submit-button:active:not(:disabled) {
        transform: translateY(0);
      }

      .submit-button:focus-visible {
        outline: 2px solid rgba(219, 39, 119, 1);
        outline-offset: 2px;
      }

      .submit-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .button-icon {
        width: 20px;
        height: 20px;
      }

      .button-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      /* Animations */
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* Responsive Design */
      @media (max-width: 640px) {
        .contact-container {
          padding: 0.5rem;
        }

        .page-header {
          padding: 1.5rem 0.5rem 1rem;
        }

        .page-title {
          font-size: 1.5rem;
        }

        .contact-form {
          padding: 1.5rem;
        }

        .submit-button {
          width: 100%;
          min-width: auto;
        }
      }

      /* Accessibility - Reduced Motion */
      @media (prefers-reduced-motion: reduce) {
        .submit-button,
        .success-message,
        .error-message {
          animation: none;
          transition: none;
        }

        .submit-button:hover:not(:disabled) {
          transform: none;
        }
      }
    `,
  ],
})
export class Contact implements OnInit {
  private authService = inject(AuthService);
  private contactService = inject(ContactService);

  // Form state
  protected contactForm!: FormGroup<ContactFormViewModel>;

  // UI states
  protected isLoading = signal<boolean>(false);
  protected isSuccess = signal<boolean>(false);
  protected error = signal<string | null>(null);

  ngOnInit(): void {
    this.initializeForm();
  }

  /**
   * Initialize the contact form with user email and message fields
   */
  private initializeForm(): void {
    const userEmail = this.authService.user()?.email || '';

    this.contactForm = new FormGroup<ContactFormViewModel>({
      email: new FormControl(userEmail, { nonNullable: true }),
      message: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(10)],
      }),
    });

    // Disable email field as it's readonly
    this.contactForm.controls.email.disable();
  }

  /**
   * Handle form submission
   * Validates form and sends message to API
   */
  protected onSubmit(): void {
    // Early return if form is invalid or already submitting
    if (this.contactForm.invalid || this.isLoading()) {
      return;
    }

    // Reset states
    this.isLoading.set(true);
    this.isSuccess.set(false);
    this.error.set(null);

    const command: CreateContactSubmissionCommand = {
      message: this.contactForm.value.message!,
    };

    this.contactService.submit(command).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isSuccess.set(true);
        this.contactForm.controls.message.reset();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set(this.getErrorMessage(err));
      },
    });
  }

  /**
   * Get validation error message for message field
   */
  protected getMessageError(): string | null {
    const messageControl = this.contactForm.controls.message;

    if (!messageControl.touched) {
      return null;
    }

    if (messageControl.hasError('required')) {
      return 'Wiadomość jest wymagana';
    }

    if (messageControl.hasError('minlength')) {
      const minLength = messageControl.getError('minlength').requiredLength;
      return `Wiadomość musi mieć co najmniej ${minLength} znaków`;
    }

    return null;
  }

  /**
   * Check if submit button should be disabled
   */
  protected isSubmitDisabled(): boolean {
    return this.contactForm.invalid || this.isLoading();
  }

  /**
   * Get user-friendly error message from error object
   */
  private getErrorMessage(err: Error): string {
    if (!err) {
      return 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.';
    }

    const message = err.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return 'Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe.';
    }

    if (message.includes('not authenticated')) {
      return 'Sesja wygasła. Zaloguj się ponownie.';
    }

    if (message.includes('timeout')) {
      return 'Przekroczono czas oczekiwania. Spróbuj ponownie.';
    }

    return 'Wystąpił błąd podczas wysyłania wiadomości. Spróbuj ponownie później.';
  }
}
