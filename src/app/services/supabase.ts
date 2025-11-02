import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthSession, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environment/environment';
import { catchError, from, map, Observable, tap, throwError } from 'rxjs';
import { ProfileDTO } from '../types';
import { SupabaseClientService } from './supabase-client.service';

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

  /**
   * Validate UUID format to prevent SQL injection attempts
   * @param uuid - String to validate
   * @returns true if valid UUID format
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validate short ID format (6-8 alphanumeric characters)
   * @param shortId - String to validate
   * @returns true if valid short ID format
   */
  private isValidShortId(shortId: string): boolean {
    const shortIdRegex = /^[A-Z0-9]{6,8}$/;
    return shortIdRegex.test(shortId);
  }

  constructor() {
    const clientService = inject(SupabaseClientService) as SupabaseClientService;
    this.supabase = clientService.client;
    this.initAuth();
  }

  /**
   * Get Supabase client instance
   * WARNING: Direct client access should be used sparingly
   * Prefer using service methods for better error handling and state management
   */
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
      // Validate session is not expired before proceeding
      if (session?.user && session.expires_at) {
        const expiresAt = new Date(session.expires_at * 1000);
        const now = new Date();
        
        if (expiresAt > now) {
          await this.ensureProfileExists(session.user.id);
        } else {
          console.warn('Session expired, skipping profile creation');
          this.session.set(null);
        }
      }

      this.authSubscription = this.supabase.auth.onAuthStateChange(async (event, session) => {
        this.session.set(session);

        // Ensure profile exists and redirect to dashboard after successful sign in
        if (event === 'SIGNED_IN' && session) {
          await this.ensureProfileExists(session.user.id);
        }

        // Update session when token is refreshed
        if (event === 'TOKEN_REFRESHED' && session) {
          console.log('Token refreshed successfully');
          // Session is already updated above, just log for debugging
        }

        if (event === 'SIGNED_OUT') {
          this.currentProfile.set(null);
          this.error.set(null);
          const afterLogout = (environment as any)?.auth?.defaultRedirectAfterLogout || '/login';
          this.router.navigate([afterLogout]);
        }

        // Handle user update events
        if (event === 'USER_UPDATED' && session) {
          console.log('User data updated');
          // Refresh profile to get latest data
          this.refreshCurrentUserProfile().subscribe({
            next: (profile) => {
              this.currentProfile.set(profile);
            },
            error: (err) => {
              console.error('Error refreshing profile after user update:', err);
            }
          });
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
      const defaultRedirect = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '/auth/callback';
      const baseRedirect = (environment as any)?.auth?.redirectUri || defaultRedirect;
      const next = this.router.url && this.router.url !== '/login' ? this.router.url : '/';
      const redirectUrl = new URL(baseRedirect, typeof window !== 'undefined' ? window.location.origin : undefined);
      if (!redirectUrl.searchParams.get('next')) {
        redirectUrl.searchParams.set('next', next);
      }

      const { error } = await this.supabase.auth.signInWithOAuth({
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

    try {
      const params = new URLSearchParams(window.location.search);
      const error = params.get('error');
      const errorDescription = params.get('error_description');

      if (error) {
        // Clean URL from error parameters
        try {
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (historyError) {
          console.warn('Failed to clean URL parameters:', historyError);
        }

        // Sanitize error description to prevent XSS
        // Only return if it's a safe string (alphanumeric, spaces, and basic punctuation)
        const safeErrorDescription = errorDescription?.replace(/[^a-zA-Z0-9\s.,!?-]/g, '');
        
        return safeErrorDescription || 'Wystąpił błąd podczas próby logowania. Spróbuj ponownie później.';
      }

      return null;
    } catch (err) {
      console.error('Error checking OAuth error:', err);
      return null;
    }
  }

  public async handleOAuthCallback(url?: string): Promise<void> {
    try {
      const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
      if (!currentUrl) {
        throw new Error('Missing callback URL');
      }

      // With detectSessionInUrl: true, Supabase automatically handles the code exchange
      // We just need to wait for the session to be set and handle navigation
      const urlObj = new URL(currentUrl);

      // Check for OAuth errors in URL
      const error = urlObj.searchParams.get('error');
      const errorDescription = urlObj.searchParams.get('error_description');

      if (error) {
        throw new Error(errorDescription || 'OAuth authentication failed');
      }

      // Wait for session to be available (it should be set by auto-detection)
      // Get current session
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (session?.user) {
        this.session.set(session);
        await this.ensureProfileExists(session.user.id);
      }

      const next = urlObj.searchParams.get('next');

      // Clean the URL to remove sensitive params
      if (typeof window !== 'undefined') {
        try {
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch {}
      }

      const defaultAfterLogin = (environment as any)?.auth?.defaultRedirectAfterLogin || '/';
      const target = next || defaultAfterLogin;
      this.router.navigate([target]);
    } catch (err) {
      const message = (err as any)?.message || 'OAuth callback failed';
      this.error.set(new Error(message));
      this.router.navigate(['/login'], { queryParams: { error_description: message } });
    }
  }

  public async signOut(): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signOut();

      if (error) {
        throw error;
      }

      // Clear all user-related state after successful sign out
      this.currentProfile.set(null);
      this.error.set(null);
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
    const userId = this.user()?.id;

    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    if (!this.isValidUUID(userId)) {
      return throwError(() => new Error('Invalid user ID format'));
    }

    this.isLoading.set(true);
    this.error.set(null);

    return from(
      this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
    ).pipe(
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
      tap((profile) => {
        this.currentProfile.set(profile);
        this.isLoading.set(false);
      }),
      catchError((err) => {
        const errorMessage = err?.message || 'Failed to fetch profile';
        this.error.set(new Error(errorMessage));
        this.isLoading.set(false);
        return throwError(() => new Error(errorMessage));
      }),
    );
  }

  /**
   * Refresh Current User Profile
   * Fetches profile data without auth check to avoid lock issues
   * Uses cached user ID from session
   */
  refreshCurrentUserProfile(): Observable<ProfileDTO> {
    const userId = this.user()?.id;
    
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    if (!this.isValidUUID(userId)) {
      return throwError(() => new Error('Invalid user ID format'));
    }

    return from(
      this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
        .then(({ data, error }) => {
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
      }),
      catchError((err) => {
        const errorMessage = err?.message || 'Failed to refresh profile';
        console.error('Profile refresh error:', errorMessage);
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
    if (!this.isValidUUID(userId)) {
      console.error('Invalid user ID format:', userId);
      return;
    }

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
        this.refreshCurrentUserProfile().subscribe({
          next: (profile) => {
            this.currentProfile.set(profile);
          },
          error: (err) => {
            console.error('Error refreshing profile:', err);
          }
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
      
      // Refresh profile after creation
      this.refreshCurrentUserProfile().subscribe({
        next: (profile) => {
          this.currentProfile.set(profile);
        },
        error: (err) => {
          console.error('Error refreshing newly created profile:', err);
        }
      });
    } catch (err) {
      const error = err as Error;
      console.error('Error in ensureProfileExists:', {
        message: error.message,
        userId,
        stack: error.stack
      });
      
      // Set error signal but don't throw to prevent blocking user login
      this.error.set(new Error(`Failed to ensure profile exists: ${error.message}`));
      
      // The profile can be created later if needed
    }
  }

  /**
   * Get Profile by Short ID (Seller Only)
   * GET /api/profiles/by-short-id/{short_id}
   * Retrieve a customer profile by their short ID
   */
  getProfileByShortId(shortId: string): Observable<ProfileDTO> {
    if (!this.isValidShortId(shortId)) {
      return throwError(() => new Error('Invalid short ID format'));
    }

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
   * Uses cryptographically secure random number generation
   * Implements constant-time checks to prevent timing attacks
   * Uses exponential backoff to prevent DoS
   */
  private async generateUniqueShortId(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const maxAttempts = 5; // Reduced to prevent DoS
    const minDelay = 50; // Minimum delay in ms to prevent timing attacks

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const startTime = Date.now();
      
      // Exponential backoff: wait longer on each retry
      if (attempt > 0) {
        const backoffDelay = Math.min(1000, 100 * Math.pow(2, attempt - 1));
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
      
      // Use crypto.getRandomValues for cryptographically secure randomness
      const lengthArray = new Uint32Array(1);
      crypto.getRandomValues(lengthArray);
      const length = (lengthArray[0] % 3) + 6; // 6-8 characters
      
      const randomValues = new Uint32Array(length);
      crypto.getRandomValues(randomValues);
      
      let shortId = '';
      for (let i = 0; i < length; i++) {
        shortId += chars.charAt(randomValues[i] % chars.length);
      }

      // Check if short_id already exists
      const { data, error } = await this.supabase
        .from('profiles')
        .select('short_id')
        .eq('short_id', shortId)
        .maybeSingle();

      // Add constant-time delay to prevent timing attacks
      const elapsed = Date.now() - startTime;
      if (elapsed < minDelay) {
        await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
      }

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
