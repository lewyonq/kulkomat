import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthCardComponent } from '../../components/auth/auth-card.component';
import { OAuthButtonComponent } from '../../components/auth/oauth-button.component';
import { Supabase } from '../../services/supabase';

/**
 * LoginComponent
 *
 * Main login page component accessible at /login route.
 * Handles user authentication via Google OAuth using Supabase.
 * Displays loyalty program benefits and provides Google sign-in button.
 * Checks for OAuth errors in URL parameters on component initialization.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [AuthCardComponent, OAuthButtonComponent],
  template: `
  
    <app-auth-card>
      <!-- Header -->
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold text-gray-900">
          Witaj ponownie!
        </h1>
        <p class="mt-2 text-sm text-gray-600">
          Zaloguj się, aby kontynuować
        </p>
      </div>

      <!-- Loyalty Program Description -->
      <div class="mb-6 rounded-lg bg-primary-50 p-4">
        <h2 class="mb-2 text-lg font-semibold text-primary-900">
          Program lojalnościowy
        </h2>
        <ul class="space-y-2 text-sm text-primary-800">
          <li class="flex items-start gap-2">
            <svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
            </svg>
            <span>Zbieraj pieczątki za każdy zakup</span>
          </li>
          <li class="flex items-start gap-2">
            <svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
            </svg>
            <span>Otrzymuj darmowe lody po zebraniu 10 pieczątek</span>
          </li>
          <li class="flex items-start gap-2">
            <svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
            </svg>
            <span>Śledź historię swoich nagród</span>
          </li>
        </ul>
      </div>

      <!-- OAuth Button -->
      <app-oauth-button
        provider="google"
        (clickEvent)="onGoogleSignIn()"
      />

      <!-- Error Message -->
      @if (error()) {
        <div
          class="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-800"
          role="alert"
          aria-live="polite"
        >
          <p class="font-medium">Wystąpił błąd</p>
          <p class="mt-1">{{ error() }}</p>
        </div>
      }

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="mt-4 text-center text-sm text-gray-600" role="status" aria-live="polite">
          <span>Przekierowywanie do Google...</span>
        </div>
      }
    </app-auth-card>
  `,
  styles: []
})
export class LoginComponent implements OnInit {
  private supabase = inject(Supabase);
  private router = inject(Router);

  protected isLoading = signal(false);
  protected error = signal<string | null>(null);

  ngOnInit(): void {
    // Check for OAuth errors in URL (e.g., user cancelled, provider error)
    const oauthError = this.supabase.checkOAuthError();
    if (oauthError) {
      this.error.set(oauthError);
    }
  }

  /**
   * Handles Google OAuth sign-in
   * Initiates OAuth flow by calling Supabase service
   * User will be redirected to Google login page
   */
  protected async onGoogleSignIn(): Promise<void> {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      await this.supabase.signInWithGoogle();

      // Note: User will be redirected to Google OAuth page
      // After successful authentication, they'll return to the app
      // and the auth state change will be handled by Supabase service
    } catch (err) {
      this.isLoading.set(false);

      const errorMessage = err instanceof Error
        ? err.message
        : 'Wystąpił błąd podczas próby logowania. Spróbuj ponownie później.';

      this.error.set(errorMessage);
      console.error('Login error:', err);
    }
  }
}
