import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { SpinnerComponent } from '../../../components/shared/spinner.component';
import { AlertComponent } from '../../../components/shared/alert.component';

/**
 * AdminLoginFormComponent - Presentation component for admin login
 *
 * Dumb component that displays the login interface for sellers.
 * Renders a button to initiate Google OAuth flow and displays loading/error states.
 *
 * Responsibilities:
 * - Display login interface with Google sign-in button
 * - Show loading spinner during authentication
 * - Display error messages
 * - Emit login event to parent component
 *
 * @example
 * <app-admin-login-form
 *   [isLoading]="isLoading()"
 *   [error]="error()"
 *   (login)="handleLogin()"
 * />
 */
@Component({
  selector: 'app-admin-login-form',
  standalone: true,
  imports: [SpinnerComponent, AlertComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div class="w-full max-w-md">
        <div class="bg-white rounded-2xl shadow-xl p-8">
          <!-- Header -->
          <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">
              Panel dla sprzedawcy
            </h1>
            <p class="text-gray-600">
              Zaloguj się, aby zarządzać systemem
            </p>
          </div>

          <!-- Loading State -->
          @if (isLoading()) {
            <div class="py-8">
              <app-spinner />
              <p class="text-center text-gray-600 mt-4">
                Przekierowywanie do logowania...
              </p>
            </div>
          }

          <!-- Login Form (shown when not loading) -->
          @if (!isLoading()) {
            <div class="space-y-4">
              <!-- Error Alert -->
              @if (error()) {
                <app-alert [message]="error()" type="error" />
              }

              <!-- Google Sign In Button -->
              <button
                type="button"
                (click)="handleLoginClick()"
                class="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
                aria-label="Zaloguj się z Google"
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Zaloguj się z Google
              </button>
            </div>
          }

          <!-- Footer -->
          <div class="mt-8 pt-6 border-t border-gray-200 text-center">
            <p class="text-sm text-gray-500">
              Dostęp tylko dla autoryzowanego personelu
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminLoginFormComponent {
  /**
   * Loading state - indicates if authentication is in progress
   */
  isLoading = input.required<boolean>();

  /**
   * Error message to display (null if no error)
   */
  error = input.required<string | null>();

  /**
   * Event emitted when user clicks login button
   */
  login = output<void>();

  /**
   * Handle login button click
   * Emits login event to parent component
   */
  handleLoginClick(): void {
    this.login.emit();
  }
}
