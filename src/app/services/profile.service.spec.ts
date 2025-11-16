import { TestBed } from '@angular/core/testing';
import { ProfileService, IUserProfile } from './profile.service';
import { AuthService } from './auth.service';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ProfileDTO } from '../types';

describe('ProfileService', () => {
  let service: ProfileService;
  let authServiceMock: jasmine.SpyObj<AuthService>;

  // Mock data
  const mockUser: any = {
    id: 'test-user-id',
    email: 'test@example.com',
    aud: 'authenticated',
    role: 'authenticated',
    created_at: '2024-01-01T00:00:00Z',
  };

  const mockProfile: ProfileDTO = {
    id: 'test-user-id',
    short_id: 'ABC123',
    stamp_count: 5,
    created_at: '2024-01-01T00:00:00Z',
  };

  const expectedUserProfile: IUserProfile = {
    id: 'test-user-id',
    email: 'test@example.com',
    short_id: 'ABC123',
    created_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    // Create AuthService mock
    authServiceMock = jasmine.createSpyObj(
      'AuthService',
      ['getCurrentUserProfile', 'refreshCurrentUserProfile'],
      {
        user: signal(mockUser),
        currentProfile: signal(mockProfile),
      },
    );

    TestBed.configureTestingModule({
      providers: [ProfileService, { provide: AuthService, useValue: authServiceMock }],
    });

    service = TestBed.inject(ProfileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getMyProfile()', () => {
    describe('User Not Authenticated', () => {
      it('should return null when user is not authenticated', async () => {
        // Set user signal to null
        Object.defineProperty(authServiceMock, 'user', {
          value: signal(null),
          configurable: true,
        });

        const result = await service.getMyProfile();

        expect(result).toBeNull();
        expect(authServiceMock.getCurrentUserProfile).not.toHaveBeenCalled();
      });
    });

    describe('Cached Profile Available', () => {
      it('should return cached profile when available', async () => {
        const result = await service.getMyProfile();

        expect(result).toEqual(expectedUserProfile);
        expect(authServiceMock.getCurrentUserProfile).not.toHaveBeenCalled();
      });

      it('should map cached profile data correctly to IUserProfile', async () => {
        const result = await service.getMyProfile();

        expect(result).toBeDefined();
        expect(result!.id).toBe(mockProfile.id);
        expect(result!.email).toBe(mockUser.email);
        expect(result!.short_id).toBe(mockProfile.short_id);
        expect(result!.created_at).toBe(mockProfile.created_at);
      });

      it('should use empty string for email when user.email is null', async () => {
        const userWithoutEmail = { ...mockUser, email: null };
        Object.defineProperty(authServiceMock, 'user', {
          value: signal(userWithoutEmail),
          configurable: true,
        });

        const result = await service.getMyProfile();

        expect(result!.email).toBe('');
      });

      it('should use empty string for email when user.email is undefined', async () => {
        const userWithoutEmail = { ...mockUser, email: undefined };
        Object.defineProperty(authServiceMock, 'user', {
          value: signal(userWithoutEmail),
          configurable: true,
        });

        const result = await service.getMyProfile();

        expect(result!.email).toBe('');
      });
    });

    describe('No Cached Profile - Fetch from AuthService', () => {
      beforeEach(() => {
        // Set currentProfile signal to null to simulate no cache
        Object.defineProperty(authServiceMock, 'currentProfile', {
          value: signal(null),
          configurable: true,
        });
      });

      it('should fetch profile from AuthService when cache is empty', async () => {
        authServiceMock.getCurrentUserProfile.and.returnValue(of(mockProfile));

        const result = await service.getMyProfile();

        expect(authServiceMock.getCurrentUserProfile).toHaveBeenCalled();
        expect(result).toEqual(expectedUserProfile);
      });

      it('should map fetched profile data correctly to IUserProfile', async () => {
        authServiceMock.getCurrentUserProfile.and.returnValue(of(mockProfile));

        const result = await service.getMyProfile();

        expect(result).toBeDefined();
        expect(result!.id).toBe(mockProfile.id);
        expect(result!.email).toBe(mockUser.email);
        expect(result!.short_id).toBe(mockProfile.short_id);
        expect(result!.created_at).toBe(mockProfile.created_at);
      });

      it('should handle profile fetch errors by propagating them', async () => {
        const mockError = new Error('Failed to fetch profile');
        authServiceMock.getCurrentUserProfile.and.returnValue(throwError(() => mockError));

        await expectAsync(service.getMyProfile()).toBeRejectedWith(mockError);
      });

      it('should use empty string for email when fetched profile has no email', async () => {
        const userWithoutEmail = { ...mockUser, email: null };
        Object.defineProperty(authServiceMock, 'user', {
          value: signal(userWithoutEmail),
          configurable: true,
        });

        authServiceMock.getCurrentUserProfile.and.returnValue(of(mockProfile));

        const result = await service.getMyProfile();

        expect(result!.email).toBe('');
      });
    });

    describe('Profile Data Mapping', () => {
      it('should preserve all profile fields during mapping', async () => {
        const customProfile: ProfileDTO = {
          id: 'custom-id',
          short_id: 'XYZ789',
          stamp_count: 10,
          created_at: '2024-06-15T12:00:00Z',
        };

        Object.defineProperty(authServiceMock, 'currentProfile', {
          value: signal(customProfile),
          configurable: true,
        });

        const result = await service.getMyProfile();

        expect(result!.id).toBe('custom-id');
        expect(result!.short_id).toBe('XYZ789');
        expect(result!.created_at).toBe('2024-06-15T12:00:00Z');
      });

      it('should handle profile with all valid data types', async () => {
        const result = await service.getMyProfile();

        expect(typeof result!.id).toBe('string');
        expect(typeof result!.email).toBe('string');
        expect(typeof result!.short_id).toBe('string');
        expect(typeof result!.created_at).toBe('string');
      });
    });
  });

  describe('ensureMyProfile()', () => {
    describe('User Not Authenticated', () => {
      it('should throw error when user is not authenticated', async () => {
        Object.defineProperty(authServiceMock, 'user', {
          value: signal(null),
          configurable: true,
        });

        await expectAsync(service.ensureMyProfile()).toBeRejectedWithError(
          'User not authenticated',
        );
        expect(authServiceMock.refreshCurrentUserProfile).not.toHaveBeenCalled();
      });

      it('should throw error with correct message when user is undefined', async () => {
        Object.defineProperty(authServiceMock, 'user', {
          value: signal(undefined),
          configurable: true,
        });

        await expectAsync(service.ensureMyProfile()).toBeRejectedWithError(
          'User not authenticated',
        );
      });
    });

    describe('User Authenticated - Profile Refresh', () => {
      it('should refresh profile from AuthService', async () => {
        authServiceMock.refreshCurrentUserProfile.and.returnValue(of(mockProfile));

        const result = await service.ensureMyProfile();

        expect(authServiceMock.refreshCurrentUserProfile).toHaveBeenCalled();
        expect(result).toEqual(expectedUserProfile);
      });

      it('should map refreshed profile data correctly to IUserProfile', async () => {
        authServiceMock.refreshCurrentUserProfile.and.returnValue(of(mockProfile));

        const result = await service.ensureMyProfile();

        expect(result.id).toBe(mockProfile.id);
        expect(result.email).toBe(mockUser.email);
        expect(result.short_id).toBe(mockProfile.short_id);
        expect(result.created_at).toBe(mockProfile.created_at);
      });

      it('should handle profile refresh errors by propagating them', async () => {
        const mockError = new Error('Failed to refresh profile');
        authServiceMock.refreshCurrentUserProfile.and.returnValue(throwError(() => mockError));

        await expectAsync(service.ensureMyProfile()).toBeRejectedWith(mockError);
      });

      it('should use empty string for email when user.email is null', async () => {
        const userWithoutEmail = { ...mockUser, email: null };
        Object.defineProperty(authServiceMock, 'user', {
          value: signal(userWithoutEmail),
          configurable: true,
        });

        authServiceMock.refreshCurrentUserProfile.and.returnValue(of(mockProfile));

        const result = await service.ensureMyProfile();

        expect(result.email).toBe('');
      });

      it('should use empty string for email when user.email is undefined', async () => {
        const userWithoutEmail = { ...mockUser, email: undefined };
        Object.defineProperty(authServiceMock, 'user', {
          value: signal(userWithoutEmail),
          configurable: true,
        });

        authServiceMock.refreshCurrentUserProfile.and.returnValue(of(mockProfile));

        const result = await service.ensureMyProfile();

        expect(result.email).toBe('');
      });
    });

    describe('Profile Data Mapping', () => {
      it('should preserve all profile fields during refresh mapping', async () => {
        const customProfile: ProfileDTO = {
          id: 'refreshed-id',
          short_id: 'REF456',
          stamp_count: 15,
          created_at: '2024-12-01T10:30:00Z',
        };

        authServiceMock.refreshCurrentUserProfile.and.returnValue(of(customProfile));

        const result = await service.ensureMyProfile();

        expect(result.id).toBe('refreshed-id');
        expect(result.short_id).toBe('REF456');
        expect(result.created_at).toBe('2024-12-01T10:30:00Z');
      });

      it('should handle refreshed profile with all valid data types', async () => {
        authServiceMock.refreshCurrentUserProfile.and.returnValue(of(mockProfile));

        const result = await service.ensureMyProfile();

        expect(typeof result.id).toBe('string');
        expect(typeof result.email).toBe('string');
        expect(typeof result.short_id).toBe('string');
        expect(typeof result.created_at).toBe('string');
      });
    });
  });

  describe('Business Rules and Edge Cases', () => {
    describe('Email Handling', () => {
      it('should handle missing email gracefully in getMyProfile', async () => {
        const userWithoutEmail = {
          id: mockUser.id,
          aud: mockUser.aud,
          role: mockUser.role,
        };
        Object.defineProperty(authServiceMock, 'user', {
          value: signal(userWithoutEmail),
          configurable: true,
        });

        const result = await service.getMyProfile();

        expect(result!.email).toBe('');
      });

      it('should handle missing email gracefully in ensureMyProfile', async () => {
        const userWithoutEmail = {
          id: mockUser.id,
          aud: mockUser.aud,
          role: mockUser.role,
        };
        Object.defineProperty(authServiceMock, 'user', {
          value: signal(userWithoutEmail),
          configurable: true,
        });

        authServiceMock.refreshCurrentUserProfile.and.returnValue(of(mockProfile));

        const result = await service.ensureMyProfile();

        expect(result.email).toBe('');
      });
    });

    describe('Cache vs Fetch Decision Logic', () => {
      it('should prefer cached profile over fetching', async () => {
        // Both cache and fetch are available
        authServiceMock.getCurrentUserProfile.and.returnValue(of(mockProfile));

        await service.getMyProfile();

        // Should use cache, not call getCurrentUserProfile
        expect(authServiceMock.getCurrentUserProfile).not.toHaveBeenCalled();
      });

      it('should fetch when cache is explicitly null', async () => {
        Object.defineProperty(authServiceMock, 'currentProfile', {
          value: signal(null),
          configurable: true,
        });

        authServiceMock.getCurrentUserProfile.and.returnValue(of(mockProfile));

        await service.getMyProfile();

        expect(authServiceMock.getCurrentUserProfile).toHaveBeenCalled();
      });
    });

    describe('Authentication State Changes', () => {
      it('should handle user logging out during getMyProfile', async () => {
        Object.defineProperty(authServiceMock, 'user', {
          value: signal(null),
          configurable: true,
        });

        const result = await service.getMyProfile();

        expect(result).toBeNull();
      });

      it('should handle user logging out during ensureMyProfile', async () => {
        Object.defineProperty(authServiceMock, 'user', {
          value: signal(null),
          configurable: true,
        });

        await expectAsync(service.ensureMyProfile()).toBeRejectedWithError(
          'User not authenticated',
        );
      });
    });

    describe('Profile Consistency', () => {
      it('should return consistent data structure from getMyProfile', async () => {
        const result = await service.getMyProfile();

        expect(result).toEqual(
          jasmine.objectContaining({
            id: jasmine.any(String),
            email: jasmine.any(String),
            short_id: jasmine.any(String),
            created_at: jasmine.any(String),
          }),
        );
      });

      it('should return consistent data structure from ensureMyProfile', async () => {
        authServiceMock.refreshCurrentUserProfile.and.returnValue(of(mockProfile));

        const result = await service.ensureMyProfile();

        expect(result).toEqual(
          jasmine.objectContaining({
            id: jasmine.any(String),
            email: jasmine.any(String),
            short_id: jasmine.any(String),
            created_at: jasmine.any(String),
          }),
        );
      });

      it('should return same profile structure whether from cache or fetch', async () => {
        // Get from cache
        const cachedResult = await service.getMyProfile();

        // Clear cache and fetch
        Object.defineProperty(authServiceMock, 'currentProfile', {
          value: signal(null),
          configurable: true,
        });
        authServiceMock.getCurrentUserProfile.and.returnValue(of(mockProfile));

        const fetchedResult = await service.getMyProfile();

        expect(Object.keys(cachedResult!)).toEqual(Object.keys(fetchedResult!));
      });
    });

    describe('Observable to Promise Conversion', () => {
      it('should correctly convert getCurrentUserProfile observable to promise', async () => {
        Object.defineProperty(authServiceMock, 'currentProfile', {
          value: signal(null),
          configurable: true,
        });

        authServiceMock.getCurrentUserProfile.and.returnValue(of(mockProfile));

        const result = await service.getMyProfile();

        expect(result).toEqual(expectedUserProfile);
      });

      it('should correctly convert refreshCurrentUserProfile observable to promise', async () => {
        authServiceMock.refreshCurrentUserProfile.and.returnValue(of(mockProfile));

        const result = await service.ensureMyProfile();

        expect(result).toEqual(expectedUserProfile);
      });

      it('should handle observable errors in getCurrentUserProfile', async () => {
        Object.defineProperty(authServiceMock, 'currentProfile', {
          value: signal(null),
          configurable: true,
        });

        const testError = new Error('Observable error');
        authServiceMock.getCurrentUserProfile.and.returnValue(throwError(() => testError));

        await expectAsync(service.getMyProfile()).toBeRejectedWith(testError);
      });

      it('should handle observable errors in refreshCurrentUserProfile', async () => {
        const testError = new Error('Observable error');
        authServiceMock.refreshCurrentUserProfile.and.returnValue(throwError(() => testError));

        await expectAsync(service.ensureMyProfile()).toBeRejectedWith(testError);
      });
    });
  });
});
