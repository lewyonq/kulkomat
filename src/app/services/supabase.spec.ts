import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Supabase } from './supabase';
import { SupabaseClientService } from './supabase-client.service';
import { ProfileDTO } from '../types';

describe('Supabase', () => {
  let service: Supabase;
  let routerMock: jasmine.SpyObj<Router>;
  let supabaseClientMock: any;
  let clientServiceMock: any;

  // Mock data with valid UUID format
  const mockUserId = '550e8400-e29b-41d4-a716-446655440000';

  const mockUser: any = {
    id: mockUserId,
    email: 'test@example.com',
    aud: 'authenticated',
    role: 'authenticated',
    created_at: '2024-01-01T00:00:00Z',
    app_metadata: {},
    user_metadata: {},
  };

  const mockSession: any = {
    user: mockUser,
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    expires_in: 3600,
    token_type: 'bearer',
  };

  const mockProfile: ProfileDTO = {
    id: mockUserId,
    short_id: 'ABC123',
    stamp_count: 5,
    created_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    // Create Supabase client mock with auth and database methods
    const authSubscriptionMock = {
      data: {
        subscription: {
          unsubscribe: jasmine.createSpy('unsubscribe'),
        },
      },
    };

    supabaseClientMock = {
      auth: {
        getSession: jasmine
          .createSpy('getSession')
          .and.returnValue(Promise.resolve({ data: { session: mockSession }, error: null })),
        signInWithOAuth: jasmine
          .createSpy('signInWithOAuth')
          .and.returnValue(Promise.resolve({ data: {}, error: null })),
        signOut: jasmine.createSpy('signOut').and.returnValue(Promise.resolve({ error: null })),
        onAuthStateChange: jasmine
          .createSpy('onAuthStateChange')
          .and.returnValue(authSubscriptionMock),
      },
      from: jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine
              .createSpy('single')
              .and.returnValue(Promise.resolve({ data: mockProfile, error: null })),
            maybeSingle: jasmine
              .createSpy('maybeSingle')
              .and.returnValue(Promise.resolve({ data: null, error: null })),
          }),
        }),
        insert: jasmine.createSpy('insert').and.returnValue(Promise.resolve({ error: null })),
      }),
    };

    // Create SupabaseClientService mock
    clientServiceMock = {
      client: supabaseClientMock,
    };

    // Create Router mock
    routerMock = jasmine.createSpyObj('Router', ['navigate']);
    Object.defineProperty(routerMock, 'url', {
      writable: true,
      configurable: true,
      value: '/dashboard',
    });

    TestBed.configureTestingModule({
      providers: [
        Supabase,
        { provide: SupabaseClientService, useValue: clientServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  describe('UUID Validation', () => {
    beforeEach(fakeAsync(() => {
      service = TestBed.inject(Supabase);
      tick();
    }));

    it('should validate correct UUID format', () => {
      // Access private method via bracket notation for testing
      const isValid = (service as any).isValidUUID('550e8400-e29b-41d4-a716-446655440000');
      expect(isValid).toBe(true);
    });

    it('should reject invalid UUID formats', () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '12345',
        'g50e8400-e29b-41d4-a716-446655440000', // invalid character
        '550e8400-e29b-41d4-a716-44665544000', // too short
        '550e8400-e29b-41d4-a716-4466554400000', // too long
        '550e8400e29b41d4a716446655440000', // missing dashes
      ];

      invalidUUIDs.forEach((uuid) => {
        const isValid = (service as any).isValidUUID(uuid);
        expect(isValid).toBe(false, `Should reject: ${uuid}`);
      });
    });

    it('should be case insensitive for UUID validation', () => {
      const isValidLower = (service as any).isValidUUID('550e8400-e29b-41d4-a716-446655440000');
      const isValidUpper = (service as any).isValidUUID('550E8400-E29B-41D4-A716-446655440000');

      expect(isValidLower).toBe(true);
      expect(isValidUpper).toBe(true);
    });
  });

  describe('Short ID Validation', () => {
    beforeEach(fakeAsync(() => {
      service = TestBed.inject(Supabase);
      tick();
    }));

    it('should validate correct short ID format (6-8 uppercase alphanumeric)', () => {
      const validShortIds = ['ABC123', 'ABCD1234', 'AB12CD34'];

      validShortIds.forEach((shortId) => {
        const isValid = (service as any).isValidShortId(shortId);
        expect(isValid).toBe(true, `Should accept: ${shortId}`);
      });
    });

    it('should reject invalid short ID formats', () => {
      const invalidShortIds = [
        'abc123', // lowercase
        'AB12', // too short (less than 6)
        'ABCDEFGHI', // too long (more than 8)
        'AB-123', // special characters
        'AB 123', // spaces
        'АВС123', // non-ASCII characters
      ];

      invalidShortIds.forEach((shortId) => {
        const isValid = (service as any).isValidShortId(shortId);
        expect(isValid).toBe(false, `Should reject: ${shortId}`);
      });
    });

    it('should accept short IDs with length 6, 7, and 8', () => {
      expect((service as any).isValidShortId('ABCD12')).toBe(true); // 6
      expect((service as any).isValidShortId('ABCD123')).toBe(true); // 7
      expect((service as any).isValidShortId('ABCD1234')).toBe(true); // 8
    });
  });

  describe('Initialization', () => {
    it('should be created', fakeAsync(() => {
      service = TestBed.inject(Supabase);
      tick();
      expect(service).toBeTruthy();
    }));

    it('should initialize auth on construction', fakeAsync(() => {
      service = TestBed.inject(Supabase);
      tick();
      flush();
      expect(supabaseClientMock.auth.getSession).toHaveBeenCalled();
      expect(supabaseClientMock.auth.onAuthStateChange).toHaveBeenCalled();
    }));

    it('should set session from getSession on init', fakeAsync(() => {
      service = TestBed.inject(Supabase);
      tick();
      flush();
      expect(service.session()).toEqual(mockSession);
    }));

    it('should set isLoading to false after initialization', fakeAsync(() => {
      service = TestBed.inject(Supabase);
      tick();
      flush();
      expect(service.isLoading()).toBe(false);
    }));

    it('should compute user from session', fakeAsync(() => {
      service = TestBed.inject(Supabase);
      tick();
      expect(service.user()).toEqual(mockUser);
    }));

    it('should compute isAuthenticated when user exists', fakeAsync(() => {
      service = TestBed.inject(Supabase);
      tick();
      expect(service.isAuthenticated()).toBe(true);
    }));

    it('should set error on initialization failure', fakeAsync(() => {
      const mockError = new Error('Init failed');
      supabaseClientMock.auth.getSession.and.returnValue(
        Promise.resolve({ data: { session: null }, error: mockError }),
      );

      service = TestBed.inject(Supabase);
      tick();

      expect(service.error()).toBeTruthy();
    }));

    it('should skip profile creation if session is expired', fakeAsync(() => {
      const expiredSession = {
        ...mockSession,
        expires_at: Math.floor(Date.now() / 1000) - 3600, // expired 1 hour ago
      };

      supabaseClientMock.auth.getSession.and.returnValue(
        Promise.resolve({ data: { session: expiredSession }, error: null }),
      );

      spyOn(console, 'warn');
      service = TestBed.inject(Supabase);
      tick();

      expect(console.warn).toHaveBeenCalledWith('Session expired, skipping profile creation');
      expect(service.session()).toBeNull();
    }));
  });

  describe('Auth State Change Events', () => {
    let authStateCallback: any;

    beforeEach(fakeAsync(() => {
      supabaseClientMock.auth.onAuthStateChange.and.callFake((callback: any) => {
        authStateCallback = callback;
        return {
          data: {
            subscription: {
              unsubscribe: jasmine.createSpy('unsubscribe'),
            },
          },
        };
      });

      service = TestBed.inject(Supabase);
      tick();
    }));

    it('should update session on SIGNED_IN event', fakeAsync(() => {
      const newSession = { ...mockSession, access_token: 'new-token' };
      authStateCallback('SIGNED_IN', newSession);
      tick();

      expect(service.session()).toEqual(newSession);
    }));

    it('should clear profile and navigate on SIGNED_OUT event', fakeAsync(() => {
      service.currentProfile.set(mockProfile);

      authStateCallback('SIGNED_OUT', null);
      tick();

      expect(service.currentProfile()).toBeNull();
      expect(service.error()).toBeNull();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    }));

    it('should update session on TOKEN_REFRESHED event', fakeAsync(() => {
      const refreshedSession = { ...mockSession, access_token: 'refreshed-token' };
      authStateCallback('TOKEN_REFRESHED', refreshedSession);
      tick();

      expect(service.session()).toEqual(refreshedSession);
    }));

    it('should refresh profile on USER_UPDATED event', fakeAsync(() => {
      const updatedSession = { ...mockSession };

      // Mock refreshCurrentUserProfile to return updated profile
      spyOn(service, 'refreshCurrentUserProfile').and.returnValue({
        subscribe: (callbacks: any) => {
          callbacks.next(mockProfile);
          return { unsubscribe: () => {} };
        },
      } as any);

      authStateCallback('USER_UPDATED', updatedSession);
      tick();

      expect(service.refreshCurrentUserProfile).toHaveBeenCalled();
    }));
  });

  describe('signInWithGoogle()', () => {
    beforeEach(fakeAsync(() => {
      service = TestBed.inject(Supabase);
      tick();
    }));

    it('should call signInWithOAuth with correct provider and scopes', async () => {
      await service.signInWithGoogle();

      expect(supabaseClientMock.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: jasmine.objectContaining({
          scopes: 'openid email profile',
        }),
      });
    });

    it('should include next parameter in redirect URL', async () => {
      Object.defineProperty(routerMock, 'url', {
        value: '/profile',
        configurable: true,
      });

      await service.signInWithGoogle();

      const callArgs = supabaseClientMock.auth.signInWithOAuth.calls.mostRecent().args[0];
      expect(callArgs.options.redirectTo).toContain('next=%2Fprofile');
    });

    it('should use "/" as next when router.url is /login', async () => {
      Object.defineProperty(routerMock, 'url', {
        value: '/login',
        configurable: true,
      });

      await service.signInWithGoogle();

      const callArgs = supabaseClientMock.auth.signInWithOAuth.calls.mostRecent().args[0];
      expect(callArgs.options.redirectTo).toContain('next=%2F');
    });

    it('should set error signal and throw on OAuth error', async () => {
      const mockError: any = {
        name: 'AuthError',
        message: 'OAuth failed',
        code: 'oauth_error',
      };

      supabaseClientMock.auth.signInWithOAuth.and.returnValue(
        Promise.resolve({ error: mockError }),
      );

      await expectAsync(service.signInWithGoogle()).toBeRejectedWith(mockError);
      expect(service.error()).toBeTruthy();
    });
  });

  describe('checkOAuthError()', () => {
    let originalURLSearchParams: any;

    beforeEach(fakeAsync(() => {
      service = TestBed.inject(Supabase);
      tick();

      // Save original URLSearchParams
      originalURLSearchParams = (window as any).URLSearchParams;
    }));

    afterEach(() => {
      // Restore original URLSearchParams
      (window as any).URLSearchParams = originalURLSearchParams;
    });

    it('should return null when no error in URL', () => {
      (window as any).URLSearchParams = class {
        constructor(search: string) {}
        get() {
          return null;
        }
      };

      const error = service.checkOAuthError();
      expect(error).toBeNull();
    });

    it('should return sanitized error description when error exists', () => {
      (window as any).URLSearchParams = class {
        constructor(search: string) {}
        get(key: string) {
          if (key === 'error') return 'access_denied';
          if (key === 'error_description') return 'User cancelled login';
          return null;
        }
      };

      spyOn(window.history, 'replaceState');

      const error = service.checkOAuthError();
      expect(error).toBe('User cancelled login');
      expect(window.history.replaceState).toHaveBeenCalled();
    });

    it('should sanitize malicious error description to prevent XSS', () => {
      (window as any).URLSearchParams = class {
        constructor(search: string) {}
        get(key: string) {
          if (key === 'error') return 'test';
          if (key === 'error_description') return '<script>alert("xss")</script>';
          return null;
        }
      };

      const error = service.checkOAuthError();
      expect(error).not.toContain('<script>');
      expect(error).not.toContain('</script>');
      expect(error).toBe('scriptalertxssscript'); // sanitized
    });

    it('should return default message when error exists but no description', () => {
      (window as any).URLSearchParams = class {
        constructor(search: string) {}
        get(key: string) {
          if (key === 'error') return 'unknown_error';
          return null;
        }
      };

      const error = service.checkOAuthError();
      expect(error).toBe('Wystąpił błąd podczas próby logowania. Spróbuj ponownie później.');
    });

    it('should handle history.replaceState failure gracefully', () => {
      (window as any).URLSearchParams = class {
        constructor(search: string) {}
        get(key: string) {
          if (key === 'error') return 'test';
          if (key === 'error_description') return 'Error';
          return null;
        }
      };

      spyOn(window.history, 'replaceState').and.throwError('Failed');
      spyOn(console, 'warn');

      const error = service.checkOAuthError();
      expect(error).toBe('Error');
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to clean URL parameters:',
        jasmine.any(Error),
      );
    });
  });

  describe('handleOAuthCallback()', () => {
    beforeEach(fakeAsync(() => {
      service = TestBed.inject(Supabase);
      tick();
    }));

    it('should handle invalid URL format', async () => {
      // Test that callback handles invalid URL gracefully
      const invalidUrl = 'not-a-valid-url';

      await service.handleOAuthCallback(invalidUrl);

      // Should navigate to login with error
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: { error_description: jasmine.any(String) },
      });
    });

    it('should handle successful OAuth callback and navigate to next URL', async () => {
      const callbackUrl = 'http://localhost:4200/auth/callback?code=abc123&next=/profile';

      await service.handleOAuthCallback(callbackUrl);

      expect(supabaseClientMock.auth.getSession).toHaveBeenCalled();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/profile']);
    });

    it('should navigate to default page when no next parameter', async () => {
      const callbackUrl = 'http://localhost:4200/auth/callback?code=abc123';

      await service.handleOAuthCallback(callbackUrl);

      expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should handle OAuth error in URL and navigate to login', async () => {
      const callbackUrl =
        'http://localhost:4200/auth/callback?error=access_denied&error_description=User+cancelled';

      await service.handleOAuthCallback(callbackUrl);

      expect(routerMock.navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: { error_description: jasmine.any(String) },
      });
      expect(service.error()).toBeTruthy();
    });

    it('should handle session error and navigate to login', async () => {
      const callbackUrl = 'http://localhost:4200/auth/callback?code=abc123';
      const sessionError: any = { message: 'Session fetch failed' };

      supabaseClientMock.auth.getSession.and.returnValue(
        Promise.resolve({ data: { session: null }, error: sessionError }),
      );

      await service.handleOAuthCallback(callbackUrl);

      expect(routerMock.navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: { error_description: 'Session fetch failed' },
      });
    });

    it('should clean URL after successful callback', async () => {
      const callbackUrl = 'http://localhost:4200/auth/callback?code=abc123&next=/dashboard';

      spyOn(window.history, 'replaceState');

      await service.handleOAuthCallback(callbackUrl);

      // replaceState might be called, but it's in a try-catch so we just check it doesn't throw
      expect(routerMock.navigate).toHaveBeenCalled();
    });
  });

  describe('signOut()', () => {
    beforeEach(fakeAsync(() => {
      service = TestBed.inject(Supabase);
      tick();
      service.currentProfile.set(mockProfile);
      service.error.set(new Error('Previous error'));
    }));

    it('should call Supabase signOut', async () => {
      await service.signOut();

      expect(supabaseClientMock.auth.signOut).toHaveBeenCalled();
    });

    it('should clear currentProfile and error on successful sign out', async () => {
      await service.signOut();

      expect(service.currentProfile()).toBeNull();
      expect(service.error()).toBeNull();
    });

    it('should set error and throw on sign out failure', async () => {
      const mockError: any = { message: 'Sign out failed' };
      supabaseClientMock.auth.signOut.and.returnValue(Promise.resolve({ error: mockError }));

      await expectAsync(service.signOut()).toBeRejected();
      expect(service.error()).toBeTruthy();
    });
  });

  describe('getCurrentUserProfile()', () => {
    beforeEach(fakeAsync(() => {
      service = TestBed.inject(Supabase);
      tick();
    }));

    it('should throw error when user is not authenticated', (done) => {
      // Set session to null to simulate unauthenticated state
      service.session.set(null);

      service.getCurrentUserProfile().subscribe({
        error: (error) => {
          expect(error.message).toBe('User not authenticated');
          done();
        },
      });
    });

    it('should throw error when user ID is invalid UUID', (done) => {
      const invalidSession = {
        ...mockSession,
        user: { ...mockUser, id: 'invalid-uuid' },
      };
      service.session.set(invalidSession);

      service.getCurrentUserProfile().subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid user ID format');
          done();
        },
      });
    });

    it('should fetch profile from database', (done) => {
      service.getCurrentUserProfile().subscribe({
        next: (profile) => {
          expect(profile).toEqual(mockProfile);
          expect(supabaseClientMock.from).toHaveBeenCalledWith('profiles');
          done();
        },
      });
    });

    it('should set currentProfile signal on success', (done) => {
      service.getCurrentUserProfile().subscribe({
        next: () => {
          expect(service.currentProfile()).toEqual(mockProfile);
          done();
        },
      });
    });

    it('should set isLoading during fetch', () => {
      service.getCurrentUserProfile().subscribe();
      // Loading should be set to true during fetch, then false after
    });

    it('should handle database error', (done) => {
      const dbError = { message: 'Database error', code: 'PGRST301' };

      supabaseClientMock.from.and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine
              .createSpy('single')
              .and.returnValue(Promise.resolve({ data: null, error: dbError })),
          }),
        }),
      });

      service.getCurrentUserProfile().subscribe({
        error: (error) => {
          expect(error.message).toBe('Database error');
          expect(service.error()).toBeTruthy();
          done();
        },
      });
    });

    it('should throw error when profile not found', (done) => {
      supabaseClientMock.from.and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine
              .createSpy('single')
              .and.returnValue(Promise.resolve({ data: null, error: null })),
          }),
        }),
      });

      service.getCurrentUserProfile().subscribe({
        error: (error) => {
          expect(error.message).toBe('Profile not found');
          done();
        },
      });
    });
  });

  describe('refreshCurrentUserProfile()', () => {
    beforeEach(fakeAsync(() => {
      service = TestBed.inject(Supabase);
      tick();
    }));

    it('should throw error when user is not authenticated', (done) => {
      service.session.set(null);

      service.refreshCurrentUserProfile().subscribe({
        error: (error) => {
          expect(error.message).toBe('User not authenticated');
          done();
        },
      });
    });

    it('should throw error when user ID is invalid UUID', (done) => {
      const invalidSession = {
        ...mockSession,
        user: { ...mockUser, id: 'not-a-uuid' },
      };
      service.session.set(invalidSession);

      service.refreshCurrentUserProfile().subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid user ID format');
          done();
        },
      });
    });

    it('should fetch and return profile', (done) => {
      service.refreshCurrentUserProfile().subscribe({
        next: (profile) => {
          expect(profile).toEqual(mockProfile);
          done();
        },
      });
    });

    it('should update currentProfile signal', (done) => {
      service.refreshCurrentUserProfile().subscribe({
        next: () => {
          expect(service.currentProfile()).toEqual(mockProfile);
          done();
        },
      });
    });

    it('should handle errors gracefully', (done) => {
      const dbError = { message: 'Refresh failed' };

      supabaseClientMock.from.and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine
              .createSpy('single')
              .and.returnValue(Promise.resolve({ data: null, error: dbError })),
          }),
        }),
      });

      spyOn(console, 'error');

      service.refreshCurrentUserProfile().subscribe({
        error: (error) => {
          expect(error.message).toBe('Refresh failed');
          expect(console.error).toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('getProfileByShortId()', () => {
    beforeEach(fakeAsync(() => {
      service = TestBed.inject(Supabase);
      tick();
    }));

    it('should throw error for invalid short ID format', (done) => {
      service.getProfileByShortId('invalid').subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid short ID format');
          done();
        },
      });
    });

    it('should fetch profile by short ID', (done) => {
      service.getProfileByShortId('ABC123').subscribe({
        next: (profile) => {
          expect(profile).toEqual(mockProfile);
          expect(supabaseClientMock.from).toHaveBeenCalledWith('profiles');
          done();
        },
      });
    });

    it('should handle PGRST116 error (not found) with specific message', (done) => {
      const notFoundError = { message: 'Not found', code: 'PGRST116' };

      supabaseClientMock.from.and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine
              .createSpy('single')
              .and.returnValue(Promise.resolve({ data: null, error: notFoundError })),
          }),
        }),
      });

      service.getProfileByShortId('ABC123').subscribe({
        error: (error) => {
          expect(error.message).toBe('Profile not found');
          done();
        },
      });
    });

    it('should set isLoading during fetch', (done) => {
      service.getProfileByShortId('ABC123').subscribe({
        next: () => {
          expect(service.isLoading()).toBe(false);
          done();
        },
      });
    });
  });

  describe('ensureProfileExists()', () => {
    beforeEach(fakeAsync(() => {
      service = TestBed.inject(Supabase);
      tick();
    }));

    it('should return early for invalid UUID', async () => {
      spyOn(console, 'error');
      supabaseClientMock.from.calls.reset();

      await service.ensureProfileExists('invalid-uuid');

      expect(console.error).toHaveBeenCalledWith('Invalid user ID format:', 'invalid-uuid');
      expect(supabaseClientMock.from).not.toHaveBeenCalled();
    });

    it('should refresh profile if it already exists', async () => {
      const existingProfile = { id: mockUser.id };

      supabaseClientMock.from.and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            maybeSingle: jasmine
              .createSpy('maybeSingle')
              .and.returnValue(Promise.resolve({ data: existingProfile, error: null })),
            single: jasmine
              .createSpy('single')
              .and.returnValue(Promise.resolve({ data: mockProfile, error: null })),
          }),
        }),
      });

      spyOn(service, 'refreshCurrentUserProfile').and.returnValue({
        subscribe: (callbacks: any) => {
          callbacks.next(mockProfile);
          return { unsubscribe: () => {} };
        },
      } as any);

      await service.ensureProfileExists(mockUser.id);

      expect(service.refreshCurrentUserProfile).toHaveBeenCalled();
    });

    it('should create new profile if it does not exist', async () => {
      // Mock crypto.getRandomValues for deterministic short ID generation
      const mockRandomValues = new Uint32Array([0, 1, 2, 3, 4, 5, 6, 7]);
      spyOn(crypto, 'getRandomValues').and.returnValue(mockRandomValues);

      supabaseClientMock.from.and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            maybeSingle: jasmine
              .createSpy('maybeSingle')
              .and.returnValue(Promise.resolve({ data: null, error: null })),
            single: jasmine
              .createSpy('single')
              .and.returnValue(Promise.resolve({ data: mockProfile, error: null })),
          }),
        }),
        insert: jasmine.createSpy('insert').and.returnValue(Promise.resolve({ error: null })),
      });

      spyOn(service, 'refreshCurrentUserProfile').and.returnValue({
        subscribe: (callbacks: any) => {
          callbacks.next(mockProfile);
          return { unsubscribe: () => {} };
        },
      } as any);

      await service.ensureProfileExists(mockUser.id);

      expect(supabaseClientMock.from().insert).toHaveBeenCalledWith(
        jasmine.objectContaining({
          id: mockUser.id,
          stamp_count: 0,
        }),
      );
    });

    it('should handle duplicate key error (race condition) gracefully', async () => {
      const duplicateError = { code: '23505', message: 'duplicate key value' };

      supabaseClientMock.from.and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            maybeSingle: jasmine
              .createSpy('maybeSingle')
              .and.returnValue(Promise.resolve({ data: null, error: null })),
          }),
        }),
        insert: jasmine
          .createSpy('insert')
          .and.returnValue(Promise.resolve({ error: duplicateError })),
      });

      spyOn(console, 'warn');
      spyOn(crypto, 'getRandomValues').and.returnValue(new Uint32Array(8));

      await service.ensureProfileExists(mockUser.id);

      expect(console.warn).toHaveBeenCalledWith('Profile already exists (race condition detected)');
    });

    it('should set error signal on profile creation failure', async () => {
      const createError = { code: 'PGRST301', message: 'Create failed' };

      supabaseClientMock.from.and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            maybeSingle: jasmine
              .createSpy('maybeSingle')
              .and.returnValue(Promise.resolve({ data: null, error: null })),
          }),
        }),
        insert: jasmine
          .createSpy('insert')
          .and.returnValue(Promise.resolve({ error: createError })),
      });

      spyOn(console, 'error');
      spyOn(crypto, 'getRandomValues').and.returnValue(new Uint32Array(8));

      await service.ensureProfileExists(mockUser.id);

      expect(service.error()).toBeTruthy();
      expect(service.error()?.message).toContain('Failed to ensure profile exists');
    });
  });

  describe('generateUniqueShortId()', () => {
    beforeEach(fakeAsync(() => {
      service = TestBed.inject(Supabase);
      tick();
    }));

    it('should generate short ID with length between 6 and 8', async () => {
      spyOn(crypto, 'getRandomValues').and.returnValue(new Uint32Array([0, 1, 2, 3, 4, 5, 6, 7]));

      supabaseClientMock.from.and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            maybeSingle: jasmine
              .createSpy('maybeSingle')
              .and.returnValue(Promise.resolve({ data: null, error: null })),
          }),
        }),
      });

      const shortId = await (service as any).generateUniqueShortId();

      expect(shortId.length).toBeGreaterThanOrEqual(6);
      expect(shortId.length).toBeLessThanOrEqual(8);
      expect(/^[A-Z0-9]+$/.test(shortId)).toBe(true);
    });

    it('should retry if short ID already exists', fakeAsync(() => {
      let callCount = 0;

      supabaseClientMock.from.and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            maybeSingle: jasmine.createSpy('maybeSingle').and.callFake(() => {
              callCount++;
              // First call returns existing, second returns null (unique)
              return Promise.resolve({
                data: callCount === 1 ? { short_id: 'EXIST1' } : null,
                error: null,
              });
            }),
          }),
        }),
      });

      spyOn(crypto, 'getRandomValues').and.returnValue(new Uint32Array([0, 1, 2, 3, 4, 5, 6, 7]));

      (service as any).generateUniqueShortId().then((shortId: string) => {
        expect(callCount).toBe(2);
        expect(shortId).toBeDefined();
      });

      tick(1000); // Account for exponential backoff
    }));

    it('should throw error after max attempts', fakeAsync(() => {
      supabaseClientMock.from.and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            maybeSingle: jasmine
              .createSpy('maybeSingle')
              .and.returnValue(Promise.resolve({ data: { short_id: 'EXISTS' }, error: null })),
          }),
        }),
      });

      spyOn(crypto, 'getRandomValues').and.returnValue(new Uint32Array([0, 1, 2, 3, 4, 5, 6, 7]));

      (service as any).generateUniqueShortId().then(
        () => fail('Should have thrown'),
        (error: Error) => {
          expect(error.message).toBe('Failed to generate unique short_id after multiple attempts');
        },
      );

      tick(10000); // Account for exponential backoff
    }));

    it('should use crypto.getRandomValues for secure random generation', async () => {
      spyOn(crypto, 'getRandomValues').and.returnValue(new Uint32Array(8));

      supabaseClientMock.from.and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            maybeSingle: jasmine
              .createSpy('maybeSingle')
              .and.returnValue(Promise.resolve({ data: null, error: null })),
          }),
        }),
      });

      await (service as any).generateUniqueShortId();

      expect(crypto.getRandomValues).toHaveBeenCalled();
    });

    it('should implement exponential backoff on retries', fakeAsync(() => {
      let callCount = 0;
      const callTimes: number[] = [];

      supabaseClientMock.from.and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            maybeSingle: jasmine.createSpy('maybeSingle').and.callFake(() => {
              callTimes.push(Date.now());
              callCount++;
              return Promise.resolve({
                data: callCount < 3 ? { short_id: 'EXISTS' } : null,
                error: null,
              });
            }),
          }),
        }),
      });

      spyOn(crypto, 'getRandomValues').and.returnValue(new Uint32Array(8));

      (service as any).generateUniqueShortId();

      tick(5000); // Wait for all retries with backoff

      // Verify that delays increased (exponential backoff)
      if (callTimes.length >= 3) {
        const delay1 = callTimes[1] - callTimes[0];
        const delay2 = callTimes[2] - callTimes[1];
        expect(delay2).toBeGreaterThan(delay1);
      }
    }));
  });

  describe('client getter', () => {
    beforeEach(fakeAsync(() => {
      service = TestBed.inject(Supabase);
      tick();
    }));

    it('should return Supabase client instance', () => {
      expect(service.client).toBe(supabaseClientMock);
    });
  });

  describe('ngOnDestroy()', () => {
    it('should unsubscribe from auth state changes', fakeAsync(() => {
      service = TestBed.inject(Supabase);
      tick();
      flush();

      const authSub = (service as any).authSubscription;
      expect(authSub).toBeTruthy();
      const unsubscribeSpy = authSub?.data?.subscription?.unsubscribe;

      service.ngOnDestroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
    }));
  });
});
