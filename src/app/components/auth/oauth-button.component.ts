import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * OAuthButtonComponent
 *
 * Specialized button for OAuth provider authentication (Google, Facebook, etc.).
 * Displays provider logo and appropriate text.
 * Emits click event to inform parent component about login intent.
 */
@Component({
  selector: 'app-oauth-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      (click)="handleClick()"
      class="flex w-full items-center justify-center gap-3 rounded-lg border-2 border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 transition-all duration-200 hover:border-primary-500 hover:bg-gray-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 active:scale-[0.98]"
      [attr.aria-label]="'Zaloguj się z ' + providerName()"
    >
      @if (provider() === 'google') {
        <svg class="h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      }
      <span>{{ buttonText() }}</span>
    </button>
  `,
  styles: []
})
export class OAuthButtonComponent {
  /**
   * OAuth provider type
   * Currently supports: 'google'
   * Can be extended for other providers (facebook, apple, etc.)
   */
  provider = input<'google'>('google');

  /**
   * Custom button text (optional)
   * If not provided, defaults to "Zaloguj się z {Provider}"
   */
  text = input<string>();

  /**
   * Click event emitter
   * Parent component should handle this to initiate OAuth flow
   */
  clickEvent = output<void>();

  handleClick(): void {
    this.clickEvent.emit();
  }

  protected providerName(): string {
    const names: Record<string, string> = {
      google: 'Google'
    };
    return names[this.provider()] || 'Provider';
  }

  protected buttonText(): string {
    return this.text() || `Zaloguj się z ${this.providerName()}`;
  }
}
