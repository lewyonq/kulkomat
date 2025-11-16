import { TestBed } from '@angular/core/testing';
import { SellersService } from './sellers.service';
import { AuthService } from './auth.service';
import { signal } from '@angular/core';

describe('SellersService', () => {
  let service: SellersService;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let supabaseClientMock: any;

  // Mock data
  const mockUser: any = {
    id: 'test-user-id',
    email: 'test@example.com',
    aud: 'authenticated',
    role: 'authenticated',
    created_at: '2024-01-01T00:00:00Z',
  };

  const mockSellerRecord = {
    id: 'test-user-id',
    created_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    // Create Supabase client mock
    supabaseClientMock = {
      from: jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            maybeSingle: jasmine
              .createSpy('maybeSingle')
              .and.returnValue(Promise.resolve({ data: null, error: null })),
          }),
        }),
      }),
    };

    // Create AuthService mock
    authServiceMock = jasmine.createSpyObj('AuthService', [], {
      user: signal(null),
      client: supabaseClientMock,
    });

    TestBed.configureTestingModule({
      providers: [SellersService, { provide: AuthService, useValue: authServiceMock }],
    });

    service = TestBed.inject(SellersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isCurrentUserSeller', () => {
    it('should return false when user is not logged in', async () => {
      // Arrange
      Object.defineProperty(authServiceMock, 'user', {
        get: () => signal(null),
        configurable: true,
      });

      // Act
      const result = await service.isCurrentUserSeller();

      // Assert
      expect(result).toBe(false);
      expect(supabaseClientMock.from).not.toHaveBeenCalled();
    });

    it('should return true when user is a seller', async () => {
      // Arrange
      Object.defineProperty(authServiceMock, 'user', {
        get: () => signal(mockUser),
        configurable: true,
      });

      const mockResponse = {
        data: { id: 'test-user-id' },
        error: null,
      };

      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            maybeSingle: jasmine
              .createSpy('maybeSingle')
              .and.returnValue(Promise.resolve(mockResponse)),
          }),
        }),
      });

      // Act
      const result = await service.isCurrentUserSeller();

      // Assert
      expect(result).toBe(true);
      expect(supabaseClientMock.from).toHaveBeenCalledWith('sellers');
    });

    it('should return false when user is not a seller', async () => {
      // Arrange
      Object.defineProperty(authServiceMock, 'user', {
        get: () => signal(mockUser),
        configurable: true,
      });

      const mockResponse = {
        data: null,
        error: null,
      };

      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            maybeSingle: jasmine
              .createSpy('maybeSingle')
              .and.returnValue(Promise.resolve(mockResponse)),
          }),
        }),
      });

      // Act
      const result = await service.isCurrentUserSeller();

      // Assert
      expect(result).toBe(false);
      expect(supabaseClientMock.from).toHaveBeenCalledWith('sellers');
    });

    it('should return false when database query returns an error', async () => {
      // Arrange
      Object.defineProperty(authServiceMock, 'user', {
        get: () => signal(mockUser),
        configurable: true,
      });

      const mockResponse = {
        data: null,
        error: { message: 'Database error' },
      };

      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            maybeSingle: jasmine
              .createSpy('maybeSingle')
              .and.returnValue(Promise.resolve(mockResponse)),
          }),
        }),
      });

      // Act
      const result = await service.isCurrentUserSeller();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when an exception is thrown', async () => {
      // Arrange
      Object.defineProperty(authServiceMock, 'user', {
        get: () => signal(mockUser),
        configurable: true,
      });

      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            maybeSingle: jasmine
              .createSpy('maybeSingle')
              .and.returnValue(Promise.reject(new Error('Network error'))),
          }),
        }),
      });

      // Act
      const result = await service.isCurrentUserSeller();

      // Assert
      expect(result).toBe(false);
    });

    it('should query sellers table with correct user id', async () => {
      // Arrange
      Object.defineProperty(authServiceMock, 'user', {
        get: () => signal(mockUser),
        configurable: true,
      });

      const selectSpy = jasmine.createSpy('select').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue({
          maybeSingle: jasmine
            .createSpy('maybeSingle')
            .and.returnValue(Promise.resolve({ data: null, error: null })),
        }),
      });

      const eqSpy = jasmine.createSpy('eq').and.returnValue({
        maybeSingle: jasmine
          .createSpy('maybeSingle')
          .and.returnValue(Promise.resolve({ data: null, error: null })),
      });

      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: selectSpy.and.returnValue({
          eq: eqSpy,
        }),
      });

      // Act
      await service.isCurrentUserSeller();

      // Assert
      expect(supabaseClientMock.from).toHaveBeenCalledWith('sellers');
      expect(selectSpy).toHaveBeenCalledWith('id');
      expect(eqSpy).toHaveBeenCalledWith('id', 'test-user-id');
    });
  });

  describe('getCurrentSellerRecord', () => {
    it('should return null when user is not logged in', async () => {
      // Arrange
      Object.defineProperty(authServiceMock, 'user', {
        get: () => signal(null),
        configurable: true,
      });

      // Act
      const result = await service.getCurrentSellerRecord();

      // Assert
      expect(result).toBeNull();
      expect(supabaseClientMock.from).not.toHaveBeenCalled();
    });

    it('should return seller record when user is a seller', async () => {
      // Arrange
      Object.defineProperty(authServiceMock, 'user', {
        get: () => signal(mockUser),
        configurable: true,
      });

      const mockResponse = {
        data: mockSellerRecord,
        error: null,
      };

      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            maybeSingle: jasmine
              .createSpy('maybeSingle')
              .and.returnValue(Promise.resolve(mockResponse)),
          }),
        }),
      });

      // Act
      const result = await service.getCurrentSellerRecord();

      // Assert
      expect(result).toEqual({
        user_id: 'test-user-id',
        active: true,
        created_at: '2024-01-01T00:00:00Z',
      });
      expect(supabaseClientMock.from).toHaveBeenCalledWith('sellers');
    });

    it('should return null when user is not a seller', async () => {
      // Arrange
      Object.defineProperty(authServiceMock, 'user', {
        get: () => signal(mockUser),
        configurable: true,
      });

      const mockResponse = {
        data: null,
        error: null,
      };

      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            maybeSingle: jasmine
              .createSpy('maybeSingle')
              .and.returnValue(Promise.resolve(mockResponse)),
          }),
        }),
      });

      // Act
      const result = await service.getCurrentSellerRecord();

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when database query returns an error', async () => {
      // Arrange
      Object.defineProperty(authServiceMock, 'user', {
        get: () => signal(mockUser),
        configurable: true,
      });

      const mockResponse = {
        data: null,
        error: { message: 'Database error' },
      };

      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            maybeSingle: jasmine
              .createSpy('maybeSingle')
              .and.returnValue(Promise.resolve(mockResponse)),
          }),
        }),
      });

      // Act
      const result = await service.getCurrentSellerRecord();

      // Assert
      expect(result).toBeNull();
    });

    it('should query sellers table with correct fields and user id', async () => {
      // Arrange
      Object.defineProperty(authServiceMock, 'user', {
        get: () => signal(mockUser),
        configurable: true,
      });

      const selectSpy = jasmine.createSpy('select').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue({
          maybeSingle: jasmine
            .createSpy('maybeSingle')
            .and.returnValue(Promise.resolve({ data: mockSellerRecord, error: null })),
        }),
      });

      const eqSpy = jasmine.createSpy('eq').and.returnValue({
        maybeSingle: jasmine
          .createSpy('maybeSingle')
          .and.returnValue(Promise.resolve({ data: mockSellerRecord, error: null })),
      });

      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: selectSpy.and.returnValue({
          eq: eqSpy,
        }),
      });

      // Act
      await service.getCurrentSellerRecord();

      // Assert
      expect(supabaseClientMock.from).toHaveBeenCalledWith('sellers');
      expect(selectSpy).toHaveBeenCalledWith('id, created_at');
      expect(eqSpy).toHaveBeenCalledWith('id', 'test-user-id');
    });

    it('should always set active to true in returned record', async () => {
      // Arrange
      Object.defineProperty(authServiceMock, 'user', {
        get: () => signal(mockUser),
        configurable: true,
      });

      const mockResponse = {
        data: mockSellerRecord,
        error: null,
      };

      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            maybeSingle: jasmine
              .createSpy('maybeSingle')
              .and.returnValue(Promise.resolve(mockResponse)),
          }),
        }),
      });

      // Act
      const result = await service.getCurrentSellerRecord();

      // Assert
      expect(result?.active).toBe(true);
    });

    it('should map id to user_id in returned record', async () => {
      // Arrange
      Object.defineProperty(authServiceMock, 'user', {
        get: () => signal(mockUser),
        configurable: true,
      });

      const mockResponse = {
        data: { id: 'seller-123', created_at: '2024-06-15T10:00:00Z' },
        error: null,
      };

      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            maybeSingle: jasmine
              .createSpy('maybeSingle')
              .and.returnValue(Promise.resolve(mockResponse)),
          }),
        }),
      });

      // Act
      const result = await service.getCurrentSellerRecord();

      // Assert
      expect(result?.user_id).toBe('seller-123');
      expect(result?.created_at).toBe('2024-06-15T10:00:00Z');
    });
  });
});
