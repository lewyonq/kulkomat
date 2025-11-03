import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SellersService } from '../../services/sellers.service';

/**
 * AuthCallbackComponent
 *
 * Handles OAuth callback after redirect from authentication provider (Google).
 * Exchanges auth code for session and redirects user to appropriate page.
 * Shows loading spinner while processing the callback.
 *
 * Flow:
 * 1. Handle OAuth callback and establish session
 * 2. Check if user is trying to access admin panel (via 'next' param)
 * 3. If accessing admin, verify seller role
 * 4. Redirect to appropriate destination based on role and intent
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
  private sellersService = inject(SellersService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  async ngOnInit(): Promise<void> {
    try {
      // Handle OAuth callback and establish session
      await this.authService.handleOAuthCallback(typeof window !== 'undefined' ? window.location.href : '');

      // Get the 'next' parameter to determine where user intended to go
      const next = this.route.snapshot.queryParamMap.get('next');

      // Check if user is trying to access admin panel
      if (next && next.startsWith('/admin')) {
        await this.handleAdminAccess(next);
      }
      // If not admin access, normal flow - handleOAuthCallback already handled navigation
    } catch (error) {
      console.error('OAuth callback error:', error);
      // Error handling is already done in handleOAuthCallback
      // It redirects to /login with error message
    }
  }

  /**
   * Handle admin panel access attempt
   * Verifies seller role and redirects accordingly
   */
  private async handleAdminAccess(intendedPath: string): Promise<void> {
    try {
      // Wait a moment for session to be fully established
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if current user is a seller
      const isSeller = await this.sellersService.isCurrentUserSeller();

      if (isSeller) {
        // User is a seller - allow access to admin panel
        // Redirect to admin dashboard or intended admin path
        const targetPath = intendedPath === '/admin/login' ? '/admin/dashboard' : intendedPath;
        this.router.navigate([targetPath]);
      } else {
        // User is not a seller - deny access
        // Redirect back to admin login with unauthorized error
        this.router.navigate(['/admin/login'], {
          queryParams: { error: 'unauthorized' },
        });
      }
    } catch (error) {
      console.error('Error verifying seller role:', error);
      // On error, redirect to admin login with generic error
      this.router.navigate(['/admin/login'], {
        queryParams: { error: 'oauth_error' },
      });
    }
  }
}
