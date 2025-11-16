import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CouponService } from './coupon.service';
import { AuthService } from './auth.service';
import { CouponDTO, CouponsListDTO, AddCouponFormViewModel } from '../types';
import { environment } from '../environment/environment';

describe('CouponService', () => {
  let service: CouponService;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let supabaseClientMock: any;
  let userSpy: jasmine.Spy;
  let sessionSpy: jasmine.Spy;
  let originalFetch: any;

  // Mock data
  const mockUser = {
    id: 'user-uuid-123',
    email: 'user@test.com',
  };

  const mockSession = {
    access_token: 'mock-access-token-abc123',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Date.now() + 3600000,
  };

  const mockCoupon: CouponDTO = {
    id: 1,
    user_id: 'user-uuid-123',
    type: 'free_scoop',
    value: null,
    status: 'active',
    expires_at: '2024-12-31T23:59:59Z',
    used_at: null,
    created_at: '2024-01-01T00:00:00Z',
  };

  const mockCoupons: CouponDTO[] = [
    mockCoupon,
    {
      id: 2,
      user_id: 'user-uuid-123',
      type: 'percentage',
      value: 15,
      status: 'active',
      expires_at: '2024-12-31T23:59:59Z',
      used_at: null,
      created_at: '2024-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    // Store original fetch
    originalFetch = window.fetch;

    // Create Supabase client mock
    supabaseClientMock = {
      from: jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: mockCoupon, error: null })
            ),
          }),
        }),
        update: jasmine.createSpy('update').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            eq: jasmine.createSpy('eq').and.returnValue({
              eq: jasmine.createSpy('eq').and.returnValue({
                select: jasmine.createSpy('select').and.returnValue({
                  single: jasmine.createSpy('single').and.returnValue(
                    Promise.resolve({ data: mockCoupon, error: null })
                  ),
                }),
              }),
            }),
          }),
        }),
        insert: jasmine.createSpy('insert').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: mockCoupon, error: null })
            ),
          }),
        }),
      }),
    };

    // Create AuthService mock with spies for user and session signals
    userSpy = jasmine.createSpy('user').and.returnValue(mockUser);
    sessionSpy = jasmine.createSpy('session').and.returnValue(mockSession);
    authServiceMock = jasmine.createSpyObj('AuthService', [], {
      client: supabaseClientMock,
      user: userSpy,
      session: sessionSpy,
    });

    TestBed.configureTestingModule({
      providers: [
        CouponService,
        { provide: AuthService, useValue: authServiceMock },
      ],
    });

    service = TestBed.inject(CouponService);

    // Mock window fetch
    window.fetch = jasmine.createSpy('fetch').and.returnValue(
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-range': '0-1/2' }),
        json: () => Promise.resolve(mockCoupons),
      } as Response)
    );
  });

  afterEach(() => {
    // Restore original fetch
    window.fetch = originalFetch;
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

  describe('getUserCoupons', () => {
    it('should successfully fetch user coupons', (done) => {
      service.getUserCoupons().subscribe({
        next: (result: CouponsListDTO) => {
          expect(result.coupons).toEqual(mockCoupons);
          expect(result.total).toBe(2);
          expect(result.limit).toBe(100);
          expect(result.offset).toBe(0);
          expect(service.isLoading()).toBe(false);
          expect(service.error()).toBeNull();
          expect(window.fetch).toHaveBeenCalledWith(
            `${environment.supabase.url}/rest/v1/coupons?user_id=eq.${mockUser.id}&select=*`,
            jasmine.objectContaining({
              method: 'GET',
              headers: jasmine.objectContaining({
                apikey: environment.supabase.anonKey,
                Authorization: `Bearer ${mockSession.access_token}`,
              }),
            })
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should apply custom pagination parameters', (done) => {
      const params = { limit: 10, offset: 5 };

      service.getUserCoupons(params).subscribe({
        next: (result: CouponsListDTO) => {
          expect(result.limit).toBe(10);
          expect(result.offset).toBe(5);
          done();
        },
        error: done.fail,
      });
    });

    it('should return error when user is not authenticated', (done) => {
      userSpy.and.returnValue(null);

      service.getUserCoupons().subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('User not authenticated');
          expect(service.isLoading()).toBe(false);
          done();
        },
      });
    });

    it('should return error when no active session', (done) => {
      sessionSpy.and.returnValue(null);

      service.getUserCoupons().subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('No active session');
          expect(service.isLoading()).toBe(false);
          done();
        },
      });
    });

    it('should handle HTTP error responses', (done) => {
      window.fetch = jasmine.createSpy('fetch').and.returnValue(
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        } as Response)
      );

      service.getUserCoupons().subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toContain('HTTP 500');
          expect(service.isLoading()).toBe(false);
          expect(service.error()).toBeTruthy();
          done();
        },
      });
    });

    it('should handle network errors', (done) => {
      window.fetch = jasmine.createSpy('fetch').and.returnValue(
        Promise.reject(new Error('Network error'))
      );

      service.getUserCoupons().subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('Network error');
          expect(service.isLoading()).toBe(false);
          expect(service.error()).toBeTruthy();
          done();
        },
      });
    });

    it('should handle timeout after 10 seconds', fakeAsync(() => {
      let errorOccurred = false;
      window.fetch = jasmine.createSpy('fetch').and.returnValue(
        new Promise((resolve) => {
          setTimeout(() => resolve({} as Response), 15000);
        })
      );

      service.getUserCoupons().subscribe({
        next: () => fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('Request timeout');
          errorOccurred = true;
        },
      });

      tick(10000);
      expect(errorOccurred).toBe(true);
    }));

    it('should parse content-range header correctly', (done) => {
      window.fetch = jasmine.createSpy('fetch').and.returnValue(
        Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-range': '0-9/25' }),
          json: () => Promise.resolve(mockCoupons),
        } as Response)
      );

      service.getUserCoupons().subscribe({
        next: (result: CouponsListDTO) => {
          expect(result.total).toBe(25);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle missing content-range header', (done) => {
      window.fetch = jasmine.createSpy('fetch').and.returnValue(
        Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: () => Promise.resolve(mockCoupons),
        } as Response)
      );

      service.getUserCoupons().subscribe({
        next: (result: CouponsListDTO) => {
          expect(result.total).toBe(mockCoupons.length);
          done();
        },
        error: done.fail,
      });
    });

    it('should clear previous errors before new request', (done) => {
      service.error.set(new Error('Previous error'));

      service.getUserCoupons().subscribe({
        next: () => {
          expect(service.error()).toBeNull();
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('getCouponById', () => {
    it('should successfully fetch coupon by ID', (done) => {
      service.getCouponById(1).subscribe({
        next: (coupon) => {
          expect(coupon).toEqual(mockCoupon);
          expect(service.isLoading()).toBe(false);
          expect(service.error()).toBeNull();
          expect(supabaseClientMock.from).toHaveBeenCalledWith('coupons');
          done();
        },
        error: done.fail,
      });
    });

    it('should set loading state during fetch', (done) => {
      service.getCouponById(1).subscribe({
        next: () => {
          expect(service.isLoading()).toBe(false);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle coupon not found error', (done) => {
      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: null, error: null })
            ),
          }),
        }),
      });

      service.getCouponById(999).subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('Coupon not found');
          expect(service.isLoading()).toBe(false);
          expect(service.error()).toBeTruthy();
          done();
        },
      });
    });

    it('should handle database errors', (done) => {
      const dbError = { message: 'Database connection failed' };
      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: null, error: dbError })
            ),
          }),
        }),
      });

      service.getCouponById(1).subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('Database connection failed');
          expect(service.isLoading()).toBe(false);
          expect(service.error()).toBeTruthy();
          done();
        },
      });
    });

    it('should handle negative coupon ID', (done) => {
      service.getCouponById(-1).subscribe({
        next: () => {
          expect(supabaseClientMock.from).toHaveBeenCalledWith('coupons');
          done();
        },
        error: done.fail,
      });
    });

    it('should handle zero coupon ID', (done) => {
      service.getCouponById(0).subscribe({
        next: () => {
          expect(supabaseClientMock.from).toHaveBeenCalledWith('coupons');
          done();
        },
        error: done.fail,
      });
    });

    it('should clear previous errors before new request', (done) => {
      service.error.set(new Error('Previous error'));

      service.getCouponById(1).subscribe({
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

    beforeEach(() => {
      // Reset the mock for useCoupon tests
      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        update: jasmine.createSpy('update').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            eq: jasmine.createSpy('eq').and.returnValue({
              eq: jasmine.createSpy('eq').and.returnValue({
                select: jasmine.createSpy('select').and.returnValue({
                  single: jasmine.createSpy('single').and.returnValue(
                    Promise.resolve({ data: usedCoupon, error: null })
                  ),
                }),
              }),
            }),
          }),
        }),
      });
    });

    it('should successfully use a coupon', (done) => {
      service.useCoupon(1).subscribe({
        next: (coupon) => {
          expect(coupon.status).toBe('used');
          expect(coupon.used_at).toBeTruthy();
          expect(service.isLoading()).toBe(false);
          expect(service.error()).toBeNull();
          expect(supabaseClientMock.from).toHaveBeenCalledWith('coupons');
          done();
        },
        error: done.fail,
      });
    });

    it('should set loading state during operation', (done) => {
      service.useCoupon(1).subscribe({
        next: () => {
          expect(service.isLoading()).toBe(false);
          done();
        },
        error: done.fail,
      });
    });

    it('should return error when user is not authenticated', (done) => {
      userSpy.and.returnValue(null);

      service.useCoupon(1).subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('User not authenticated');
          expect(service.isLoading()).toBe(false);
          done();
        },
      });
    });

    it('should handle coupon not found error', (done) => {
      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        update: jasmine.createSpy('update').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            eq: jasmine.createSpy('eq').and.returnValue({
              eq: jasmine.createSpy('eq').and.returnValue({
                select: jasmine.createSpy('select').and.returnValue({
                  single: jasmine.createSpy('single').and.returnValue(
                    Promise.resolve({ data: null, error: null })
                  ),
                }),
              }),
            }),
          }),
        }),
      });

      service.useCoupon(999).subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('Coupon not found or already used');
          expect(service.isLoading()).toBe(false);
          expect(service.error()).toBeTruthy();
          done();
        },
      });
    });

    it('should handle database errors', (done) => {
      const dbError = { message: 'Permission denied' };
      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        update: jasmine.createSpy('update').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            eq: jasmine.createSpy('eq').and.returnValue({
              eq: jasmine.createSpy('eq').and.returnValue({
                select: jasmine.createSpy('select').and.returnValue({
                  single: jasmine.createSpy('single').and.returnValue(
                    Promise.resolve({ data: null, error: dbError })
                  ),
                }),
              }),
            }),
          }),
        }),
      });

      service.useCoupon(1).subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('Permission denied');
          expect(service.isLoading()).toBe(false);
          expect(service.error()).toBeTruthy();
          done();
        },
      });
    });

    it('should include user_id in update query', (done) => {
      const updateSpy = jasmine.createSpy('update').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            eq: jasmine.createSpy('eq').and.returnValue({
              select: jasmine.createSpy('select').and.returnValue({
                single: jasmine.createSpy('single').and.returnValue(
                  Promise.resolve({ data: usedCoupon, error: null })
                ),
              }),
            }),
          }),
        }),
      });

      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        update: updateSpy,
      });

      service.useCoupon(1).subscribe({
        next: () => {
          expect(updateSpy).toHaveBeenCalledWith(
            jasmine.objectContaining({
              status: 'used',
              used_at: jasmine.any(String),
            })
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should only update active coupons', (done) => {
      service.useCoupon(1).subscribe({
        next: () => {
          expect(supabaseClientMock.from).toHaveBeenCalledWith('coupons');
          done();
        },
        error: done.fail,
      });
    });

    it('should handle negative coupon ID', (done) => {
      service.useCoupon(-1).subscribe({
        next: () => {
          expect(supabaseClientMock.from).toHaveBeenCalledWith('coupons');
          done();
        },
        error: done.fail,
      });
    });

    it('should clear previous errors before new request', (done) => {
      service.error.set(new Error('Previous error'));

      service.useCoupon(1).subscribe({
        next: () => {
          expect(service.error()).toBeNull();
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('addCoupon', () => {
    const formData: AddCouponFormViewModel = {
      short_id: 'ABC123',
      type: 'free_scoop',
      value: 0,
      expires_at: '2024-12-31',
    };

    const mockProfile = {
      id: 'customer-uuid',
    };

    beforeEach(() => {
      // Reset the mock for addCoupon tests - two-step process
      const insertMock = {
        select: jasmine.createSpy('select').and.returnValue({
          single: jasmine.createSpy('single').and.returnValue(
            Promise.resolve({ data: mockCoupon, error: null })
          ),
        }),
      };

      const profileSelectMock = {
        eq: jasmine.createSpy('eq').and.returnValue({
          single: jasmine.createSpy('single').and.returnValue(
            Promise.resolve({ data: mockProfile, error: null })
          ),
        }),
      };

      let callCount = 0;
      supabaseClientMock.from = jasmine.createSpy('from').and.callFake((table: string) => {
        callCount++;
        if (table === 'profiles' || callCount === 1) {
          return {
            select: jasmine.createSpy('select').and.returnValue(profileSelectMock),
          };
        } else {
          return {
            insert: jasmine.createSpy('insert').and.returnValue(insertMock),
          };
        }
      });
    });

    it('should successfully add a coupon', (done) => {
      service.addCoupon(formData).subscribe({
        next: (coupon) => {
          expect(coupon).toEqual(mockCoupon);
          expect(service.isLoading()).toBe(false);
          expect(service.error()).toBeNull();
          done();
        },
        error: done.fail,
      });
    });

    it('should set loading state during operation', (done) => {
      service.addCoupon(formData).subscribe({
        next: () => {
          expect(service.isLoading()).toBe(false);
          done();
        },
        error: done.fail,
      });
    });

    it('should return error when admin is not authenticated', (done) => {
      userSpy.and.returnValue(null);

      service.addCoupon(formData).subscribe({
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
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: null, error: null })
            ),
          }),
        }),
      });

      service.addCoupon(formData).subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('Nie znaleziono klienta o podanym ID');
          expect(service.isLoading()).toBe(false);
          expect(service.error()).toBeTruthy();
          done();
        },
      });
    });

    it('should handle profile lookup errors', (done) => {
      const profileError = { message: 'Database error' };
      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: null, error: profileError })
            ),
          }),
        }),
      });

      service.addCoupon(formData).subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('Database error');
          expect(service.isLoading()).toBe(false);
          expect(service.error()).toBeTruthy();
          done();
        },
      });
    });

    it('should handle coupon creation errors', (done) => {
      const insertError = { message: 'Insert failed' };
      const profileSelectMock = {
        eq: jasmine.createSpy('eq').and.returnValue({
          single: jasmine.createSpy('single').and.returnValue(
            Promise.resolve({ data: mockProfile, error: null })
          ),
        }),
      };

      const insertMock = {
        select: jasmine.createSpy('select').and.returnValue({
          single: jasmine.createSpy('single').and.returnValue(
            Promise.resolve({ data: null, error: insertError })
          ),
        }),
      };

      let callCount = 0;
      supabaseClientMock.from = jasmine.createSpy('from').and.callFake((table: string) => {
        callCount++;
        if (table === 'profiles' || callCount === 1) {
          return {
            select: jasmine.createSpy('select').and.returnValue(profileSelectMock),
          };
        } else {
          return {
            insert: jasmine.createSpy('insert').and.returnValue(insertMock),
          };
        }
      });

      service.addCoupon(formData).subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('Insert failed');
          expect(service.isLoading()).toBe(false);
          expect(service.error()).toBeTruthy();
          done();
        },
      });
    });

    it('should convert date to ISO format', (done) => {
      const insertSpy = jasmine.createSpy('insert').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          single: jasmine.createSpy('single').and.returnValue(
            Promise.resolve({ data: mockCoupon, error: null })
          ),
        }),
      });

      const profileSelectMock = {
        eq: jasmine.createSpy('eq').and.returnValue({
          single: jasmine.createSpy('single').and.returnValue(
            Promise.resolve({ data: mockProfile, error: null })
          ),
        }),
      };

      let callCount = 0;
      supabaseClientMock.from = jasmine.createSpy('from').and.callFake((table: string) => {
        callCount++;
        if (table === 'profiles' || callCount === 1) {
          return {
            select: jasmine.createSpy('select').and.returnValue(profileSelectMock),
          };
        } else {
          return {
            insert: insertSpy,
          };
        }
      });

      service.addCoupon(formData).subscribe({
        next: () => {
          expect(insertSpy).toHaveBeenCalledWith(
            jasmine.objectContaining({
              expires_at: jasmine.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
            })
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should set coupon status to active', (done) => {
      const insertSpy = jasmine.createSpy('insert').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          single: jasmine.createSpy('single').and.returnValue(
            Promise.resolve({ data: mockCoupon, error: null })
          ),
        }),
      });

      const profileSelectMock = {
        eq: jasmine.createSpy('eq').and.returnValue({
          single: jasmine.createSpy('single').and.returnValue(
            Promise.resolve({ data: mockProfile, error: null })
          ),
        }),
      };

      let callCount = 0;
      supabaseClientMock.from = jasmine.createSpy('from').and.callFake((table: string) => {
        callCount++;
        if (table === 'profiles' || callCount === 1) {
          return {
            select: jasmine.createSpy('select').and.returnValue(profileSelectMock),
          };
        } else {
          return {
            insert: insertSpy,
          };
        }
      });

      service.addCoupon(formData).subscribe({
        next: () => {
          expect(insertSpy).toHaveBeenCalledWith(
            jasmine.objectContaining({
              status: 'active',
            })
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should handle different coupon types', (done) => {
      const percentageFormData: AddCouponFormViewModel = {
        short_id: 'ABC123',
        type: 'percentage',
        value: 15,
        expires_at: '2024-12-31',
      };

      service.addCoupon(percentageFormData).subscribe({
        next: (coupon) => {
          expect(coupon).toBeTruthy();
          done();
        },
        error: done.fail,
      });
    });

    it('should handle empty short_id', (done) => {
      const invalidFormData: AddCouponFormViewModel = {
        short_id: '',
        type: 'free_scoop',
        value: 0,
        expires_at: '2024-12-31',
      };

      service.addCoupon(invalidFormData).subscribe({
        next: () => {
          expect(supabaseClientMock.from).toHaveBeenCalledWith('profiles');
          done();
        },
        error: done.fail,
      });
    });

    it('should clear previous errors before new request', (done) => {
      service.error.set(new Error('Previous error'));

      service.addCoupon(formData).subscribe({
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
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: null, error: errorWithoutMessage })
            ),
          }),
        }),
      });

      service.getCouponById(1).subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('Failed to fetch coupon');
          done();
        },
      });
    });

    it('should maintain error state across failed operations', (done) => {
      const dbError = { message: 'Connection lost' };
      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: null, error: dbError })
            ),
          }),
        }),
      });

      service.getCouponById(1).subscribe({
        next: () => done.fail('should not succeed'),
        error: () => {
          expect(service.error()).toBeTruthy();
          expect(service.error()?.message).toBe('Connection lost');
          done();
        },
      });
    });
  });

  describe('Business Rules Validation', () => {
    it('should handle valid coupon types', (done) => {
      const couponTypes: Array<'free_scoop' | 'percentage' | 'amount'> = [
        'free_scoop',
        'percentage',
        'amount',
      ];
      let completedCount = 0;

      couponTypes.forEach((type) => {
        const formData: AddCouponFormViewModel = {
          short_id: 'ABC123',
          type: type,
          value: type === 'free_scoop' ? 0 : 15,
          expires_at: '2024-12-31',
        };

        service.addCoupon(formData).subscribe({
          next: (coupon) => {
            expect(coupon).toBeTruthy();
            expect(supabaseClientMock.from).toHaveBeenCalled();
            completedCount++;
            if (completedCount === couponTypes.length) {
              done();
            }
          },
          error: done.fail,
        });
      });
    });

    it('should validate short_id format during addCoupon', (done) => {
      const shortIds = ['ABC123', 'XYZ789', '123456'];
      let completedCount = 0;

      shortIds.forEach((shortId) => {
        const formData: AddCouponFormViewModel = {
          short_id: shortId,
          type: 'free_scoop',
          value: 0,
          expires_at: '2024-12-31',
        };

        service.addCoupon(formData).subscribe({
          next: (coupon) => {
            expect(coupon).toBeTruthy();
            expect(supabaseClientMock.from).toHaveBeenCalledWith('profiles');
            completedCount++;
            if (completedCount === shortIds.length) {
              done();
            }
          },
          error: done.fail,
        });
      });
    });
  });
});
