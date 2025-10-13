import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthSession, createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environment/environment';
import { catchError, from, map, Observable, tap, throwError } from 'rxjs';
import { ProfileDTO } from '../types';

@Injectable({
  providedIn: 'root',
})
export class Supabase implements OnDestroy {
  private router = inject(Router);
  private supabase: SupabaseClient;
  private authSubscription: { data: { subscription: { unsubscribe: () => void } } } | null = null;

  public session = signal<AuthSession | null>(null);
  public user = computed(() => this.session()?.user ?? null);
  public currentProfile = signal<ProfileDTO | null>(null);
  public isAuthenticated = computed(() => this.user() !== null);
  public isLoading = signal(true);
  public error = signal<Error | null>(null);

  constructor() {
    this.supabase = createClient(environment.supabase.url, environment.supabase.anonKey);
    this.initAuth();
  }

  public get client(): SupabaseClient {
    return this.supabase;
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

      // Ensure profile exists for current session
      if (session?.user) {
        await this.ensureProfileExists(session.user.id);
      }

      this.authSubscription = this.supabase.auth.onAuthStateChange(async (event, session) => {
        this.session.set(session);

        // Ensure profile exists and redirect to dashboard after successful sign in
        if (event === 'SIGNED_IN' && session) {
          await this.ensureProfileExists(session.user.id);
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
      });

      if (error) {
        throw error;
      }
      await this.initAuth();
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

  /**
   * Get Current User Profile
   * GET /api/profiles/me
   * Retrieve the authenticated user's profile
   */
  getCurrentUserProfile(): Observable<ProfileDTO> {
    this.isLoading.set(true);
    this.error.set(null);

    return from(
      this.supabase.auth.getUser().then(async ({ data: { user }, error: authError }) => {
        if (authError || !user) {
          throw new Error('User not authenticated');
        }

        const { data, error } = await this.supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error('Profile not found');
        }

        return data;
      }),
    ).pipe(
      map((profile) => ({
        id: profile.id,
        short_id: profile.short_id,
        stamp_count: profile.stamp_count,
        created_at: profile.created_at,
      })),
      tap((profile) => {
        this.currentProfile.set(profile);
        this.isLoading.set(false);
      }),
      catchError((err) => {
        const errorMessage = err?.message || 'Failed to fetch profile';
        this.error.set(errorMessage);
        this.isLoading.set(false);
        return throwError(() => new Error(errorMessage));
      }),
    );
  }

  /**
   * Ensure profile exists for the authenticated user
   * Creates a profile if it doesn't exist
   * @param userId - The user ID to check/create profile for
   */
  public async ensureProfileExists(userId: string): Promise<void> {
    try {
      // Check if profile already exists
      const { data: existingProfile, error: checkError } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking profile existence:', checkError);
        throw checkError;
      }

      // Profile already exists, nothing to do
      if (existingProfile) {
        this.getCurrentUserProfile().subscribe((profile) => {
          this.currentProfile.set(profile);
        });
        return;
      }

      // Generate unique short_id
      const shortId = await this.generateUniqueShortId();

      // Create new profile
      const { error: insertError } = await this.supabase.from('profiles').insert({
        id: userId,
        short_id: shortId,
        stamp_count: 0,
      });

      if (insertError) {
        // Handle duplicate key error (race condition)
        if (insertError.code === '23505') {
          console.warn('Profile already exists (race condition detected)');
          return;
        }

        console.error('Error creating profile:', insertError);
        throw insertError;
      }

      console.log('Profile created successfully for user:', userId);
    } catch (err) {
      console.error('Error in ensureProfileExists:', err);
      // Don't throw error to prevent blocking user login
      // The profile can be created later if needed
    }
  }

  /**
   * Get Profile by Short ID (Seller Only)
   * GET /api/profiles/by-short-id/{short_id}
   * Retrieve a customer profile by their short ID
   */
  getProfileByShortId(shortId: string): Observable<ProfileDTO> {
    this.isLoading.set(true);
    this.error.set(null);

    return from(this.supabase.from('profiles').select('*').eq('short_id', shortId).single()).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error('Profile not found');
        }

        return {
          id: data.id,
          short_id: data.short_id,
          stamp_count: data.stamp_count,
          created_at: data.created_at,
        };
      }),
      tap(() => {
        this.isLoading.set(false);
      }),
      catchError((err) => {
        let errorMessage = 'Failed to fetch profile';

        if (err?.code === 'PGRST116') {
          errorMessage = 'Profile not found';
        } else if (err?.message) {
          errorMessage = err.message;
        }

        this.error.set(new Error(errorMessage));
        this.isLoading.set(false);
        return throwError(() => new Error(errorMessage));
      }),
    );
  }

  /**
   * Generate a unique short ID (6-8 character alphanumeric code)
   * Checks database to ensure uniqueness
   */
  private async generateUniqueShortId(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const maxAttempts = 10;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const length = Math.floor(Math.random() * 3) + 6; // 6-8 characters
      let shortId = '';

      for (let i = 0; i < length; i++) {
        shortId += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Check if short_id already exists
      const { data, error } = await this.supabase
        .from('profiles')
        .select('short_id')
        .eq('short_id', shortId)
        .maybeSingle();

      if (error) {
        console.error('Error checking short_id uniqueness:', error);
        continue;
      }

      // If no profile found with this short_id, it's unique
      if (!data) {
        return shortId;
      }
    }

    throw new Error('Failed to generate unique short_id after multiple attempts');
  }

  ngOnDestroy(): void {
    this.authSubscription?.data.subscription.unsubscribe();
  }
}
