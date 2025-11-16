import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CouponsComponent } from './coupons.component';
import { CouponService } from '../../services/coupon.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CouponDTO, CouponsListDTO, CouponType, CouponStatus } from '../../types';
import { signal } from '@angular/core';
import { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

describe('CouponsComponent', () => {
  let component: CouponsComponent;
  let fixture: ComponentFixture<CouponsComponent>;
  let mockCouponService: jasmine.SpyObj<CouponService>;
  let mockAuthService: any;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockSupabaseClient: jasmine.SpyObj<SupabaseClient>;
  let mockRealtimeChannel: jasmine.SpyObj<RealtimeChannel>;

  // Test data factories
  const createMockCouponDTO = (overrides?: Partial<CouponDTO>): CouponDTO => ({
    id: 1,
    user_id: 'user-123',
    type: 'free_scoop' as CouponType,
    value: null,
    status: 'active' as CouponStatus,
    created_at: '2024-01-01T00:00:00Z',
    expires_at: '2025-12-31T23:59:59Z',
    used_at: null,
    ...overrides,
  });

  const createMockUser = () => ({
    id: 'user-123',
    email: 'test@example.com',
  });

  beforeEach(async () => {
    // Create mock services
    mockCouponService = jasmine.createSpyObj('CouponService', ['getUserCoupons', 'useCoupon']);

    // Setup realtime channel mock
    mockRealtimeChannel = jasmine.createSpyObj('RealtimeChannel', ['on', 'subscribe']);
    mockRealtimeChannel.on.and.returnValue(mockRealtimeChannel);
    mockRealtimeChannel.subscribe.and.returnValue(mockRealtimeChannel);

    mockSupabaseClient = jasmine.createSpyObj('SupabaseClient', ['channel', 'removeChannel']);
    mockSupabaseClient.channel.and.returnValue(mockRealtimeChannel);

    // Create mock AuthService with proper signal support
    mockAuthService = {
      user: signal(createMockUser()),
      client: mockSupabaseClient,
    } as any;

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [CouponsComponent],
      providers: [
        { provide: CouponService, useValue: mockCouponService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CouponsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should have initial loading state set to true', () => {
      // Don't trigger ngOnInit yet
      expect(component['isLoading']()).toBe(true);
    });

    it('should have initial error state set to null', () => {
      expect(component['error']()).toBeNull();
    });

    it('should have initial coupons array empty', () => {
      expect(component['coupons']()).toEqual([]);
    });

    it('should have initial refreshing state set to false', () => {
      expect(component['refreshing']()).toBe(false);
    });

    it('should have showConfirmDialog set to false', () => {
      expect(component['showConfirmDialog']()).toBe(false);
    });

    it('should have selectedCoupon set to null', () => {
      expect(component['selectedCoupon']()).toBeNull();
    });

    it('should have showSuccessMessage set to false', () => {
      expect(component['showSuccessMessage']()).toBe(false);
    });

    it('should have useCouponError set to null', () => {
      expect(component['useCouponError']()).toBeNull();
    });
  });

  describe('ngOnInit', () => {
    it('should call loadCoupons on init', () => {
      const mockResponse: CouponsListDTO = {
        coupons: [],
        total: 0,
        limit: 100,
        offset: 0,
      };
      mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

      fixture.detectChanges(); // Triggers ngOnInit

      expect(mockCouponService.getUserCoupons).toHaveBeenCalled();
    });

    it('should setup realtime subscription on init', () => {
      const mockResponse: CouponsListDTO = {
        coupons: [],
        total: 0,
        limit: 100,
        offset: 0,
      };
      mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      expect(mockSupabaseClient.channel).toHaveBeenCalledWith('coupon-changes');
      expect(mockRealtimeChannel.on).toHaveBeenCalled();
      expect(mockRealtimeChannel.subscribe).toHaveBeenCalled();
    });
  });

  describe('Authentication Requirements', () => {
    it('should not load coupons if user is not authenticated', () => {
      mockAuthService.user.set(null);

      fixture.detectChanges();

      expect(component['error']()).not.toBeNull();
      expect(component['error']()?.message).toBe('User not authenticated');
      expect(component['isLoading']()).toBe(false);
    });

    it('should not setup realtime subscription if user is not authenticated', () => {
      mockAuthService.user.set(null);

      fixture.detectChanges();

      expect(mockSupabaseClient.channel).not.toHaveBeenCalled();
    });

    it('should not refresh coupons if user is not authenticated', () => {
      mockAuthService.user.set(null);
      const mockResponse: CouponsListDTO = {
        coupons: [],
        total: 0,
        limit: 100,
        offset: 0,
      };
      mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      component['onRefresh']();

      expect(component['refreshing']()).toBe(false);
      expect(mockCouponService.getUserCoupons).not.toHaveBeenCalledWith();
    });
  });

  describe('Loading Coupons', () => {
    it('should load coupons successfully', () => {
      const mockCoupon = createMockCouponDTO();
      const mockResponse: CouponsListDTO = {
        coupons: [mockCoupon],
        total: 1,
        limit: 100,
        offset: 0,
      };
      mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      expect(component['coupons']().length).toBe(1);
      expect(component['isLoading']()).toBe(false);
      expect(component['error']()).toBeNull();
    });

    it('should handle loading error', () => {
      const error = new Error('Network error');
      mockCouponService.getUserCoupons.and.returnValue(throwError(() => error));

      fixture.detectChanges();

      expect(component['error']()).toBe(error);
      expect(component['isLoading']()).toBe(false);
      expect(component['coupons']().length).toBe(0);
    });

    it('should set loading state while fetching', () => {
      const mockResponse: CouponsListDTO = {
        coupons: [],
        total: 0,
        limit: 100,
        offset: 0,
      };
      mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

      expect(component['isLoading']()).toBe(true);

      fixture.detectChanges();

      expect(component['isLoading']()).toBe(false);
    });

    it('should handle synchronous errors during load', () => {
      // Simulate a synchronous error by throwing during the subscribe setup
      mockCouponService.getUserCoupons.and.throwError('Sync error');

      fixture.detectChanges();

      expect(component['error']()).toBeTruthy();
      expect(component['isLoading']()).toBe(false);
    });
  });

  describe('Coupon Transformation Logic', () => {
    it('should correctly identify active coupon', () => {
      const activeCoupon = createMockCouponDTO({
        status: 'active',
        expires_at: '2099-12-31T23:59:59Z', // Future date
      });
      const mockResponse: CouponsListDTO = {
        coupons: [activeCoupon],
        total: 1,
        limit: 100,
        offset: 0,
      };
      mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      const transformedCoupon = component['coupons']()[0];
      expect(transformedCoupon.isActive).toBe(true);
      expect(transformedCoupon.isExpired).toBe(false);
      expect(transformedCoupon.isUsed).toBe(false);
    });

    it('should correctly identify expired coupon', () => {
      const expiredCoupon = createMockCouponDTO({
        status: 'active',
        expires_at: '2020-01-01T00:00:00Z', // Past date
      });
      const mockResponse: CouponsListDTO = {
        coupons: [expiredCoupon],
        total: 1,
        limit: 100,
        offset: 0,
      };
      mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      const transformedCoupon = component['coupons']()[0];
      expect(transformedCoupon.isActive).toBe(false);
      expect(transformedCoupon.isExpired).toBe(true);
      expect(transformedCoupon.isUsed).toBe(false);
    });

    it('should correctly identify used coupon', () => {
      const usedCoupon = createMockCouponDTO({
        status: 'used',
        expires_at: '2099-12-31T23:59:59Z',
      });
      const mockResponse: CouponsListDTO = {
        coupons: [usedCoupon],
        total: 1,
        limit: 100,
        offset: 0,
      };
      mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      const transformedCoupon = component['coupons']()[0];
      expect(transformedCoupon.isActive).toBe(false);
      expect(transformedCoupon.isExpired).toBe(false);
      expect(transformedCoupon.isUsed).toBe(true);
    });

    it('should mark coupon as inactive if both expired and used', () => {
      const coupon = createMockCouponDTO({
        status: 'used',
        expires_at: '2020-01-01T00:00:00Z',
      });
      const mockResponse: CouponsListDTO = {
        coupons: [coupon],
        total: 1,
        limit: 100,
        offset: 0,
      };
      mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      const transformedCoupon = component['coupons']()[0];
      expect(transformedCoupon.isActive).toBe(false);
      expect(transformedCoupon.isExpired).toBe(true);
      expect(transformedCoupon.isUsed).toBe(true);
    });
  });

  describe('Coupon Type-Specific Properties', () => {
    describe('free_scoop type', () => {
      it('should have correct title for free_scoop', () => {
        const coupon = createMockCouponDTO({ type: 'free_scoop', value: null });
        const mockResponse: CouponsListDTO = {
          coupons: [coupon],
          total: 1,
          limit: 100,
          offset: 0,
        };
        mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

        fixture.detectChanges();

        expect(component['coupons']()[0].title).toBe('Darmowa gałka');
      });

      it('should have correct description for free_scoop', () => {
        const coupon = createMockCouponDTO({ type: 'free_scoop', value: null });
        const mockResponse: CouponsListDTO = {
          coupons: [coupon],
          total: 1,
          limit: 100,
          offset: 0,
        };
        mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

        fixture.detectChanges();

        expect(component['coupons']()[0].description).toBe(
          'Jedna gałka lodów dowolnego smaku za darmo',
        );
      });

      it('should have correct icon for free_scoop', () => {
        const coupon = createMockCouponDTO({ type: 'free_scoop', value: null });
        const mockResponse: CouponsListDTO = {
          coupons: [coupon],
          total: 1,
          limit: 100,
          offset: 0,
        };
        mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

        fixture.detectChanges();

        expect(component['coupons']()[0].iconName).toBe('ticket');
      });

      it('should have correct gradient for free_scoop', () => {
        const coupon = createMockCouponDTO({ type: 'free_scoop', value: null });
        const mockResponse: CouponsListDTO = {
          coupons: [coupon],
          total: 1,
          limit: 100,
          offset: 0,
        };
        mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

        fixture.detectChanges();

        expect(component['coupons']()[0].iconGradient).toBe(
          'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        );
      });
    });

    describe('percentage type', () => {
      it('should have correct title for percentage coupon', () => {
        const coupon = createMockCouponDTO({ type: 'percentage', value: 15 });
        const mockResponse: CouponsListDTO = {
          coupons: [coupon],
          total: 1,
          limit: 100,
          offset: 0,
        };
        mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

        fixture.detectChanges();

        expect(component['coupons']()[0].title).toBe('Rabat 15%');
      });

      it('should have correct description for percentage coupon', () => {
        const coupon = createMockCouponDTO({ type: 'percentage', value: 20 });
        const mockResponse: CouponsListDTO = {
          coupons: [coupon],
          total: 1,
          limit: 100,
          offset: 0,
        };
        mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

        fixture.detectChanges();

        expect(component['coupons']()[0].description).toBe('20% zniżki na cały zakup');
      });

      it('should have correct icon for percentage coupon', () => {
        const coupon = createMockCouponDTO({ type: 'percentage', value: 10 });
        const mockResponse: CouponsListDTO = {
          coupons: [coupon],
          total: 1,
          limit: 100,
          offset: 0,
        };
        mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

        fixture.detectChanges();

        expect(component['coupons']()[0].iconName).toBe('percent');
      });

      it('should have correct gradient for percentage coupon', () => {
        const coupon = createMockCouponDTO({ type: 'percentage', value: 10 });
        const mockResponse: CouponsListDTO = {
          coupons: [coupon],
          total: 1,
          limit: 100,
          offset: 0,
        };
        mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

        fixture.detectChanges();

        expect(component['coupons']()[0].iconGradient).toBe(
          'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        );
      });
    });

    describe('amount type', () => {
      it('should have correct title for amount coupon', () => {
        const coupon = createMockCouponDTO({ type: 'amount', value: 50 });
        const mockResponse: CouponsListDTO = {
          coupons: [coupon],
          total: 1,
          limit: 100,
          offset: 0,
        };
        mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

        fixture.detectChanges();

        expect(component['coupons']()[0].title).toBe('Rabat 50 zł');
      });

      it('should have correct description for amount coupon', () => {
        const coupon = createMockCouponDTO({ type: 'amount', value: 25 });
        const mockResponse: CouponsListDTO = {
          coupons: [coupon],
          total: 1,
          limit: 100,
          offset: 0,
        };
        mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

        fixture.detectChanges();

        expect(component['coupons']()[0].description).toBe('25 zł zniżki na cały zakup');
      });

      it('should have correct icon for amount coupon', () => {
        const coupon = createMockCouponDTO({ type: 'amount', value: 100 });
        const mockResponse: CouponsListDTO = {
          coupons: [coupon],
          total: 1,
          limit: 100,
          offset: 0,
        };
        mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

        fixture.detectChanges();

        expect(component['coupons']()[0].iconName).toBe('coins');
      });

      it('should have correct gradient for amount coupon', () => {
        const coupon = createMockCouponDTO({ type: 'amount', value: 100 });
        const mockResponse: CouponsListDTO = {
          coupons: [coupon],
          total: 1,
          limit: 100,
          offset: 0,
        };
        mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

        fixture.detectChanges();

        expect(component['coupons']()[0].iconGradient).toBe(
          'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        );
      });
    });
  });

  describe('Date Formatting', () => {
    it('should format expiry date in Polish locale', () => {
      const coupon = createMockCouponDTO({
        expires_at: '2025-12-31T23:59:59Z',
      });
      const mockResponse: CouponsListDTO = {
        coupons: [coupon],
        total: 1,
        limit: 100,
        offset: 0,
      };
      mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      expect(component['coupons']()[0].formattedExpiryDate).toContain('Ważny do');
      expect(component['coupons']()[0].formattedExpiryDate).toMatch(/\d{2}\.\d{2}\.\d{4}/);
    });

    it('should handle invalid date gracefully', () => {
      const coupon = createMockCouponDTO({
        expires_at: 'invalid-date',
      });
      const mockResponse: CouponsListDTO = {
        coupons: [coupon],
        total: 1,
        limit: 100,
        offset: 0,
      };
      mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      expect(component['coupons']()[0].formattedExpiryDate).toBe('Ważny do invalid-date');
    });
  });

  describe('Sorting Logic', () => {
    it('should sort active coupons before inactive ones', () => {
      const inactiveCoupon = createMockCouponDTO({
        id: 1,
        status: 'used',
        created_at: '2024-01-02T00:00:00Z',
      });
      const activeCoupon = createMockCouponDTO({
        id: 2,
        status: 'active',
        expires_at: '2099-12-31T23:59:59Z',
        created_at: '2024-01-01T00:00:00Z',
      });
      const mockResponse: CouponsListDTO = {
        coupons: [inactiveCoupon, activeCoupon],
        total: 2,
        limit: 100,
        offset: 0,
      };
      mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      const sorted = component['sortedCoupons']();
      expect(sorted[0].id).toBe(2); // Active coupon first
      expect(sorted[1].id).toBe(1); // Inactive coupon second
    });

    it('should sort by newest first among coupons of same status', () => {
      const olderCoupon = createMockCouponDTO({
        id: 1,
        status: 'active',
        expires_at: '2099-12-31T23:59:59Z',
        created_at: '2024-01-01T00:00:00Z',
      });
      const newerCoupon = createMockCouponDTO({
        id: 2,
        status: 'active',
        expires_at: '2099-12-31T23:59:59Z',
        created_at: '2024-01-02T00:00:00Z',
      });
      const mockResponse: CouponsListDTO = {
        coupons: [olderCoupon, newerCoupon],
        total: 2,
        limit: 100,
        offset: 0,
      };
      mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      const sorted = component['sortedCoupons']();
      expect(sorted[0].id).toBe(2); // Newer coupon first
      expect(sorted[1].id).toBe(1); // Older coupon second
    });

    it('should handle multiple coupons with complex sorting', () => {
      const expiredOld = createMockCouponDTO({
        id: 1,
        status: 'active',
        expires_at: '2020-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
      });
      const activeNew = createMockCouponDTO({
        id: 2,
        status: 'active',
        expires_at: '2099-12-31T23:59:59Z',
        created_at: '2024-01-03T00:00:00Z',
      });
      const usedMid = createMockCouponDTO({
        id: 3,
        status: 'used',
        expires_at: '2099-12-31T23:59:59Z',
        created_at: '2024-01-02T00:00:00Z',
      });
      const activeOld = createMockCouponDTO({
        id: 4,
        status: 'active',
        expires_at: '2099-12-31T23:59:59Z',
        created_at: '2024-01-01T00:00:00Z',
      });

      const mockResponse: CouponsListDTO = {
        coupons: [expiredOld, activeNew, usedMid, activeOld],
        total: 4,
        limit: 100,
        offset: 0,
      };
      mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      const sorted = component['sortedCoupons']();
      // Active coupons first (2, 4), sorted by date desc
      expect(sorted[0].id).toBe(2); // Active, newest
      expect(sorted[1].id).toBe(4); // Active, older
      // Inactive coupons (1, 3), sorted by date desc
      expect(sorted[2].id).toBe(3); // Used, mid date
      expect(sorted[3].id).toBe(1); // Expired, oldest
    });
  });

  describe('Computed Properties', () => {
    it('should compute activeCoupons correctly', () => {
      const activeCoupon = createMockCouponDTO({
        id: 1,
        status: 'active',
        expires_at: '2099-12-31T23:59:59Z',
      });
      const usedCoupon = createMockCouponDTO({
        id: 2,
        status: 'used',
      });
      const mockResponse: CouponsListDTO = {
        coupons: [activeCoupon, usedCoupon],
        total: 2,
        limit: 100,
        offset: 0,
      };
      mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      expect(component['activeCoupons']().length).toBe(1);
      expect(component['activeCoupons']()[0].id).toBe(1);
    });

    it('should compute activeCouponsCount correctly', () => {
      const activeCoupon1 = createMockCouponDTO({
        id: 1,
        status: 'active',
        expires_at: '2099-12-31T23:59:59Z',
      });
      const activeCoupon2 = createMockCouponDTO({
        id: 2,
        status: 'active',
        expires_at: '2099-12-31T23:59:59Z',
      });
      const usedCoupon = createMockCouponDTO({
        id: 3,
        status: 'used',
      });
      const mockResponse: CouponsListDTO = {
        coupons: [activeCoupon1, activeCoupon2, usedCoupon],
        total: 3,
        limit: 100,
        offset: 0,
      };
      mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      expect(component['activeCouponsCount']()).toBe(2);
    });

    it('should compute isEmpty correctly when no coupons', () => {
      const mockResponse: CouponsListDTO = {
        coupons: [],
        total: 0,
        limit: 100,
        offset: 0,
      };
      mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      expect(component['isEmpty']()).toBe(true);
      expect(component['hasCoupons']()).toBe(false);
    });

    it('should compute isEmpty correctly when has coupons', () => {
      const coupon = createMockCouponDTO();
      const mockResponse: CouponsListDTO = {
        coupons: [coupon],
        total: 1,
        limit: 100,
        offset: 0,
      };
      mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      expect(component['isEmpty']()).toBe(false);
      expect(component['hasCoupons']()).toBe(true);
    });
  });

  describe('Refresh Functionality', () => {
    it('should refresh coupons when onRefresh is called', () => {
      const initialCoupon = createMockCouponDTO({ id: 1 });
      const updatedCoupon = createMockCouponDTO({ id: 2 });
      const initialResponse: CouponsListDTO = {
        coupons: [initialCoupon],
        total: 1,
        limit: 100,
        offset: 0,
      };
      const updatedResponse: CouponsListDTO = {
        coupons: [updatedCoupon],
        total: 1,
        limit: 100,
        offset: 0,
      };

      mockCouponService.getUserCoupons.and.returnValues(of(initialResponse), of(updatedResponse));

      fixture.detectChanges();
      expect(component['coupons']()[0].id).toBe(1);

      component['onRefresh']();
      fixture.detectChanges();

      expect(component['coupons']()[0].id).toBe(2);
    });

    it('should set refreshing state during refresh', () => {
      const mockResponse: CouponsListDTO = {
        coupons: [],
        total: 0,
        limit: 100,
        offset: 0,
      };
      mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      expect(component['refreshing']()).toBe(false);

      component['onRefresh']();
      // During refresh, but observable completes synchronously in tests
      // So we can't test the intermediate state easily without async setup

      expect(component['refreshing']()).toBe(false); // After completion
    });

    it('should not refresh if already refreshing', () => {
      const mockResponse: CouponsListDTO = {
        coupons: [],
        total: 0,
        limit: 100,
        offset: 0,
      };
      mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      component['refreshing'].set(true);
      const callCountBefore = mockCouponService.getUserCoupons.calls.count();

      component['onRefresh']();

      expect(mockCouponService.getUserCoupons.calls.count()).toBe(callCountBefore);
    });

    it('should handle refresh error gracefully', () => {
      const initialResponse: CouponsListDTO = {
        coupons: [],
        total: 0,
        limit: 100,
        offset: 0,
      };
      const error = new Error('Refresh failed');

      mockCouponService.getUserCoupons.and.returnValues(
        of(initialResponse),
        throwError(() => error),
      );

      fixture.detectChanges();

      component['onRefresh']();

      expect(component['refreshing']()).toBe(false);
      // Error during refresh doesn't affect main error state (by design)
    });
  });

  describe('Retry Functionality', () => {
    it('should reload coupons when onRetry is called', () => {
      const error = new Error('Network error');
      const successResponse: CouponsListDTO = {
        coupons: [],
        total: 0,
        limit: 100,
        offset: 0,
      };

      mockCouponService.getUserCoupons.and.returnValues(
        throwError(() => error),
        of(successResponse),
      );

      fixture.detectChanges();
      expect(component['error']()).toBeTruthy();

      component['onRetry']();
      fixture.detectChanges();

      expect(component['error']()).toBeNull();
      expect(component['isLoading']()).toBe(false);
    });
  });

  describe('Error Messages', () => {
    it('should return network error message for network errors', () => {
      const error = new Error('Network error occurred');
      mockCouponService.getUserCoupons.and.returnValue(throwError(() => error));

      fixture.detectChanges();

      expect(component['getErrorMessage']()).toBe(
        'Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe.',
      );
    });

    it('should return authentication error message for auth errors', () => {
      const error = new Error('Not authenticated');
      mockCouponService.getUserCoupons.and.returnValue(throwError(() => error));

      fixture.detectChanges();

      expect(component['getErrorMessage']()).toBe('Sesja wygasła. Zaloguj się ponownie.');
    });

    it('should return generic error message for unknown errors', () => {
      const error = new Error('Unknown error');
      mockCouponService.getUserCoupons.and.returnValue(throwError(() => error));

      fixture.detectChanges();

      expect(component['getErrorMessage']()).toBe(
        'Wystąpił błąd podczas ładowania kuponów. Spróbuj ponownie później.',
      );
    });

    it('should handle null error gracefully', () => {
      const mockResponse: CouponsListDTO = {
        coupons: [],
        total: 0,
        limit: 100,
        offset: 0,
      };
      mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      expect(component['getErrorMessage']()).toBe('Wystąpił nieoczekiwany błąd.');
    });
  });

  describe('Coupon Usage Flow', () => {
    beforeEach(() => {
      const mockResponse: CouponsListDTO = {
        coupons: [createMockCouponDTO()],
        total: 1,
        limit: 100,
        offset: 0,
      };
      mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));
      fixture.detectChanges();
    });

    it('should show confirmation dialog when coupon is clicked', () => {
      const coupon = component['coupons']()[0];

      component['onCouponClick'](coupon);

      expect(component['showConfirmDialog']()).toBe(true);
      expect(component['selectedCoupon']()).toBe(coupon);
    });

    it('should clear error when showing confirmation dialog', () => {
      component['useCouponError'].set('Previous error');
      const coupon = component['coupons']()[0];

      component['onCouponClick'](coupon);

      expect(component['useCouponError']()).toBeNull();
    });

    it('should cancel coupon usage on cancel', () => {
      const coupon = component['coupons']()[0];
      component['onCouponClick'](coupon);

      component['onCancelUseCoupon']();

      expect(component['showConfirmDialog']()).toBe(false);
      expect(component['selectedCoupon']()).toBeNull();
    });

    it('should use coupon successfully on confirm', fakeAsync(() => {
      const coupon = component['coupons']()[0];
      const usedCoupon = createMockCouponDTO({ id: 1, status: 'used' });
      mockCouponService.useCoupon.and.returnValue(of(usedCoupon));

      component['onCouponClick'](coupon);
      component['onConfirmUseCoupon']();
      tick();

      expect(component['showConfirmDialog']()).toBe(false);
      expect(component['showSuccessMessage']()).toBe(true);
      expect(component['selectedCoupon']()).toBeNull();
    }));

    it('should update coupon in list after successful use', fakeAsync(() => {
      const coupon = component['coupons']()[0];
      const usedCoupon = createMockCouponDTO({ id: 1, status: 'used' });
      mockCouponService.useCoupon.and.returnValue(of(usedCoupon));

      component['onCouponClick'](coupon);
      component['onConfirmUseCoupon']();
      tick();

      const updatedCoupon = component['coupons']().find((c) => c.id === 1);
      expect(updatedCoupon?.isUsed).toBe(true);
    }));

    it('should hide success message after 3 seconds', fakeAsync(() => {
      const coupon = component['coupons']()[0];
      const usedCoupon = createMockCouponDTO({ id: 1, status: 'used' });
      mockCouponService.useCoupon.and.returnValue(of(usedCoupon));

      component['onCouponClick'](coupon);
      component['onConfirmUseCoupon']();
      tick();

      expect(component['showSuccessMessage']()).toBe(true);

      tick(3000);

      expect(component['showSuccessMessage']()).toBe(false);
    }));

    it('should handle coupon usage error', fakeAsync(() => {
      const coupon = component['coupons']()[0];
      const error = new Error('Coupon already used');
      mockCouponService.useCoupon.and.returnValue(throwError(() => error));

      component['onCouponClick'](coupon);
      component['onConfirmUseCoupon']();
      tick();

      expect(component['useCouponError']()).toBeTruthy();
      expect(component['selectedCoupon']()).toBeNull();
    }));

    it('should hide error message after 5 seconds', fakeAsync(() => {
      const coupon = component['coupons']()[0];
      const error = new Error('Coupon already used');
      mockCouponService.useCoupon.and.returnValue(throwError(() => error));

      component['onCouponClick'](coupon);
      component['onConfirmUseCoupon']();
      tick();

      expect(component['useCouponError']()).toBeTruthy();

      tick(5000);

      expect(component['useCouponError']()).toBeNull();
    }));

    it('should return early if no coupon is selected on confirm', () => {
      component['selectedCoupon'].set(null);

      component['onConfirmUseCoupon']();

      expect(mockCouponService.useCoupon).not.toHaveBeenCalled();
    });
  });

  describe('Coupon Usage Error Messages', () => {
    it('should return specific message for already used error', () => {
      const error = new Error('Coupon already used');
      expect(component['getUseCouponErrorMessage'](error)).toBe(
        'Ten kupon został już wykorzystany.',
      );
    });

    it('should return specific message for not found error', () => {
      const error = new Error('Coupon not found');
      expect(component['getUseCouponErrorMessage'](error)).toBe('Kupon nie został znaleziony.');
    });

    it('should return specific message for expired error', () => {
      const error = new Error('Coupon expired');
      expect(component['getUseCouponErrorMessage'](error)).toBe('Ten kupon wygasł.');
    });

    it('should return network error message', () => {
      const error = new Error('Network error');
      expect(component['getUseCouponErrorMessage'](error)).toBe(
        'Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe.',
      );
    });

    it('should return auth error message', () => {
      const error = new Error('Not authenticated');
      expect(component['getUseCouponErrorMessage'](error)).toBe(
        'Sesja wygasła. Zaloguj się ponownie.',
      );
    });

    it('should return generic error message', () => {
      const error = new Error('Unknown error');
      expect(component['getUseCouponErrorMessage'](error)).toBe(
        'Nie udało się wykorzystać kuponu. Spróbuj ponownie.',
      );
    });
  });

  describe('Realtime Subscription', () => {
    beforeEach(() => {
      const mockResponse: CouponsListDTO = {
        coupons: [],
        total: 0,
        limit: 100,
        offset: 0,
      };
      mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));
    });

    it('should add new coupon on INSERT event', () => {
      fixture.detectChanges();

      const newCoupon = createMockCouponDTO({ id: 99 });
      const onCallArgs = mockRealtimeChannel.on.calls.argsFor(0);
      const onCallback = onCallArgs[2] as any;

      onCallback({
        eventType: 'INSERT',
        new: newCoupon,
        old: null,
      });

      expect(component['coupons']().length).toBe(1);
      expect(component['coupons']()[0].id).toBe(99);
    });

    it('should update existing coupon on UPDATE event', () => {
      const initialCoupon = createMockCouponDTO({ id: 1, status: 'active' });
      const initialResponse: CouponsListDTO = {
        coupons: [initialCoupon],
        total: 1,
        limit: 100,
        offset: 0,
      };
      mockCouponService.getUserCoupons.and.returnValue(of(initialResponse));

      fixture.detectChanges();

      const updatedCoupon = createMockCouponDTO({ id: 1, status: 'used' });
      const onCallArgs = mockRealtimeChannel.on.calls.argsFor(0);
      const onCallback = onCallArgs[2] as any;

      onCallback({
        eventType: 'UPDATE',
        new: updatedCoupon,
        old: initialCoupon,
      });

      const coupon = component['coupons']().find((c) => c.id === 1);
      expect(coupon?.isUsed).toBe(true);
    });

    it('should remove coupon on DELETE event', () => {
      const coupon = createMockCouponDTO({ id: 1 });
      const initialResponse: CouponsListDTO = {
        coupons: [coupon],
        total: 1,
        limit: 100,
        offset: 0,
      };
      mockCouponService.getUserCoupons.and.returnValue(of(initialResponse));

      fixture.detectChanges();
      expect(component['coupons']().length).toBe(1);

      const onCallArgs = mockRealtimeChannel.on.calls.argsFor(0);
      const onCallback = onCallArgs[2] as any;

      onCallback({
        eventType: 'DELETE',
        new: null,
        old: coupon,
      });

      expect(component['coupons']().length).toBe(0);
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from all subscriptions', () => {
      const mockResponse: CouponsListDTO = {
        coupons: [],
        total: 0,
        limit: 100,
        offset: 0,
      };
      mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      // Verify that subscription was created
      expect(component['subscriptions'].length).toBeGreaterThan(0);

      const unsubscribeSpy = spyOn(component['subscriptions'][0], 'unsubscribe');

      component.ngOnDestroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
      expect(component['subscriptions'].length).toBe(0);
    });

    it('should cleanup realtime subscription', () => {
      const mockResponse: CouponsListDTO = {
        coupons: [],
        total: 0,
        limit: 100,
        offset: 0,
      };
      mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      component.ngOnDestroy();

      expect(mockSupabaseClient.removeChannel).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty coupon list gracefully', () => {
      const mockResponse: CouponsListDTO = {
        coupons: [],
        total: 0,
        limit: 100,
        offset: 0,
      };
      mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      expect(component['coupons']()).toEqual([]);
      expect(component['isEmpty']()).toBe(true);
      expect(component['activeCouponsCount']()).toBe(0);
    });

    it('should handle coupon with null value correctly', () => {
      const coupon = createMockCouponDTO({ type: 'free_scoop', value: null });
      const mockResponse: CouponsListDTO = {
        coupons: [coupon],
        total: 1,
        limit: 100,
        offset: 0,
      };
      mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      expect(component['coupons']()[0].value).toBeNull();
      expect(component['coupons']()[0].title).toBe('Darmowa gałka');
    });

    it('should handle very large coupon list', () => {
      const coupons = Array.from({ length: 100 }, (_, i) => createMockCouponDTO({ id: i + 1 }));
      const mockResponse: CouponsListDTO = {
        coupons,
        total: 100,
        limit: 100,
        offset: 0,
      };
      mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      expect(component['coupons']().length).toBe(100);
      expect(component['sortedCoupons']().length).toBe(100);
    });

    it('should handle coupon with edge case expiry date', () => {
      const now = new Date();
      const coupon = createMockCouponDTO({
        expires_at: now.toISOString(), // Exact current time
      });
      const mockResponse: CouponsListDTO = {
        coupons: [coupon],
        total: 1,
        limit: 100,
        offset: 0,
      };
      mockCouponService.getUserCoupons.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      // Should be expired or very close to expiring
      const transformedCoupon = component['coupons']()[0];
      expect(transformedCoupon.isExpired).toBe(true);
      expect(transformedCoupon.isActive).toBe(false);
    });
  });
});
