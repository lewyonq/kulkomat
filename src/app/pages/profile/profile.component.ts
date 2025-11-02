import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProfileDTO } from '../../types';
import { UserIdDisplayComponent } from '../../components/profile/user-id-display.component';

/**
 * Profile Component (Page Container)
 *
 * Displays user profile information and provides access to:
 * - User's email address
 * - Account creation date
 * - Unique short_id with QR code
 * - Navigation to activity history
 * - Logout functionality
 *
 * Features:
 * - Loading and error states
 * - Retry mechanism on error
 * - Mobile-first responsive design
 * - Accessible UI with ARIA labels
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, UserIdDisplayComponent],
  template: `
    <div class="profile-container">
      <!-- Loading State -->
      @if (isLoading() && !profile()) {
        <div class="loading-container">
          <div class="spinner"></div>
          <p class="loading-text">Ładowanie profilu...</p>
        </div>
      }

      <!-- Error State -->
      @else if (error() && !profile()) {
        <div class="error-container">
          <div class="error-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
              <path d="M12 8V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              <circle cx="12" cy="16" r="1" fill="currentColor" />
            </svg>
          </div>
          <h2 class="error-title">Nie udało się pobrać profilu</h2>
          <p class="error-message">{{ getErrorMessage() }}</p>
          <button class="retry-button" (click)="onRetry()" type="button">Spróbuj ponownie</button>
        </div>
      }

      <!-- Content State -->
      @else if (profile()) {
        <div class="content-wrapper">

          <!-- Main Content -->
          <main class="profile-content">
            <!-- QR Code Section -->
            <section>
              <app-user-id-display [shortId]="profile()!.short_id" [showQRCode]="true">
              </app-user-id-display>
            </section>
            <!-- User Info Section -->
            <section class="section info-section">
              <div class="info-card">
                <h2 class="section-title">Informacje o koncie</h2>

                <div class="info-item">
                  <div class="info-icon">
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
                  <div class="info-content">
                    <p class="info-label">Email</p>
                    <p class="info-value">{{ userEmail() || 'Brak danych' }}</p>
                  </div>
                </div>

                <div class="info-item">
                  <div class="info-icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect
                        x="3"
                        y="4"
                        width="18"
                        height="18"
                        rx="2"
                        stroke="currentColor"
                        stroke-width="2"
                      />
                      <path d="M16 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                      <path d="M8 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                      <path d="M3 10H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                    </svg>
                  </div>
                  <div class="info-content">
                    <p class="info-label">Data utworzenia konta</p>
                    <p class="info-value">{{ formattedCreatedAt() }}</p>
                  </div>
                </div>
              </div>
            </section>

            <!-- Actions Section -->
            <section class="section actions-section">
              <button
                class="action-button primary"
                (click)="onNavigateToHistory()"
                type="button"
                aria-label="Przejdź do historii aktywności"
              >
                <svg
                  class="button-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 8V12L15 15"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                  <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" />
                </svg>
                <span>Historia</span>
              </button>

              <button
                class="action-button secondary"
                (click)="onLogout()"
                type="button"
                aria-label="Wyloguj się z konta"
              >
                <svg
                  class="button-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M16 17L21 12L16 7"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M21 12H9"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <span>Wyloguj</span>
              </button>
            </section>
          </main>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .profile-container {
        min-height: 100vh;
        padding: 1rem;
      }

      /* Loading State */
      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        gap: 1.5rem;
      }

      .spinner {
        width: 48px;
        height: 48px;
        border: 4px solid #e0e0e0;
        border-top-color: #6750a4;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .loading-text {
        font-size: 1rem;
        color: #666;
        font-weight: 500;
      }

      /* Error State */
      .error-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        gap: 1.5rem;
        padding: 2rem;
        text-align: center;
      }

      .error-icon {
        width: 64px;
        height: 64px;
        color: #d32f2f;
      }

      .error-icon svg {
        width: 100%;
        height: 100%;
      }

      .error-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1a1a1a;
        margin: 0;
      }

      .error-message {
        font-size: 1rem;
        color: #666;
        margin: 0;
        max-width: 400px;
        line-height: 1.5;
      }

      .retry-button {
        padding: 0.875rem 2rem;
        background: #6750a4;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(103, 80, 164, 0.3);
      }

      .retry-button:hover {
        background: #5842a0;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(103, 80, 164, 0.4);
      }

      .retry-button:active {
        transform: translateY(0);
      }

      /* Content State */
      .content-wrapper {
        max-width: 800px;
        margin: 0 auto;
        padding-bottom: 2rem;
      }

      .profile-header {
        text-align: center;
        padding: 2rem 1rem 1rem;
        margin-bottom: 1rem;
      }

      .profile-title {
        font-size: 2rem;
        font-weight: 700;
        color: #1a1a1a;
        margin: 0;
      }

      .profile-content {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .section {
        width: 100%;
      }

      .section-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1a1a1a;
        margin: 0 0 1rem 0;
        text-align: center;
      }

      /* Info Section */
      .info-card {
        background: white;
        border-radius: 16px;
        padding: 2rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .info-item {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        padding: 1rem 0;
      }

      .info-item:not(:last-child) {
        border-bottom: 1px solid #e0e0e0;
      }

      .info-icon {
        width: 24px;
        height: 24px;
        color: rgba(219, 39, 119, 1);
        flex-shrink: 0;
        margin-top: 0.25rem;
      }

      .info-icon svg {
        width: 100%;
        height: 100%;
      }

      .info-content {
        flex: 1;
      }

      .info-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #666;
        margin: 0 0 0.25rem 0;
      }

      .info-value {
        font-size: 1rem;
        font-weight: 600;
        color: #1a1a1a;
        margin: 0;
        word-break: break-word;
      }

      /* QR Section */
      .qr-section {
        background: white;
        border-radius: 16px;
        padding: 2rem 1rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      /* Actions Section */
      .actions-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
      }

      .action-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        padding: 1rem 2rem;
        border: none;
        border-radius: 12px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .action-button.primary {
        background: var(--gradient-primary);
        color: white;
      }

      .action-button.primary:hover {
        filter: brightness(1.1);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(219, 39, 119, 0.4);
      }

      .action-button.secondary {
        background: white;
        color: #d32f2f;
        border: 2px solid #d32f2f;
        margin-bottom: 2rem;
      }

      .action-button.secondary:hover {
        background: #fef2f2;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(211, 47, 47, 0.2);
      }

      .action-button:active {
        transform: translateY(0);
      }

      .action-button:focus-visible {
        outline: 2px solid #6750a4;
        outline-offset: 2px;
      }

      .button-icon {
        width: 24px;
        height: 24px;
      }

      /* Responsive Design */
      @media (max-width: 640px) {
        .profile-container {
          padding: 0.5rem;
        }

        .profile-header {
          padding: 1.5rem 0.5rem 0.5rem;
        }

        .profile-title {
          font-size: 1.5rem;
        }

        .info-card {
          padding: 1.5rem;
        }

        .section-title {
          font-size: 1.125rem;
        }

        .action-button {
          padding: 0.875rem 1.5rem;
        }
      }

      @media (min-width: 768px) {
        .profile-content {
          gap: 2rem;
        }

        .actions-section {
          flex-direction: row;
          justify-content: center;
        }

        .action-button {
          min-width: 200px;
        }
      }

      /* Accessibility - Reduced Motion */
      @media (prefers-reduced-motion: reduce) {
        .action-button,
        .retry-button {
          transition: none;
        }

        .action-button:hover,
        .action-button.primary:hover,
        .action-button.secondary:hover,
        .retry-button:hover {
          transform: none;
        }
      }
    `,
  ],
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Loading and error states
  protected isLoading = signal<boolean>(true);
  protected error = signal<Error | null>(null);

  // Data state
  protected profile = signal<ProfileDTO | null>(null);

  // Computed states
  protected userEmail = computed<string | null>(() => {
    return this.authService.user()?.email ?? null;
  });

  protected formattedCreatedAt = computed<string>(() => {
    const currentProfile = this.profile();
    if (!currentProfile?.created_at) return 'Brak danych';

    const date = new Date(currentProfile.created_at);
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  /**
   * Load user profile from AuthService
   * Uses the centralized currentProfile signal to avoid concurrent API calls
   */
  private loadProfile(): void {
    const currentProfile = this.authService.currentProfile();

    if (currentProfile) {
      this.profile.set(currentProfile);
      this.isLoading.set(false);
    } else {
      // Only fetch if not already loaded
      this.isLoading.set(true);
      this.error.set(null);

      this.authService.getCurrentUserProfile().subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.error.set(err);
          this.isLoading.set(false);
        },
      });
    }
  }

  /**
   * Retry loading profile after error
   */
  protected onRetry(): void {
    this.loadProfile();
  }

  /**
   * Navigate to activity history
   */
  protected onNavigateToHistory(): void {
    this.router.navigate(['/history']);
  }

  /**
   * Logout user and redirect to login page
   */
  protected onLogout(): void {
    this.authService.signOut();
  }

  /**
   * Get user-friendly error message
   */
  protected getErrorMessage(): string {
    const err = this.error();
    if (!err) return 'Wystąpił nieoczekiwany błąd.';

    const message = err.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return 'Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe.';
    }

    if (message.includes('not found')) {
      return 'Profil nie został znaleziony. Spróbuj wylogować się i zalogować ponownie.';
    }

    if (message.includes('not authenticated')) {
      return 'Sesja wygasła. Zaloguj się ponownie.';
    }

    return 'Wystąpił błąd podczas ładowania profilu. Spróbuj ponownie później.';
  }
}
