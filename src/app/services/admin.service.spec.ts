import { TestBed } from '@angular/core/testing';
import { AdminService } from './admin.service';
import { AuthService } from './auth.service';
import { ProfileDTO, CouponDTO } from '../types';

describe('AdminService', () => {
  let service: AdminService;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let supabaseClientMock: any;
  let userSpy: jasmine.Spy;

  // Mock data
  const mockUser = {
    id: 'admin-user-id',
    email: 'admin@test.com',
    role: 'admin',
  };

  const mockProfile: ProfileDTO = {
    id: 'customer-uuid',
    short_id: 'ABC123',
    stamp_count: 5,
    created_at: '2024-01-01T00:00:00Z',
  };

  const mockCoupon: CouponDTO = {
    id: 1,
    user_id: 'customer-uuid',
    type: 'free_scoop',
    value: null,
    status: 'active',
    expires_at: '2024-12-31T23:59:59Z',
    used_at: null,
    created_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    // Create Supabase client mock
    supabaseClientMock = {
      from: jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine
              .createSpy('single')
              .and.returnValue(Promise.resolve({ data: mockProfile, error: null })),
          }),
        }),
      }),
      rpc: jasmine.createSpy('rpc').and.returnValue(Promise.resolve({ data: null, error: null })),
    };

    // Create AuthService mock with a spy for the user signal
    userSpy = jasmine.createSpy('user').and.returnValue(mockUser);
    authServiceMock = jasmine.createSpyObj('AuthService', [], {
      client: supabaseClientMock,
      user: userSpy,
    });

    TestBed.configureTestingModule({
      providers: [AdminService, { provide: AuthService, useValue: authServiceMock }],
    });

    service = TestBed.inject(AdminService);
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

  describe('getCustomerDetailsByShortId', () => {
    it('should successfully fetch customer details by short_id', (done) => {
      service.getCustomerDetailsByShortId('ABC123').subscribe({
        next: (profile) => {
          expect(profile).toEqual(mockProfile);
          expect(service.isLoading()).toBe(false);
          expect(service.error()).toBeNull();
          expect(supabaseClientMock.from).toHaveBeenCalledWith('profiles');
          done();
        },
        error: done.fail,
      });
    });

    it('should set loading state during fetch', (done) => {
      service.getCustomerDetailsByShortId('ABC123').subscribe({
        next: () => {
          expect(service.isLoading()).toBe(false);
          done();
        },
        error: done.fail,
      });
    });

    it('should return error when admin is not authenticated', (done) => {
      userSpy.and.returnValue(null);

      service.getCustomerDetailsByShortId('ABC123').subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('Admin not authenticated');
          expect(service.isLoading()).toBe(false);
          done();
        },
      });
    });

    it('should handle customer not found error', (done) => {
      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine
              .createSpy('single')
              .and.returnValue(Promise.resolve({ data: null, error: null })),
          }),
        }),
      });

      service.getCustomerDetailsByShortId('NOTFOUND').subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('Customer not found');
          expect(service.isLoading()).toBe(false);
          expect(service.error()).toBeTruthy();
          expect(service.error()?.message).toBe('Customer not found');
          done();
        },
      });
    });

    it('should handle database errors', (done) => {
      const dbError = { message: 'Database connection failed' };
      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine
              .createSpy('single')
              .and.returnValue(Promise.resolve({ data: null, error: dbError })),
          }),
        }),
      });

      service.getCustomerDetailsByShortId('ABC123').subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('Database connection failed');
          expect(service.isLoading()).toBe(false);
          expect(service.error()).toBeTruthy();
          done();
        },
      });
    });

    it('should clear previous errors before new request', (done) => {
      // Set an error first
      service.error.set(new Error('Previous error'));

      service.getCustomerDetailsByShortId('ABC123').subscribe({
        next: () => {
          expect(service.error()).toBeNull();
          done();
        },
        error: done.fail,
      });
    });

    it('should handle empty short_id', (done) => {
      service.getCustomerDetailsByShortId('').subscribe({
        next: () => {
          expect(supabaseClientMock.from).toHaveBeenCalledWith('profiles');
          done();
        },
        error: done.fail,
      });
    });

    it('should handle case-sensitive short_id', (done) => {
      const lowerCaseShortId = 'abc123';

      service.getCustomerDetailsByShortId(lowerCaseShortId).subscribe({
        next: (profile) => {
          expect(profile).toEqual(mockProfile);
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('getCustomerDetailsById', () => {
    it('should successfully fetch customer details by UUID', (done) => {
      service.getCustomerDetailsById('customer-uuid').subscribe({
        next: (profile) => {
          expect(profile).toEqual(mockProfile);
          expect(service.isLoading()).toBe(false);
          expect(service.error()).toBeNull();
          expect(supabaseClientMock.from).toHaveBeenCalledWith('profiles');
          done();
        },
        error: done.fail,
      });
    });

    it('should set loading state during fetch', (done) => {
      service.getCustomerDetailsById('customer-uuid').subscribe({
        next: () => {
          expect(service.isLoading()).toBe(false);
          done();
        },
        error: done.fail,
      });
    });

    it('should return error when admin is not authenticated', (done) => {
      userSpy.and.returnValue(null);

      service.getCustomerDetailsById('customer-uuid').subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('Admin not authenticated');
          expect(service.isLoading()).toBe(false);
          done();
        },
      });
    });

    it('should handle customer not found error', (done) => {
      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine
              .createSpy('single')
              .and.returnValue(Promise.resolve({ data: null, error: null })),
          }),
        }),
      });

      service.getCustomerDetailsById('non-existent-uuid').subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('Customer not found');
          expect(service.isLoading()).toBe(false);
          expect(service.error()).toBeTruthy();
          done();
        },
      });
    });

    it('should handle database errors', (done) => {
      const dbError = { message: 'Connection timeout' };
      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine
              .createSpy('single')
              .and.returnValue(Promise.resolve({ data: null, error: dbError })),
          }),
        }),
      });

      service.getCustomerDetailsById('customer-uuid').subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('Connection timeout');
          expect(service.isLoading()).toBe(false);
          expect(service.error()).toBeTruthy();
          done();
        },
      });
    });

    it('should handle invalid UUID format gracefully', (done) => {
      const invalidUuid = 'not-a-valid-uuid';

      service.getCustomerDetailsById(invalidUuid).subscribe({
        next: () => {
          // Service doesn't validate UUID format, delegates to database
          expect(supabaseClientMock.from).toHaveBeenCalledWith('profiles');
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('addStampsToCustomer', () => {
    it('should successfully add stamps to customer', (done) => {
      service.addStampsToCustomer('customer-uuid', 3).subscribe({
        next: () => {
          expect(service.isLoading()).toBe(false);
          expect(service.error()).toBeNull();
          expect(supabaseClientMock.rpc).toHaveBeenCalledWith('add_stamps_to_user', {
            p_user_id: 'customer-uuid',
            p_count: 3,
          });
          done();
        },
        error: done.fail,
      });
    });

    it('should handle adding minimum stamps (1)', (done) => {
      service.addStampsToCustomer('customer-uuid', 1).subscribe({
        next: () => {
          expect(supabaseClientMock.rpc).toHaveBeenCalledWith('add_stamps_to_user', {
            p_user_id: 'customer-uuid',
            p_count: 1,
          });
          done();
        },
        error: done.fail,
      });
    });

    it('should handle adding maximum stamps (10)', (done) => {
      service.addStampsToCustomer('customer-uuid', 10).subscribe({
        next: () => {
          expect(supabaseClientMock.rpc).toHaveBeenCalledWith('add_stamps_to_user', {
            p_user_id: 'customer-uuid',
            p_count: 10,
          });
          done();
        },
        error: done.fail,
      });
    });

    it('should set loading state during operation', (done) => {
      service.addStampsToCustomer('customer-uuid', 3).subscribe({
        next: () => {
          expect(service.isLoading()).toBe(false);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle RPC errors', (done) => {
      const rpcError = { message: 'Invalid user_id' };
      supabaseClientMock.rpc = jasmine
        .createSpy('rpc')
        .and.returnValue(Promise.resolve({ data: null, error: rpcError }));

      service.addStampsToCustomer('invalid-uuid', 3).subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('Invalid user_id');
          expect(service.isLoading()).toBe(false);
          expect(service.error()).toBeTruthy();
          done();
        },
      });
    });

    it('should handle generic RPC failures', (done) => {
      supabaseClientMock.rpc = jasmine
        .createSpy('rpc')
        .and.returnValue(Promise.reject(new Error('Network error')));

      service.addStampsToCustomer('customer-uuid', 3).subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('Network error');
          expect(service.isLoading()).toBe(false);
          done();
        },
      });
    });

    it('should handle edge case of zero stamps', (done) => {
      service.addStampsToCustomer('customer-uuid', 0).subscribe({
        next: () => {
          expect(supabaseClientMock.rpc).toHaveBeenCalledWith('add_stamps_to_user', {
            p_user_id: 'customer-uuid',
            p_count: 0,
          });
          done();
        },
        error: done.fail,
      });
    });

    it('should handle negative stamp count', (done) => {
      // Service doesn't validate input, relies on database validation
      service.addStampsToCustomer('customer-uuid', -1).subscribe({
        next: () => {
          expect(supabaseClientMock.rpc).toHaveBeenCalledWith('add_stamps_to_user', {
            p_user_id: 'customer-uuid',
            p_count: -1,
          });
          done();
        },
        error: done.fail,
      });
    });

    it('should clear previous errors before new request', (done) => {
      service.error.set(new Error('Previous error'));

      service.addStampsToCustomer('customer-uuid', 3).subscribe({
        next: () => {
          expect(service.error()).toBeNull();
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('createManualCoupon', () => {
    const expiryDate = '2024-12-31T23:59:59Z';

    it('should successfully create a free_scoop coupon', (done) => {
      supabaseClientMock.rpc = jasmine
        .createSpy('rpc')
        .and.returnValue(Promise.resolve({ data: mockCoupon, error: null }));

      service.createManualCoupon('customer-uuid', 'free_scoop', null, expiryDate).subscribe({
        next: (coupon) => {
          expect(coupon).toEqual(mockCoupon);
          expect(service.isLoading()).toBe(false);
          expect(service.error()).toBeNull();
          expect(supabaseClientMock.rpc).toHaveBeenCalledWith('create_manual_coupon', {
            p_user_id: 'customer-uuid',
            p_type: 'free_scoop',
            p_value: null,
            p_expires_at: expiryDate,
          });
          done();
        },
        error: done.fail,
      });
    });

    it('should successfully create a percentage discount coupon with value', (done) => {
      const discountCoupon: CouponDTO = {
        ...mockCoupon,
        type: 'percentage',
        value: 15,
      };

      supabaseClientMock.rpc = jasmine
        .createSpy('rpc')
        .and.returnValue(Promise.resolve({ data: discountCoupon, error: null }));

      service.createManualCoupon('customer-uuid', 'percentage', 15, expiryDate).subscribe({
        next: (coupon) => {
          expect(coupon).toEqual(discountCoupon);
          expect(supabaseClientMock.rpc).toHaveBeenCalledWith('create_manual_coupon', {
            p_user_id: 'customer-uuid',
            p_type: 'percentage',
            p_value: 15,
            p_expires_at: expiryDate,
          });
          done();
        },
        error: done.fail,
      });
    });

    it('should set loading state during operation', (done) => {
      supabaseClientMock.rpc = jasmine
        .createSpy('rpc')
        .and.returnValue(Promise.resolve({ data: mockCoupon, error: null }));

      service.createManualCoupon('customer-uuid', 'free_scoop', null, expiryDate).subscribe({
        next: () => {
          expect(service.isLoading()).toBe(false);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle RPC errors', (done) => {
      const rpcError = { message: 'Invalid coupon type' };
      supabaseClientMock.rpc = jasmine
        .createSpy('rpc')
        .and.returnValue(Promise.resolve({ data: null, error: rpcError }));

      service.createManualCoupon('customer-uuid', 'invalid_type', null, expiryDate).subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('Invalid coupon type');
          expect(service.isLoading()).toBe(false);
          expect(service.error()).toBeTruthy();
          done();
        },
      });
    });

    it('should handle database constraint violations', (done) => {
      const constraintError = { message: 'User does not exist' };
      supabaseClientMock.rpc = jasmine
        .createSpy('rpc')
        .and.returnValue(Promise.resolve({ data: null, error: constraintError }));

      service.createManualCoupon('non-existent-uuid', 'free_scoop', null, expiryDate).subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('User does not exist');
          expect(service.error()).toBeTruthy();
          done();
        },
      });
    });

    it('should handle invalid expiry date format', (done) => {
      supabaseClientMock.rpc = jasmine
        .createSpy('rpc')
        .and.returnValue(Promise.resolve({ data: mockCoupon, error: null }));

      const invalidDate = 'invalid-date';
      service.createManualCoupon('customer-uuid', 'free_scoop', null, invalidDate).subscribe({
        next: () => {
          // Service doesn't validate date format, delegates to database
          expect(supabaseClientMock.rpc).toHaveBeenCalledWith('create_manual_coupon', {
            p_user_id: 'customer-uuid',
            p_type: 'free_scoop',
            p_value: null,
            p_expires_at: invalidDate,
          });
          done();
        },
        error: done.fail,
      });
    });

    it('should handle past expiry date', (done) => {
      supabaseClientMock.rpc = jasmine
        .createSpy('rpc')
        .and.returnValue(Promise.resolve({ data: mockCoupon, error: null }));

      const pastDate = '2020-01-01T00:00:00Z';
      service.createManualCoupon('customer-uuid', 'free_scoop', null, pastDate).subscribe({
        next: () => {
          // Service doesn't validate date, delegates to business logic
          expect(supabaseClientMock.rpc).toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });

    it('should clear previous errors before new request', (done) => {
      supabaseClientMock.rpc = jasmine
        .createSpy('rpc')
        .and.returnValue(Promise.resolve({ data: mockCoupon, error: null }));
      service.error.set(new Error('Previous error'));

      service.createManualCoupon('customer-uuid', 'free_scoop', null, expiryDate).subscribe({
        next: () => {
          expect(service.error()).toBeNull();
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('useCoupon', () => {
    const usedCoupon: CouponDTO = {
      ...mockCoupon,
      status: 'used',
      used_at: '2024-01-15T10:30:00Z',
    };

    it('should successfully use a coupon', (done) => {
      supabaseClientMock.rpc = jasmine
        .createSpy('rpc')
        .and.returnValue(Promise.resolve({ data: usedCoupon, error: null }));

      service.useCoupon(1, 'customer-uuid').subscribe({
        next: (coupon) => {
          expect(coupon).toEqual(usedCoupon);
          expect(coupon.status).toBe('used');
          expect(coupon.used_at).toBeTruthy();
          expect(service.isLoading()).toBe(false);
          expect(service.error()).toBeNull();
          expect(supabaseClientMock.rpc).toHaveBeenCalledWith('use_coupon', {
            p_coupon_id: 1,
            p_user_id: 'customer-uuid',
          });
          done();
        },
        error: done.fail,
      });
    });

    it('should set loading state during operation', (done) => {
      supabaseClientMock.rpc = jasmine
        .createSpy('rpc')
        .and.returnValue(Promise.resolve({ data: usedCoupon, error: null }));

      service.useCoupon(1, 'customer-uuid').subscribe({
        next: () => {
          expect(service.isLoading()).toBe(false);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle coupon not found error', (done) => {
      const notFoundError = { message: 'Coupon not found' };
      supabaseClientMock.rpc = jasmine
        .createSpy('rpc')
        .and.returnValue(Promise.resolve({ data: null, error: notFoundError }));

      service.useCoupon(999, 'customer-uuid').subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('Coupon not found');
          expect(service.isLoading()).toBe(false);
          expect(service.error()).toBeTruthy();
          done();
        },
      });
    });

    it('should handle already used coupon error', (done) => {
      const alreadyUsedError = { message: 'Coupon already used' };
      supabaseClientMock.rpc = jasmine
        .createSpy('rpc')
        .and.returnValue(Promise.resolve({ data: null, error: alreadyUsedError }));

      service.useCoupon(1, 'customer-uuid').subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('Coupon already used');
          expect(service.error()).toBeTruthy();
          done();
        },
      });
    });

    it('should handle expired coupon error', (done) => {
      const expiredError = { message: 'Coupon has expired' };
      supabaseClientMock.rpc = jasmine
        .createSpy('rpc')
        .and.returnValue(Promise.resolve({ data: null, error: expiredError }));

      service.useCoupon(1, 'customer-uuid').subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('Coupon has expired');
          expect(service.error()).toBeTruthy();
          done();
        },
      });
    });

    it('should handle user mismatch error', (done) => {
      const mismatchError = { message: 'Coupon does not belong to this user' };
      supabaseClientMock.rpc = jasmine
        .createSpy('rpc')
        .and.returnValue(Promise.resolve({ data: null, error: mismatchError }));

      service.useCoupon(1, 'wrong-user-id').subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('Coupon does not belong to this user');
          expect(service.error()).toBeTruthy();
          done();
        },
      });
    });

    it('should handle RPC failures', (done) => {
      supabaseClientMock.rpc = jasmine
        .createSpy('rpc')
        .and.returnValue(Promise.reject(new Error('Database unavailable')));

      service.useCoupon(1, 'customer-uuid').subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('Database unavailable');
          expect(service.isLoading()).toBe(false);
          done();
        },
      });
    });

    it('should handle negative coupon ID', (done) => {
      supabaseClientMock.rpc = jasmine
        .createSpy('rpc')
        .and.returnValue(Promise.resolve({ data: usedCoupon, error: null }));

      service.useCoupon(-1, 'customer-uuid').subscribe({
        next: () => {
          // Service doesn't validate input, delegates to database
          expect(supabaseClientMock.rpc).toHaveBeenCalledWith('use_coupon', {
            p_coupon_id: -1,
            p_user_id: 'customer-uuid',
          });
          done();
        },
        error: done.fail,
      });
    });

    it('should handle zero coupon ID', (done) => {
      supabaseClientMock.rpc = jasmine
        .createSpy('rpc')
        .and.returnValue(Promise.resolve({ data: usedCoupon, error: null }));

      service.useCoupon(0, 'customer-uuid').subscribe({
        next: () => {
          expect(supabaseClientMock.rpc).toHaveBeenCalledWith('use_coupon', {
            p_coupon_id: 0,
            p_user_id: 'customer-uuid',
          });
          done();
        },
        error: done.fail,
      });
    });

    it('should clear previous errors before new request', (done) => {
      supabaseClientMock.rpc = jasmine
        .createSpy('rpc')
        .and.returnValue(Promise.resolve({ data: usedCoupon, error: null }));
      service.error.set(new Error('Previous error'));

      service.useCoupon(1, 'customer-uuid').subscribe({
        next: () => {
          expect(service.error()).toBeNull();
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle null error message gracefully', (done) => {
      const errorWithoutMessage = { code: 'UNKNOWN_ERROR' };
      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine
              .createSpy('single')
              .and.returnValue(Promise.resolve({ data: null, error: errorWithoutMessage })),
          }),
        }),
      });

      service.getCustomerDetailsByShortId('ABC123').subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('Failed to fetch customer details');
          done();
        },
      });
    });

    it('should handle concurrent requests correctly', (done) => {
      let completedRequests = 0;
      const checkCompletion = () => {
        completedRequests++;
        if (completedRequests === 2) {
          expect(service.isLoading()).toBe(false);
          done();
        }
      };

      service.getCustomerDetailsByShortId('ABC123').subscribe({
        next: checkCompletion,
        error: done.fail,
      });

      service.getCustomerDetailsById('customer-uuid').subscribe({
        next: checkCompletion,
        error: done.fail,
      });
    });

    it('should maintain error state across failed operations', (done) => {
      const dbError = { message: 'Permission denied' };
      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine
              .createSpy('single')
              .and.returnValue(Promise.resolve({ data: null, error: dbError })),
          }),
        }),
      });

      service.getCustomerDetailsByShortId('ABC123').subscribe({
        next: () => done.fail('should not succeed'),
        error: () => {
          expect(service.error()).toBeTruthy();
          expect(service.error()?.message).toBe('Permission denied');
          done();
        },
      });
    });
  });

  describe('Business Rules Validation', () => {
    it('should accept valid short_id formats (6 characters)', (done) => {
      const validShortIds = ['ABC123', 'XYZ789', '123456', 'aB1Cd2'];
      let completedCount = 0;

      validShortIds.forEach((shortId) => {
        service.getCustomerDetailsByShortId(shortId).subscribe({
          next: (profile) => {
            expect(profile).toBeTruthy();
            expect(supabaseClientMock.from).toHaveBeenCalledWith('profiles');
            completedCount++;
            if (completedCount === validShortIds.length) {
              done();
            }
          },
          error: done.fail,
        });
      });
    });

    it('should delegate UUID validation to database layer', (done) => {
      const testUuids = ['customer-uuid', '550e8400-e29b-41d4-a716-446655440000', 'invalid-uuid'];
      let completedCount = 0;

      testUuids.forEach((uuid) => {
        service.getCustomerDetailsById(uuid).subscribe({
          next: (profile) => {
            expect(profile).toBeTruthy();
            expect(supabaseClientMock.from).toHaveBeenCalledWith('profiles');
            completedCount++;
            if (completedCount === testUuids.length) {
              done();
            }
          },
          error: done.fail,
        });
      });
    });

    it('should allow stamp counts in business range (1-10)', (done) => {
      const validCounts = [1, 5, 10];
      let completedCount = 0;

      validCounts.forEach((count) => {
        service.addStampsToCustomer('customer-uuid', count).subscribe({
          next: () => {
            expect(supabaseClientMock.rpc).toHaveBeenCalledWith('add_stamps_to_user', {
              p_user_id: 'customer-uuid',
              p_count: count,
            });
            completedCount++;
            if (completedCount === validCounts.length) {
              done();
            }
          },
          error: done.fail,
        });
      });
    });

    it('should handle coupon type variations', (done) => {
      supabaseClientMock.rpc = jasmine
        .createSpy('rpc')
        .and.returnValue(Promise.resolve({ data: mockCoupon, error: null }));

      const couponTypes = ['free_scoop', 'percentage', 'amount'];
      const expiryDate = '2024-12-31T23:59:59Z';
      let completedCount = 0;

      couponTypes.forEach((type) => {
        service.createManualCoupon('customer-uuid', type, null, expiryDate).subscribe({
          next: (coupon) => {
            expect(coupon).toBeTruthy();
            expect(supabaseClientMock.rpc).toHaveBeenCalledWith('create_manual_coupon', {
              p_user_id: 'customer-uuid',
              p_type: type,
              p_value: null,
              p_expires_at: expiryDate,
            });
            completedCount++;
            if (completedCount === couponTypes.length) {
              done();
            }
          },
          error: done.fail,
        });
      });
    });
  });
});
