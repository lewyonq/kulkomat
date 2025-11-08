import { Injectable, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Supabase } from './supabase';
import { toObservable } from '@angular/core/rxjs-interop';
import { map, Observable } from 'rxjs';
import type { Session, User } from '@supabase/supabase-js';
import type { ProfileDTO } from '../types';
import { environment } from '../environment/environment';

/**
 * AuthService - Main authentication service layer
 *
 * Provides high-level authentication methods and state management.
 * Acts as the primary interface for components to interact with authentication.
 *
 * Usage in components:
 * - Inject AuthService (not Supabase directly)
 * - Use exposed signals/observables for reactive state
 * - Call methods for authentication actions
 *
 * Note: Guards can still use Supabase directly for performance/simplicity
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(Supabase);
  private router = inject(Router);

  // Observables for reactive streams
  readonly session$: Observable<Session | null> = toObservable(
    this.supabase.session,
  ) as unknown as Observable<Session | null>;
  readonly user$: Observable<User | null> = this.session$.pipe(
    map((s) => (s ? (s.user as User) : null)),
  );

  // Computed signals for direct access to current state
  readonly user = computed(() => this.supabase.user());
  readonly session = computed(() => this.supabase.session());
  readonly isAuthenticated = computed(() => this.supabase.isAuthenticated());
  readonly isLoading = computed(() => this.supabase.isLoading());
  readonly currentProfile = computed(() => this.supabase.currentProfile());
  readonly error = computed(() => this.supabase.error());

  init(): void {
    // Supabase service initializes itself in constructor; nothing additional required here.
  }

  /**
   * Sign in with Google OAuth
   * @param options - Optional redirect configuration
   * @param options.redirectTo - Custom redirect URL (defaults to /auth/callback)
   * @param options.next - URL to navigate to after successful login
   */
  async signInWithGoogle(options?: { redirectTo?: string; next?: string }): Promise<void> {
    try {
      const defaultRedirect =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : '/auth/callback';
      const baseRedirect =
        options?.redirectTo || (environment as any)?.auth?.redirectUri || defaultRedirect;

      // Determine the 'next' parameter (where to go after login)
      const next =
        options?.next || (this.router.url && this.router.url !== '/login' ? this.router.url : '/');

      // Build redirect URL with 'next' parameter
      const redirectUrl = new URL(
        baseRedirect,
        typeof window !== 'undefined' ? window.location.origin : undefined,
      );
      if (!redirectUrl.searchParams.get('next')) {
        redirectUrl.searchParams.set('next', next);
      }

      const { error } = await this.supabase.client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl.toString(),
          scopes: 'openid email profile',
        },
      });

      if (error) {
        throw error;
      }
    } catch (err) {
      console.error('Sign in error:', err);
      throw err;
    }
  }

  /**
   * Check for OAuth errors in URL parameters
   * Call this method in components that handle OAuth callbacks
   * @returns Error message if found, null otherwise
   */
  checkOAuthError(): string | null {
    return this.supabase.checkOAuthError();
  }

  /**
   * Handle OAuth callback after redirect from provider
   * @param url - The callback URL with auth code/tokens
   */
  async handleOAuthCallback(url: string): Promise<void> {
    await this.supabase.handleOAuthCallback(url);
  }

  /**
   * Sign out the current user
   * Redirects to login page after successful sign out
   */
  async signOut(): Promise<void> {
    await this.supabase.signOut();
    const afterLogout = (environment as any)?.auth?.defaultRedirectAfterLogout || '/login';
    this.router.navigate([afterLogout]);
  }

  /**
   * Get current user profile (cached or fetched)
   * Returns Observable for reactive updates
   */
  getCurrentUserProfile(): Observable<ProfileDTO> {
    return this.supabase.getCurrentUserProfile();
  }

  /**
   * Refresh current user profile from database
   * Forces a fresh fetch from the database
   */
  refreshCurrentUserProfile(): Observable<ProfileDTO> {
    return this.supabase.refreshCurrentUserProfile();
  }

  /**
   * Get session once (non-reactive)
   * Useful for one-time checks
   */
  async getSessionOnce(): Promise<Session | null> {
    const { data, error } = await this.supabase.client.auth.getSession();
    if (error) return null;
    return (data?.session as Session) ?? null;
  }

  /**
   * Get user once (non-reactive)
   * Useful for one-time checks
   */
  async getUserOnce(): Promise<User | null> {
    const { data, error } = await this.supabase.client.auth.getUser();
    if (error) return null;
    return (data?.user as User) ?? null;
  }

  /**
   * Get Supabase client for direct access
   * Use sparingly - prefer using AuthService methods
   * Useful for realtime subscriptions and advanced queries
   */
  get client() {
    return this.supabase.client;
  }
}
