import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { AdminLoginFormComponent } from './admin-login-form.component';

/**
 * AdminLoginPageComponent - Smart component for admin login page
 *
 * Container component that manages authentication state and logic.
 * Handles the OAuth flow initiation and error handling.
 *
 * Route: /admin/login
 * Guard: loginRedirectGuard (prevents access for authenticated users)
 *
 * Responsibilities:
 * - Manage view state (loading, error) using signals
 * - Handle login initiation via AuthService
 * - Process URL query parameters for error messages
 * - Navigate user after successful authentication
 *
 * Flow:
 * 1. User clicks "Login with Google" in child component
 * 2. Component calls AuthService.signInWithGoogle()
 * 3. User is redirected to Google OAuth page
 * 4. After authentication, Google redirects to /auth/callback
 * 5. AuthCallbackComponent verifies seller role and redirects accordingly
 *
 * @example
 * // Route configuration:
 * {
 *   path: 'admin/login',
 *   loadComponent: () => import('./admin-login-page.component').then(m => m.AdminLoginPageComponent),
 *   canActivate: [loginRedirectGuard]
 * }
 */
@Component({
  selector: 'app-admin-login-page',
  standalone: true,
  imports: [AdminLoginFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-admin-login-form [isLoading]="isLoading()" [error]="error()" (login)="handleLogin()" />
  `,
})
export class AdminLoginPageComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  /**
   * Loading state signal
   * Indicates if authentication is in progress
   */
  isLoading = signal(false);

  /**
   * Error message signal
   * Contains error message or null if no error
   */
  error = signal<string | null>(null);

  ngOnInit(): void {
    // Check for error in URL query parameters
    // This can happen when user is redirected back from auth callback
    // with an error (e.g., unauthorized, access_denied)
    this.checkForErrorInUrl();
  }

  /**
   * Check URL query parameters for error messages
   * Sets error state if 'error' query param is present
   */
  private checkForErrorInUrl(): void {
    const errorParam = this.route.snapshot.queryParamMap.get('error');

    if (errorParam) {
      let errorMessage: string;

      switch (errorParam) {
        case 'unauthorized':
          errorMessage = 'Nie masz uprawnień, aby uzyskać dostęp do tego panelu.';
          break;
        case 'access_denied':
          errorMessage = 'Dostęp został odrzucony. Spróbuj ponownie.';
          break;
        case 'oauth_error':
          errorMessage = 'Wystąpił błąd podczas uwierzytelniania. Spróbuj ponownie.';
          break;
        default:
          errorMessage = 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.';
      }

      this.error.set(errorMessage);

      // Clear error from URL without reloading the page
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true,
      });
    }
  }

  /**
   * Handle login button click
   * Initiates Google OAuth flow
   */
  async handleLogin(): Promise<void> {
    try {
      // Set loading state and clear any previous errors
      this.isLoading.set(true);
      this.error.set(null);

      // Initiate OAuth flow with custom redirect
      // After successful auth, user should be redirected to /admin/dashboard
      await this.authService.signInWithGoogle({
        next: '/admin/dashboard',
      });

      // Note: User will be redirected to Google OAuth page
      // This component will not be active after this point
      // The flow continues in AuthCallbackComponent
    } catch (err) {
      console.error('Login error:', err);

      // Reset loading state and set error message
      this.isLoading.set(false);
      this.error.set('Wystąpił błąd podczas próby logowania. Spróbuj ponownie później.');
    }
  }
}
