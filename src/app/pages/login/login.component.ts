import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthCardComponent } from '../../components/auth/auth-card.component';
import { OAuthButtonComponent } from '../../components/auth/oauth-button.component';
import { AuthService } from '../../services/auth.service';

/**
 * LoginComponent
 *
 * Main login page component accessible at /login route.
 * Handles user authentication via Google OAuth using AuthService.
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
      <div class="mb-3 text-center">
        <h1 class="text-3xl font-bold" style="color: var(--md-sys-color-primary);">
          Odkryj korzyści już teraz!
        </h1>

        <p class="mt-2 text-lg" style="color: var(--md-sys-color-on-surface-variant);">
          Dołącz do programu lojalnościowego naszej lodziarni i zacznij zbierać pieczątki!
        </p>
      </div>

      <!-- Benefits -->
      <div class="my-6 space-y-3 text-left" style="color: var(--md-sys-color-on-surface-variant);">
        <div class="flex items-start">
          <span class="mr-2 mt-1 text-primary" style="color: var(--md-sys-color-primary);">✓</span>
          <p>Zbierz 10 pieczątek i wymień je na darmową kulkę.</p>
        </div>
        <div class="flex items-start">
          <span class="mr-2 mt-1 text-primary" style="color: var(--md-sys-color-primary);">✓</span>
          <p>Otrzymuj kupony rabatowe na kulki.</p>
        </div>
        <div class="flex items-start">
          <span class="mr-2 mt-1 text-primary" style="color: var(--md-sys-color-primary);">✓</span>
          <p>
            Przeglądaj swoją historię doładowań pieczątek i wykorzystanych kuponów w wygodny sposób.
          </p>
        </div>
      </div>

      <!-- OAuth Button -->
      <app-oauth-button provider="google" (clickEvent)="onGoogleSignIn()" />

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
        <div
          class="mt-4 text-center text-sm"
          style="color: var(--md-sys-color-primary);"
          role="status"
          aria-live="polite"
        >
          <span>Przekierowywanie do Google...</span>
        </div>
      }
    </app-auth-card>
  `,
  styles: [],
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  protected isLoading = signal(false);
  protected error = signal<string | null>(null);

  ngOnInit(): void {
    // Check for OAuth errors in URL (e.g., user cancelled, provider error)
    const oauthError = this.authService.checkOAuthError();
    if (oauthError) {
      this.error.set(oauthError);
    }

    if (typeof window !== 'undefined' && !this.error()) {
      try {
        const url = new URL(window.location.href);
        const msg = url.searchParams.get('error_description');
        if (msg) {
          this.error.set(msg);
        }
      } catch {}
    }
  }

  /**
   * Handles Google OAuth sign-in
   * Initiates OAuth flow by calling AuthService
   * User will be redirected to Google login page
   */
  protected async onGoogleSignIn(): Promise<void> {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      await this.authService.signInWithGoogle();

      // Note: User will be redirected to Google OAuth page
      // After successful authentication, they'll return to the app
      // and the auth state change will be handled by AuthService
    } catch (err) {
      this.isLoading.set(false);

      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Wystąpił błąd podczas próby logowania. Spróbuj ponownie później.';

      this.error.set(errorMessage);
      console.error('Login error:', err);
    }
  }
}
