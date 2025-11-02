import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

/**
 * AuthCallbackComponent
 *
 * Handles OAuth callback after redirect from authentication provider (Google).
 * Exchanges auth code for session and redirects user to appropriate page.
 * Shows loading spinner while processing the callback.
 */
@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-[50vh] flex items-center justify-center">
      <div class="flex items-center gap-3 text-sm" role="status" aria-live="polite">
        <span class="animate-spin inline-block w-5 h-5 border-2 border-gray-300 border-t-pink-500 rounded-full"></span>
        <span>Finalizowanie logowania...</span>
      </div>
    </div>
  `,
  styles: [],
})
export class AuthCallbackComponent implements OnInit {
  private authService = inject(AuthService);

  async ngOnInit(): Promise<void> {
    await this.authService.handleOAuthCallback(typeof window !== 'undefined' ? window.location.href : '');
  }
}
