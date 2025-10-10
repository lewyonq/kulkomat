import { computed, Injectable, signal } from '@angular/core';
import { AuthSession, createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environment/environment';

@Injectable({
  providedIn: 'root',
})
export class Supabase {
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

      this.authSubscription = this.supabase.auth.onAuthStateChange((_event, session) => {
        this.session.set(session);
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
