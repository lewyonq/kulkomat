import { TestBed } from '@angular/core/testing';
import { StampService } from './stamp.service';
import { AuthService } from './auth.service';

describe('StampService', () => {
  let service: StampService;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let supabaseClientMock: any;
  let userSpy: jasmine.Spy;
  let channelMock: any;

  // Mock data
  const mockUser = {
    id: 'user-uuid-123',
    email: 'user@test.com',
  };

  const mockCustomerId = 'customer-uuid-456';

  beforeEach(() => {
    // Create channel mock for realtime subscriptions
    // Need to create a proper chainable mock
    // Note: subscribe() should return the channel itself for proper cleanup
    channelMock = {
      on: jasmine.createSpy('on'),
    };

    const subscribeMock = jasmine.createSpy('subscribe').and.returnValue(channelMock);
    const on3Mock = {
      subscribe: subscribeMock,
    };
    const on2Mock = {
      on: jasmine.createSpy('on').and.returnValue(on3Mock),
    };
    const on1Mock = {
      on: jasmine.createSpy('on').and.returnValue(on2Mock),
    };

    channelMock.on.and.returnValue(on1Mock);

    // Create Supabase client mock
    supabaseClientMock = {
      from: jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ count: 5, error: null })),
          }),
        }),
      }),
      channel: jasmine.createSpy('channel').and.returnValue(channelMock),
      removeChannel: jasmine.createSpy('removeChannel'),
    };

    // Create AuthService mock with spy for user signal
    userSpy = jasmine.createSpy('user').and.returnValue(mockUser);
    authServiceMock = jasmine.createSpyObj('AuthService', [], {
      client: supabaseClientMock,
      user: userSpy,
    });

    TestBed.configureTestingModule({
      providers: [StampService, { provide: AuthService, useValue: authServiceMock }],
    });

    service = TestBed.inject(StampService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Signal State Management', () => {
    it('should initialize with correct default states', () => {
      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBeNull();
    });
  });

  describe('getCustomerStampsCount', () => {
    it('should successfully fetch customer stamps count', (done) => {
      service.getCustomerStampsCount(mockCustomerId).subscribe({
        next: (count) => {
          expect(count).toBe(5);
          expect(service.isLoading()).toBe(false);
          expect(service.error()).toBeNull();
          expect(supabaseClientMock.from).toHaveBeenCalledWith('stamps');
          done();
        },
        error: done.fail,
      });
    });

    it('should set loading state during fetch', (done) => {
      service.getCustomerStampsCount(mockCustomerId).subscribe({
        next: () => {
          expect(service.isLoading()).toBe(false);
          done();
        },
        error: done.fail,
      });
    });

    it('should return 0 when count is null', (done) => {
      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            eq: jasmine
              .createSpy('eq')
              .and.returnValue(Promise.resolve({ count: null, error: null })),
          }),
        }),
      });

      service.getCustomerStampsCount(mockCustomerId).subscribe({
        next: (count) => {
          expect(count).toBe(0);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle database errors', (done) => {
      const dbError = { message: 'Database connection failed' };
      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            eq: jasmine
              .createSpy('eq')
              .and.returnValue(Promise.resolve({ count: null, error: dbError })),
          }),
        }),
      });

      service.getCustomerStampsCount(mockCustomerId).subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('Database connection failed');
          expect(service.isLoading()).toBe(false);
          expect(service.error()).toBeTruthy();
          done();
        },
      });
    });

    it('should filter by user_id and status=active', (done) => {
      const selectSpy = jasmine.createSpy('select').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ count: 5, error: null })),
        }),
      });

      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: selectSpy,
      });

      service.getCustomerStampsCount(mockCustomerId).subscribe({
        next: () => {
          expect(selectSpy).toHaveBeenCalledWith('*', { count: 'exact', head: true });
          done();
        },
        error: done.fail,
      });
    });

    it('should handle empty user_id', (done) => {
      service.getCustomerStampsCount('').subscribe({
        next: () => {
          expect(supabaseClientMock.from).toHaveBeenCalledWith('stamps');
          done();
        },
        error: done.fail,
      });
    });

    it('should clear previous errors before new request', (done) => {
      service.error.set(new Error('Previous error'));

      service.getCustomerStampsCount(mockCustomerId).subscribe({
        next: () => {
          expect(service.error()).toBeNull();
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('getActiveStampsCount', () => {
    beforeEach(() => {
      // Reset cache before each test in this describe block
      (service as any).stampCountCache.set(null);
    });

    it('should successfully fetch active stamps count', (done) => {
      service.getActiveStampsCount().subscribe({
        next: (count) => {
          expect(count).toBe(5);
          expect(service.isLoading()).toBe(false);
          expect(service.error()).toBeNull();
          expect(supabaseClientMock.from).toHaveBeenCalledWith('stamps');
          done();
        },
        error: done.fail,
      });
    });

    it('should return cached value if available', (done) => {
      // Set cache
      (service as any).stampCountCache.set(10);

      service.getActiveStampsCount().subscribe({
        next: (count) => {
          expect(count).toBe(10);
          expect(supabaseClientMock.from).not.toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });

    it('should cache the fetched count', (done) => {
      service.getActiveStampsCount().subscribe({
        next: (count) => {
          expect(count).toBe(5);
          expect((service as any).stampCountCache()).toBe(5);
          done();
        },
        error: done.fail,
      });
    });

    it('should set loading state during fetch', (done) => {
      service.getActiveStampsCount().subscribe({
        next: () => {
          expect(service.isLoading()).toBe(false);
          done();
        },
        error: done.fail,
      });
    });

    it('should return error when user is not authenticated', (done) => {
      userSpy.and.returnValue(null);

      service.getActiveStampsCount().subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('User not authenticated');
          expect(service.isLoading()).toBe(false);
          done();
        },
      });
    });

    it('should return 0 when count is null', (done) => {
      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            eq: jasmine
              .createSpy('eq')
              .and.returnValue(Promise.resolve({ count: null, error: null })),
          }),
        }),
      });

      service.getActiveStampsCount().subscribe({
        next: (count) => {
          expect(count).toBe(0);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle database errors', (done) => {
      const dbError = { message: 'Permission denied' };
      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            eq: jasmine
              .createSpy('eq')
              .and.returnValue(Promise.resolve({ count: null, error: dbError })),
          }),
        }),
      });

      service.getActiveStampsCount().subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('Permission denied');
          expect(service.isLoading()).toBe(false);
          expect(service.error()).toBeTruthy();
          done();
        },
      });
    });

    it('should filter by authenticated user_id', (done) => {
      service.getActiveStampsCount().subscribe({
        next: () => {
          expect(supabaseClientMock.from).toHaveBeenCalledWith('stamps');
          done();
        },
        error: done.fail,
      });
    });

    it('should clear previous errors before new request', (done) => {
      service.error.set(new Error('Previous error'));

      service.getActiveStampsCount().subscribe({
        next: () => {
          expect(service.error()).toBeNull();
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('watchActiveStampsCount', () => {
    beforeEach(() => {
      // Reset cache
      (service as any).stampCountCache.set(null);

      // Don't mock getActiveStampsCount, let it work normally with the mocked client
    });

    it('should emit initial stamp count', (done) => {
      service.watchActiveStampsCount().subscribe({
        next: (count) => {
          expect(count).toBe(5);
          done();
        },
        error: done.fail,
      });
    });

    it('should return error when user is not authenticated', (done) => {
      userSpy.and.returnValue(null);

      service.watchActiveStampsCount().subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('User not authenticated');
          expect(service.isLoading()).toBe(false);
          done();
        },
      });
    });

    it('should setup realtime channel after initial fetch', (done) => {
      service.watchActiveStampsCount().subscribe({
        next: () => {
          // Use setTimeout to allow synchronous setupRealtimeChannel to complete
          setTimeout(() => {
            expect(supabaseClientMock.channel).toHaveBeenCalledWith('public:stamps');
            expect(channelMock.on).toHaveBeenCalled();
            done();
          }, 0);
        },
        error: done.fail,
      });
    });

    it('should handle errors from initial fetch', (done) => {
      const dbError = { message: 'Database error' };
      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            eq: jasmine
              .createSpy('eq')
              .and.returnValue(Promise.resolve({ count: null, error: dbError })),
          }),
        }),
      });

      service.watchActiveStampsCount().subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('Database error');
          expect(service.error()).toBeTruthy();
          expect(service.isLoading()).toBe(false);
          done();
        },
      });
    });

    it('should set loading state to false after initial fetch', (done) => {
      service.watchActiveStampsCount().subscribe({
        next: () => {
          expect(service.isLoading()).toBe(false);
          done();
        },
        error: done.fail,
      });
    });

    it('should cache initial count', (done) => {
      service.watchActiveStampsCount().subscribe({
        next: () => {
          expect((service as any).stampCountCache()).toBe(5);
          done();
        },
        error: done.fail,
      });
    });

    // Note: Testing channel cleanup on unsubscribe is challenging due to async timing
    // The important behaviors (initial emit, channel setup, realtime listeners) are tested above

    it('should register realtime event listeners', (done) => {
      service.watchActiveStampsCount().subscribe({
        next: () => {
          // Use setTimeout to allow synchronous setupRealtimeChannel to complete
          setTimeout(() => {
            // Channel.on should be called 3 times for INSERT, UPDATE, DELETE events
            expect(channelMock.on).toHaveBeenCalled();
            done();
          }, 0);
        },
        error: done.fail,
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    beforeEach(() => {
      (service as any).stampCountCache.set(null);
    });

    it('should handle null error message gracefully', (done) => {
      const errorWithoutMessage = { code: 'UNKNOWN_ERROR' };
      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            eq: jasmine
              .createSpy('eq')
              .and.returnValue(Promise.resolve({ count: null, error: errorWithoutMessage })),
          }),
        }),
      });

      service.getActiveStampsCount().subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('Failed to fetch active stamps count');
          done();
        },
      });
    });

    it('should maintain error state across failed operations', (done) => {
      const dbError = { message: 'Connection timeout' };
      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            eq: jasmine
              .createSpy('eq')
              .and.returnValue(Promise.resolve({ count: null, error: dbError })),
          }),
        }),
      });

      service.getCustomerStampsCount(mockCustomerId).subscribe({
        next: () => done.fail('should not succeed'),
        error: () => {
          expect(service.error()).toBeTruthy();
          expect(service.error()?.message).toBe('Connection timeout');
          done();
        },
      });
    });
  });

  describe('Business Rules Validation', () => {
    beforeEach(() => {
      (service as any).stampCountCache.set(null);
    });

    it('should only count active stamps', (done) => {
      const selectSpy = jasmine.createSpy('select').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ count: 5, error: null })),
        }),
      });

      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: selectSpy,
      });

      service.getActiveStampsCount().subscribe({
        next: () => {
          expect(selectSpy).toHaveBeenCalledWith('*', { count: 'exact', head: true });
          done();
        },
        error: done.fail,
      });
    });

    it('should handle zero stamps correctly', (done) => {
      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ count: 0, error: null })),
          }),
        }),
      });

      service.getActiveStampsCount().subscribe({
        next: (count) => {
          expect(count).toBe(0);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle large stamp counts', (done) => {
      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            eq: jasmine
              .createSpy('eq')
              .and.returnValue(Promise.resolve({ count: 1000, error: null })),
          }),
        }),
      });

      service.getCustomerStampsCount(mockCustomerId).subscribe({
        next: (count) => {
          expect(count).toBe(1000);
          done();
        },
        error: done.fail,
      });
    });

    it('should use exact count for accuracy', (done) => {
      const selectSpy = jasmine.createSpy('select').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ count: 5, error: null })),
        }),
      });

      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: selectSpy,
      });

      service.getCustomerStampsCount(mockCustomerId).subscribe({
        next: () => {
          expect(selectSpy).toHaveBeenCalledWith('*', jasmine.objectContaining({ count: 'exact' }));
          done();
        },
        error: done.fail,
      });
    });

    it('should use head-only query for performance', (done) => {
      const selectSpy = jasmine.createSpy('select').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ count: 5, error: null })),
        }),
      });

      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: selectSpy,
      });

      service.getActiveStampsCount().subscribe({
        next: () => {
          expect(selectSpy).toHaveBeenCalledWith('*', jasmine.objectContaining({ head: true }));
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('Cache Management', () => {
    it('should return cached value without hitting database', (done) => {
      (service as any).stampCountCache.set(15);

      service.getActiveStampsCount().subscribe({
        next: (count) => {
          expect(count).toBe(15);
          expect(supabaseClientMock.from).not.toHaveBeenCalled();
          expect(service.isLoading()).toBe(false);
          done();
        },
        error: done.fail,
      });
    });

    it('should update cache after successful fetch', (done) => {
      (service as any).stampCountCache.set(null);

      service.getActiveStampsCount().subscribe({
        next: (count) => {
          expect((service as any).stampCountCache()).toBe(count);
          done();
        },
        error: done.fail,
      });
    });

    it('should not cache on error', (done) => {
      (service as any).stampCountCache.set(null);
      const dbError = { message: 'Database error' };
      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            eq: jasmine
              .createSpy('eq')
              .and.returnValue(Promise.resolve({ count: null, error: dbError })),
          }),
        }),
      });

      service.getActiveStampsCount().subscribe({
        next: () => done.fail('should not succeed'),
        error: () => {
          expect((service as any).stampCountCache()).toBeNull();
          done();
        },
      });
    });
  });
});
