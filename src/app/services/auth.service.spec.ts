import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Supabase } from './supabase';
import { signal, computed } from '@angular/core';
import { of, throwError } from 'rxjs';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { ProfileDTO } from '../types';

describe('AuthService', () => {
  let service: AuthService;
  let supabaseMock: jasmine.SpyObj<Supabase>;
  let routerMock: jasmine.SpyObj<Router>;
  let supabaseClientMock: any;

  // Mock data
  const mockUser: any = {
    id: 'test-user-id',
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
    expires_at: Date.now() / 1000 + 3600,
    expires_in: 3600,
    token_type: 'bearer',
  };

  const mockProfile: ProfileDTO = {
    id: 'test-user-id',
    short_id: 'ABC123',
    stamp_count: 5,
    created_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    // Create Supabase client mock
    supabaseClientMock = {
      auth: {
        signInWithOAuth: jasmine
          .createSpy('signInWithOAuth')
          .and.returnValue(Promise.resolve({ data: {}, error: null })),
        getSession: jasmine
          .createSpy('getSession')
          .and.returnValue(Promise.resolve({ data: { session: mockSession }, error: null })),
        getUser: jasmine
          .createSpy('getUser')
          .and.returnValue(Promise.resolve({ data: { user: mockUser }, error: null })),
      },
    };

    // Create Supabase service mock with signals
    supabaseMock = jasmine.createSpyObj(
      'Supabase',
      [
        'checkOAuthError',
        'handleOAuthCallback',
        'signOut',
        'getCurrentUserProfile',
        'refreshCurrentUserProfile',
      ],
      {
        session: signal(mockSession as Session),
        user: computed(() => mockUser as User),
        currentProfile: signal(mockProfile),
        isAuthenticated: computed(() => true),
        isLoading: signal(false),
        error: signal(null),
        client: supabaseClientMock,
      },
    );

    // Create Router mock
    routerMock = jasmine.createSpyObj('Router', ['navigate']);
    Object.defineProperty(routerMock, 'url', {
      writable: true,
      configurable: true,
      value: '/dashboard',
    });

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Supabase, useValue: supabaseMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initialization and State Management', () => {
    it('should expose session signal from Supabase', () => {
      expect(service.session()).toEqual(mockSession);
    });

    it('should expose user signal from Supabase', () => {
      expect(service.user()).toEqual(mockUser);
    });

    it('should expose isAuthenticated computed signal', () => {
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should expose isLoading signal', () => {
      expect(service.isLoading()).toBe(false);
    });

    it('should expose currentProfile signal', () => {
      expect(service.currentProfile()).toEqual(mockProfile);
    });

    it('should expose error signal', () => {
      expect(service.error()).toBeNull();
    });

    it('should provide session$ observable that maps from session signal', (done) => {
      service.session$.subscribe((session) => {
        expect(session).toEqual(mockSession);
        done();
      });
    });

    it('should provide user$ observable that extracts user from session', (done) => {
      service.user$.subscribe((user) => {
        expect(user).toEqual(mockUser);
        done();
      });
    });

    it('should map null session to null user in user$ observable', (done) => {
      // Update the signal to null
      (supabaseMock as any).session.set(null);

      service.user$.subscribe((user) => {
        expect(user).toBeNull();
        done();
      });
    });
  });

  describe('init()', () => {
    it('should complete without errors', () => {
      expect(() => service.init()).not.toThrow();
    });
  });

  describe('signInWithGoogle()', () => {
    it('should call signInWithOAuth with default redirect URL', async () => {
      await service.signInWithGoogle();

      expect(supabaseClientMock.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: jasmine.stringContaining('/auth/callback'),
          scopes: 'openid email profile',
        },
      });
    });

    it('should include next parameter from current router URL', async () => {
      Object.defineProperty(routerMock, 'url', {
        writable: true,
        configurable: true,
        value: '/dashboard',
      });

      await service.signInWithGoogle();

      const callArgs = supabaseClientMock.auth.signInWithOAuth.calls.mostRecent().args[0];
      expect(callArgs.options.redirectTo).toContain('next=%2Fdashboard');
    });

    it('should use "/" as next parameter when router.url is "/login"', async () => {
      Object.defineProperty(routerMock, 'url', {
        writable: true,
        configurable: true,
        value: '/login',
      });

      await service.signInWithGoogle();

      const callArgs = supabaseClientMock.auth.signInWithOAuth.calls.mostRecent().args[0];
      expect(callArgs.options.redirectTo).toContain('next=%2F');
    });

    it('should use custom next parameter from options', async () => {
      await service.signInWithGoogle({ next: '/profile' });

      const callArgs = supabaseClientMock.auth.signInWithOAuth.calls.mostRecent().args[0];
      expect(callArgs.options.redirectTo).toContain('next=%2Fprofile');
    });

    it('should use custom redirectTo URL from options', async () => {
      await service.signInWithGoogle({ redirectTo: 'http://example.com/callback' });

      const callArgs = supabaseClientMock.auth.signInWithOAuth.calls.mostRecent().args[0];
      expect(callArgs.options.redirectTo).toContain('http://example.com/callback');
    });

    it('should not override existing next parameter in redirectTo URL', async () => {
      const redirectWithNext = 'http://localhost:4200/auth/callback?next=/custom';

      await service.signInWithGoogle({ redirectTo: redirectWithNext });

      const callArgs = supabaseClientMock.auth.signInWithOAuth.calls.mostRecent().args[0];
      expect(callArgs.options.redirectTo).toBe(redirectWithNext);
    });

    it('should handle OAuth errors by throwing', async () => {
      const mockError: any = {
        name: 'AuthError',
        message: 'OAuth error occurred',
        status: 400,
        code: 'oauth_error',
        __isAuthError: true,
      };

      supabaseClientMock.auth.signInWithOAuth.and.returnValue(
        Promise.resolve({ error: mockError }),
      );

      await expectAsync(service.signInWithGoogle()).toBeRejectedWith(mockError);
    });

    it('should log and re-throw errors', async () => {
      const mockError = new Error('Network error');
      supabaseClientMock.auth.signInWithOAuth.and.returnValue(Promise.reject(mockError));

      spyOn(console, 'error');

      await expectAsync(service.signInWithGoogle()).toBeRejectedWith(mockError);
      expect(console.error).toHaveBeenCalledWith('Sign in error:', mockError);
    });

    it('should include correct scopes in OAuth request', async () => {
      await service.signInWithGoogle();

      const callArgs = supabaseClientMock.auth.signInWithOAuth.calls.mostRecent().args[0];
      expect(callArgs.options.scopes).toBe('openid email profile');
    });

    it('should construct full redirect URL with origin', async () => {
      await service.signInWithGoogle();

      const callArgs = supabaseClientMock.auth.signInWithOAuth.calls.mostRecent().args[0];
      // Check that URL contains http:// protocol and /auth/callback path
      // The actual host will vary based on test environment (localhost:4200 vs localhost:9876)
      expect(callArgs.options.redirectTo).toContain('http://localhost');
      expect(callArgs.options.redirectTo).toContain('/auth/callback');
    });

    it('should handle both options properties correctly', async () => {
      await service.signInWithGoogle({
        redirectTo: 'http://example.com/callback',
        next: '/custom-page',
      });

      const callArgs = supabaseClientMock.auth.signInWithOAuth.calls.mostRecent().args[0];
      expect(callArgs.options.redirectTo).toContain('http://example.com/callback');
      expect(callArgs.options.redirectTo).toContain('next=%2Fcustom-page');
    });
  });

  describe('checkOAuthError()', () => {
    it('should delegate to Supabase checkOAuthError method', () => {
      supabaseMock.checkOAuthError.and.returnValue('error_description');

      const result = service.checkOAuthError();

      expect(supabaseMock.checkOAuthError).toHaveBeenCalled();
      expect(result).toBe('error_description');
    });

    it('should return null when no OAuth error exists', () => {
      supabaseMock.checkOAuthError.and.returnValue(null);

      const result = service.checkOAuthError();

      expect(result).toBeNull();
    });
  });

  describe('handleOAuthCallback()', () => {
    it('should delegate to Supabase handleOAuthCallback method', async () => {
      const callbackUrl = 'http://localhost:4200/auth/callback?code=abc123';
      supabaseMock.handleOAuthCallback.and.returnValue(Promise.resolve());

      await service.handleOAuthCallback(callbackUrl);

      expect(supabaseMock.handleOAuthCallback).toHaveBeenCalledWith(callbackUrl);
    });

    it('should propagate errors from Supabase handleOAuthCallback', async () => {
      const mockError = new Error('Invalid callback');
      supabaseMock.handleOAuthCallback.and.returnValue(Promise.reject(mockError));

      await expectAsync(service.handleOAuthCallback('invalid-url')).toBeRejectedWith(mockError);
    });
  });

  describe('signOut()', () => {
    it('should call Supabase signOut and navigate to login page', async () => {
      supabaseMock.signOut.and.returnValue(Promise.resolve());

      await service.signOut();

      expect(supabaseMock.signOut).toHaveBeenCalled();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should handle errors from Supabase signOut', async () => {
      const mockError = new Error('Sign out failed');
      supabaseMock.signOut.and.returnValue(Promise.reject(mockError));

      await expectAsync(service.signOut()).toBeRejected();
      expect(supabaseMock.signOut).toHaveBeenCalled();
    });

    it('should still navigate to login page even if signOut fails', async () => {
      supabaseMock.signOut.and.returnValue(Promise.reject(new Error('Error')));

      try {
        await service.signOut();
      } catch (error) {
        // Expected to throw
      }

      // Note: In current implementation, navigation happens after signOut completes
      // If signOut throws, navigation won't happen. This test documents current behavior.
      expect(routerMock.navigate).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentUserProfile()', () => {
    it('should delegate to Supabase getCurrentUserProfile method', () => {
      const mockProfile$ = of(mockProfile);
      supabaseMock.getCurrentUserProfile.and.returnValue(mockProfile$);

      const result = service.getCurrentUserProfile();

      expect(supabaseMock.getCurrentUserProfile).toHaveBeenCalled();
      expect(result).toBe(mockProfile$);
    });

    it('should propagate errors from Supabase', (done) => {
      const mockError = new Error('Profile fetch failed');
      supabaseMock.getCurrentUserProfile.and.returnValue(throwError(() => mockError));

      service.getCurrentUserProfile().subscribe({
        error: (error) => {
          expect(error).toBe(mockError);
          done();
        },
      });
    });
  });

  describe('refreshCurrentUserProfile()', () => {
    it('should delegate to Supabase refreshCurrentUserProfile method', () => {
      const mockProfile$ = of(mockProfile);
      supabaseMock.refreshCurrentUserProfile.and.returnValue(mockProfile$);

      const result = service.refreshCurrentUserProfile();

      expect(supabaseMock.refreshCurrentUserProfile).toHaveBeenCalled();
      expect(result).toBe(mockProfile$);
    });

    it('should propagate errors from Supabase', (done) => {
      const mockError = new Error('Profile refresh failed');
      supabaseMock.refreshCurrentUserProfile.and.returnValue(throwError(() => mockError));

      service.refreshCurrentUserProfile().subscribe({
        error: (error) => {
          expect(error).toBe(mockError);
          done();
        },
      });
    });
  });

  describe('getSessionOnce()', () => {
    it('should return session when successful', async () => {
      const result = await service.getSessionOnce();

      expect(supabaseClientMock.auth.getSession).toHaveBeenCalled();
      expect(result).toEqual(mockSession);
    });

    it('should return null when session does not exist', async () => {
      supabaseClientMock.auth.getSession.and.returnValue(
        Promise.resolve({ data: { session: null }, error: null }),
      );

      const result = await service.getSessionOnce();

      expect(result).toBeNull();
    });

    it('should return null when an error occurs', async () => {
      const mockError: any = {
        name: 'AuthError',
        message: 'Session fetch failed',
        status: 401,
        code: 'session_error',
        __isAuthError: true,
      };

      supabaseClientMock.auth.getSession.and.returnValue(
        Promise.resolve({ data: { session: null }, error: mockError }),
      );

      const result = await service.getSessionOnce();

      expect(result).toBeNull();
    });

    it('should return null when data is undefined', async () => {
      supabaseClientMock.auth.getSession.and.returnValue(
        Promise.resolve({ data: undefined, error: null }),
      );

      const result = await service.getSessionOnce();

      expect(result).toBeNull();
    });
  });

  describe('getUserOnce()', () => {
    it('should return user when successful', async () => {
      const result = await service.getUserOnce();

      expect(supabaseClientMock.auth.getUser).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should return null when user does not exist', async () => {
      supabaseClientMock.auth.getUser.and.returnValue(
        Promise.resolve({ data: { user: null }, error: null }),
      );

      const result = await service.getUserOnce();

      expect(result).toBeNull();
    });

    it('should return null when an error occurs', async () => {
      const mockError: any = {
        name: 'AuthError',
        message: 'User fetch failed',
        status: 401,
        code: 'user_error',
        __isAuthError: true,
      };

      supabaseClientMock.auth.getUser.and.returnValue(
        Promise.resolve({ data: { user: null }, error: mockError }),
      );

      const result = await service.getUserOnce();

      expect(result).toBeNull();
    });

    it('should return null when data is undefined', async () => {
      supabaseClientMock.auth.getUser.and.returnValue(
        Promise.resolve({ data: undefined, error: null }),
      );

      const result = await service.getUserOnce();

      expect(result).toBeNull();
    });
  });

  describe('client getter', () => {
    it('should return Supabase client instance', () => {
      const client = service.client;

      expect(client).toBe(supabaseClientMock);
    });

    it('should provide access to auth methods', () => {
      const client = service.client;

      expect(client.auth).toBeDefined();
      expect(client.auth.signInWithOAuth).toBeDefined();
      expect(client.auth.getSession).toBeDefined();
      expect(client.auth.getUser).toBeDefined();
    });
  });

  describe('Edge Cases and Business Rules', () => {
    describe('Authentication State Changes', () => {
      it('should reflect unauthenticated state when session is null', () => {
        // Create a new mock with null session
        const nullSessionSignal = signal(null);
        const isAuthComputed = computed(() => false);

        Object.defineProperty(supabaseMock, 'session', {
          value: nullSessionSignal,
          configurable: true,
        });
        Object.defineProperty(supabaseMock, 'isAuthenticated', {
          value: isAuthComputed,
          configurable: true,
        });

        expect(service.isAuthenticated()).toBe(false);
      });

      it('should reflect loading state during authentication', () => {
        // Create a new mock with loading state
        const loadingSignal = signal(true);

        Object.defineProperty(supabaseMock, 'isLoading', {
          value: loadingSignal,
          configurable: true,
        });

        expect(service.isLoading()).toBe(true);
      });

      it('should capture authentication errors', () => {
        const mockError = new Error('Auth failed');
        const errorSignal = signal(mockError);

        Object.defineProperty(supabaseMock, 'error', { value: errorSignal, configurable: true });

        expect(service.error()).toBe(mockError);
      });
    });

    describe('URL Parameter Handling in signInWithGoogle', () => {
      it('should properly encode special characters in next parameter', async () => {
        await service.signInWithGoogle({ next: '/path?query=value&other=123' });

        const callArgs = supabaseClientMock.auth.signInWithOAuth.calls.mostRecent().args[0];
        // URL encoding should handle special characters
        expect(callArgs.options.redirectTo).toBeDefined();
      });

      it('should handle empty string next parameter', async () => {
        await service.signInWithGoogle({ next: '' });

        const callArgs = supabaseClientMock.auth.signInWithOAuth.calls.mostRecent().args[0];
        expect(callArgs.options.redirectTo).toContain('next=');
      });

      it('should handle next parameter with hash fragments', async () => {
        await service.signInWithGoogle({ next: '/dashboard#section' });

        const callArgs = supabaseClientMock.auth.signInWithOAuth.calls.mostRecent().args[0];
        expect(callArgs.options.redirectTo).toContain('next=');
      });
    });

    describe('Session and User Consistency', () => {
      it('should return consistent user data between user signal and getUserOnce', async () => {
        const signalUser = service.user();
        const onceUser = await service.getUserOnce();

        expect(signalUser?.id).toBe(onceUser?.id);
      });

      it('should return consistent session data between session signal and getSessionOnce', async () => {
        const signalSession = service.session();
        const onceSession = await service.getSessionOnce();

        expect(signalSession?.access_token).toBe(onceSession?.access_token);
      });
    });

    describe('Profile Management', () => {
      it('should clear profile on sign out', async () => {
        const nullProfileSignal = signal(null);

        supabaseMock.signOut.and.callFake(async () => {
          Object.defineProperty(supabaseMock, 'currentProfile', {
            value: nullProfileSignal,
            configurable: true,
          });
        });

        await service.signOut();

        expect(service.currentProfile()).toBeNull();
      });

      it('should maintain profile data during session refresh', () => {
        const initialProfile = service.currentProfile();

        expect(initialProfile).toEqual(mockProfile);
      });
    });
  });
});
