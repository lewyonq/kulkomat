import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthSession, createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environment/environment';

@Injectable({
  providedIn: 'root',
})
export class Supabase implements OnDestroy {
  private router = inject(Router);
  private supabase: SupabaseClient;
  private authSubscription: { data: { subscription: { unsubscribe: () => void } } } | null = null;

  public session = signal<AuthSession | null>(null);
  public user = computed(() => this.session()?.user ?? null);
  public isAuthenticated = computed(() => this.user() !== null);
  public isLoading = signal(true);
  public error = signal<Error | null>(null);

  constructor() {
    this.supabase = createClient(environment.supabase.url, environment.supabase.anonKey);
    this.initAuth();
  }

  private async initAuth(): Promise<void> {
    try {
      const {
        data: { session },
        error,
      } = await this.supabase.auth.getSession();

      if (error) {
        throw error;
      }

      this.session.set(session);

      this.authSubscription = this.supabase.auth.onAuthStateChange((event, session) => {
        this.session.set(session);

        // Redirect to dashboard after successful sign in
        if (event === 'SIGNED_IN' && session) {
          this.router.navigate(['/dashboard']);
        }

        // Redirect to login after sign out
        if (event === 'SIGNED_OUT') {
          this.router.navigate(['/login']);
        }
      });
    } catch (err) {
      this.error.set(err as Error);
      console.error('Auth initialization error:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  public async signInWithGoogle(): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/login`
        }
      });

      if (error) {
        throw error;
      }
    } catch (err) {
      this.error.set(err as Error);
      console.error('Sign in error:', err);
      throw err;
    }
  }

  /**
   * Check for OAuth errors in URL parameters
   * Call this method in components that handle OAuth callbacks
   * @returns Error message if found, null otherwise
   */
  public checkOAuthError(): string | null {
    if (typeof window === 'undefined') return null;

    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const errorDescription = params.get('error_description');

    if (error) {
      // Clean URL from error parameters
      window.history.replaceState({}, document.title, window.location.pathname);

      return errorDescription || 'Wystąpił błąd podczas próby logowania. Spróbuj ponownie później.';
    }

    return null;
  }

  public async signOut(): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signOut();

      if (error) {
        throw error;
      }
    } catch (err) {
      this.error.set(err as Error);
      console.error('Sign out error:', err);
      throw err;
    }
  }

  ngOnDestroy(): void {
    this.authSubscription?.data.subscription.unsubscribe();
  }
}
