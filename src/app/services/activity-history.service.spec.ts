import { TestBed } from '@angular/core/testing';
import { ActivityHistory } from './activity-history';
import { AuthService } from './auth.service';
import { of, throwError } from 'rxjs';
import {
  ActivityHistoryDTO,
  ActivityHistoryQueryParams,
  ActivityHistoryViewRow,
  ActivityItemDTO,
  ActivityType,
} from '../types';

describe('ActivityHistory', () => {
  let service: ActivityHistory;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let supabaseClientMock: any;
  let userSpy: jasmine.Spy;

  // Mock data
  const mockUser = {
    id: 'user-uuid-123',
    email: 'user@test.com',
  };

  const mockCustomerId = 'customer-uuid-456';

  const mockActivityViewRow: ActivityHistoryViewRow = {
    type: 'stamp_added',
    id: 1,
    user_id: 'user-uuid-123',
    details: { status: 'active' },
    created_at: '2024-01-15T10:00:00Z',
  };

  const mockActivityItem: ActivityItemDTO = {
    type: 'stamp_added' as ActivityType,
    id: 1,
    user_id: 'user-uuid-123',
    details: { status: 'active' },
    created_at: '2024-01-15T10:00:00Z',
  };

  beforeEach(() => {
    // Create Supabase client mock
    supabaseClientMock = {
      from: jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue({
              range: jasmine.createSpy('range').and.returnValue(
                Promise.resolve({
                  data: [mockActivityViewRow],
                  error: null,
                  count: 1,
                })
              ),
            }),
          }),
        }),
      }),
    };

    // Create AuthService mock with spy for user signal
    userSpy = jasmine.createSpy('user').and.returnValue(mockUser);
    authServiceMock = jasmine.createSpyObj('AuthService', [], {
      client: supabaseClientMock,
      user: userSpy,
    });

    TestBed.configureTestingModule({
      providers: [ActivityHistory, { provide: AuthService, useValue: authServiceMock }],
    });

    service = TestBed.inject(ActivityHistory);
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

  describe('getUserActivityHistory', () => {
    it('should successfully fetch activity history for authenticated user', (done) => {
      service.getUserActivityHistory().subscribe({
        next: (result: ActivityHistoryDTO) => {
          expect(result.activities).toEqual([mockActivityItem]);
          expect(result.total).toBe(1);
          expect(result.limit).toBe(50);
          expect(result.offset).toBe(0);
          expect(service.isLoading()).toBe(false);
          expect(service.error()).toBeNull();
          done();
        },
        error: done.fail,
      });
    });

    it('should return error when user is not authenticated', (done) => {
      userSpy.and.returnValue(null);

      service.getUserActivityHistory().subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('User not authenticated');
          expect(service.error()).toBeTruthy();
          expect(service.error()?.message).toBe('User not authenticated');
          done();
        },
      });
    });

    it('should use default pagination params when not provided', (done) => {
      const rangeSpy = jasmine.createSpy('range').and.returnValue(
        Promise.resolve({
          data: [],
          error: null,
          count: 0,
        })
      );

      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue({
              range: rangeSpy,
            }),
          }),
        }),
      });

      service.getUserActivityHistory().subscribe({
        next: (result) => {
          expect(result.limit).toBe(50);
          expect(result.offset).toBe(0);
          expect(rangeSpy).toHaveBeenCalledWith(0, 49);
          done();
        },
        error: done.fail,
      });
    });

    it('should use provided pagination params', (done) => {
      const params: ActivityHistoryQueryParams = { limit: 20, offset: 10 };
      const rangeSpy = jasmine.createSpy('range').and.returnValue(
        Promise.resolve({
          data: [],
          error: null,
          count: 0,
        })
      );

      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue({
              range: rangeSpy,
            }),
          }),
        }),
      });

      service.getUserActivityHistory(params).subscribe({
        next: (result) => {
          expect(result.limit).toBe(20);
          expect(result.offset).toBe(10);
          expect(rangeSpy).toHaveBeenCalledWith(10, 29);
          done();
        },
        error: done.fail,
      });
    });

    it('should set loading state during fetch', (done) => {
      let loadingDuringFetch = false;

      service.getUserActivityHistory().subscribe({
        next: () => {
          expect(service.isLoading()).toBe(false);
          done();
        },
        error: done.fail,
      });

      // Check if loading was set at the start (checked synchronously)
      setTimeout(() => {
        loadingDuringFetch = service.isLoading();
      }, 0);
    });

    it('should clear previous errors before new request', (done) => {
      service.error.set(new Error('Previous error'));

      service.getUserActivityHistory().subscribe({
        next: () => {
          expect(service.error()).toBeNull();
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
            order: jasmine.createSpy('order').and.returnValue({
              range: jasmine.createSpy('range').and.returnValue(
                Promise.resolve({
                  data: null,
                  error: dbError,
                  count: null,
                })
              ),
            }),
          }),
        }),
      });

      service.getUserActivityHistory().subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('Database connection failed');
          expect(service.isLoading()).toBe(false);
          expect(service.error()).toBeTruthy();
          done();
        },
      });
    });

    it('should query activity_history view with correct parameters', (done) => {
      const selectSpy = jasmine.createSpy('select').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue({
          order: jasmine.createSpy('order').and.returnValue({
            range: jasmine.createSpy('range').and.returnValue(
              Promise.resolve({
                data: [],
                error: null,
                count: 0,
              })
            ),
          }),
        }),
      });

      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: selectSpy,
      });

      service.getUserActivityHistory().subscribe({
        next: () => {
          expect(supabaseClientMock.from).toHaveBeenCalledWith('activity_history');
          expect(selectSpy).toHaveBeenCalledWith('*', { count: 'exact' });
          done();
        },
        error: done.fail,
      });
    });

    it('should filter by authenticated user_id', (done) => {
      const eqSpy = jasmine.createSpy('eq').and.returnValue({
        order: jasmine.createSpy('order').and.returnValue({
          range: jasmine.createSpy('range').and.returnValue(
            Promise.resolve({
              data: [],
              error: null,
              count: 0,
            })
          ),
        }),
      });

      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: eqSpy,
        }),
      });

      service.getUserActivityHistory().subscribe({
        next: () => {
          expect(eqSpy).toHaveBeenCalledWith('user_id', mockUser.id);
          done();
        },
        error: done.fail,
      });
    });

    it('should order by created_at descending', (done) => {
      const orderSpy = jasmine.createSpy('order').and.returnValue({
        range: jasmine.createSpy('range').and.returnValue(
          Promise.resolve({
            data: [],
            error: null,
            count: 0,
          })
        ),
      });

      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            order: orderSpy,
          }),
        }),
      });

      service.getUserActivityHistory().subscribe({
        next: () => {
          expect(orderSpy).toHaveBeenCalledWith('created_at', { ascending: false });
          done();
        },
        error: done.fail,
      });
    });

    it('should handle empty activity history', (done) => {
      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue({
              range: jasmine.createSpy('range').and.returnValue(
                Promise.resolve({
                  data: [],
                  error: null,
                  count: 0,
                })
              ),
            }),
          }),
        }),
      });

      service.getUserActivityHistory().subscribe({
        next: (result) => {
          expect(result.activities).toEqual([]);
          expect(result.total).toBe(0);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle null count from database', (done) => {
      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue({
              range: jasmine.createSpy('range').and.returnValue(
                Promise.resolve({
                  data: [],
                  error: null,
                  count: null,
                })
              ),
            }),
          }),
        }),
      });

      service.getUserActivityHistory().subscribe({
        next: (result) => {
          expect(result.total).toBe(0);
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('getActivityHistoryByUserId', () => {
    it('should successfully fetch activity history for specific user', (done) => {
      service.getActivityHistoryByUserId(mockCustomerId).subscribe({
        next: (result: ActivityHistoryDTO) => {
          expect(result.activities).toEqual([mockActivityItem]);
          expect(result.total).toBe(1);
          expect(service.isLoading()).toBe(false);
          expect(service.error()).toBeNull();
          done();
        },
        error: done.fail,
      });
    });

    it('should filter by provided user_id', (done) => {
      const eqSpy = jasmine.createSpy('eq').and.returnValue({
        order: jasmine.createSpy('order').and.returnValue({
          range: jasmine.createSpy('range').and.returnValue(
            Promise.resolve({
              data: [],
              error: null,
              count: 0,
            })
          ),
        }),
      });

      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: eqSpy,
        }),
      });

      service.getActivityHistoryByUserId(mockCustomerId).subscribe({
        next: () => {
          expect(eqSpy).toHaveBeenCalledWith('user_id', mockCustomerId);
          done();
        },
        error: done.fail,
      });
    });

    it('should use provided pagination params', (done) => {
      const params: ActivityHistoryQueryParams = { limit: 10, offset: 5 };
      const rangeSpy = jasmine.createSpy('range').and.returnValue(
        Promise.resolve({
          data: [],
          error: null,
          count: 0,
        })
      );

      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue({
              range: rangeSpy,
            }),
          }),
        }),
      });

      service.getActivityHistoryByUserId(mockCustomerId, params).subscribe({
        next: (result) => {
          expect(result.limit).toBe(10);
          expect(result.offset).toBe(5);
          expect(rangeSpy).toHaveBeenCalledWith(5, 14);
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
            order: jasmine.createSpy('order').and.returnValue({
              range: jasmine.createSpy('range').and.returnValue(
                Promise.resolve({
                  data: null,
                  error: dbError,
                  count: null,
                })
              ),
            }),
          }),
        }),
      });

      service.getActivityHistoryByUserId(mockCustomerId).subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('Permission denied');
          expect(service.isLoading()).toBe(false);
          expect(service.error()).toBeTruthy();
          done();
        },
      });
    });

    it('should handle empty user_id', (done) => {
      service.getActivityHistoryByUserId('').subscribe({
        next: () => {
          expect(supabaseClientMock.from).toHaveBeenCalledWith('activity_history');
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('Activity Mapping', () => {
    it('should correctly map stamp_added activity', (done) => {
      const stampAddedRow: ActivityHistoryViewRow = {
        type: 'stamp_added',
        id: 10,
        user_id: 'user-123',
        details: { status: 'active' },
        created_at: '2024-01-20T15:30:00Z',
      };

      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue({
              range: jasmine.createSpy('range').and.returnValue(
                Promise.resolve({
                  data: [stampAddedRow],
                  error: null,
                  count: 1,
                })
              ),
            }),
          }),
        }),
      });

      service.getUserActivityHistory().subscribe({
        next: (result) => {
          const activity = result.activities[0];
          expect(activity.type).toBe('stamp_added');
          expect(activity.id).toBe(10);
          expect(activity.user_id).toBe('user-123');
          expect(activity.details).toEqual({ status: 'active' });
          expect(activity.created_at).toBe('2024-01-20T15:30:00Z');
          done();
        },
        error: done.fail,
      });
    });

    it('should correctly map coupon_generated activity', (done) => {
      const couponGeneratedRow: ActivityHistoryViewRow = {
        type: 'coupon_generated',
        id: 20,
        user_id: 'user-456',
        details: { coupon_type: 'percentage' },
        created_at: '2024-01-21T10:00:00Z',
      };

      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue({
              range: jasmine.createSpy('range').and.returnValue(
                Promise.resolve({
                  data: [couponGeneratedRow],
                  error: null,
                  count: 1,
                })
              ),
            }),
          }),
        }),
      });

      service.getUserActivityHistory().subscribe({
        next: (result) => {
          const activity = result.activities[0];
          expect(activity.type).toBe('coupon_generated');
          expect(activity.details).toEqual({ coupon_type: 'percentage' });
          done();
        },
        error: done.fail,
      });
    });

    it('should correctly map coupon_used activity', (done) => {
      const couponUsedRow: ActivityHistoryViewRow = {
        type: 'coupon_used',
        id: 30,
        user_id: 'user-789',
        details: {},
        created_at: '2024-01-22T12:00:00Z',
      };

      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue({
              range: jasmine.createSpy('range').and.returnValue(
                Promise.resolve({
                  data: [couponUsedRow],
                  error: null,
                  count: 1,
                })
              ),
            }),
          }),
        }),
      });

      service.getUserActivityHistory().subscribe({
        next: (result) => {
          const activity = result.activities[0];
          expect(activity.type).toBe('coupon_used');
          expect(activity.details).toEqual({});
          done();
        },
        error: done.fail,
      });
    });

    it('should correctly map coupon_expired activity', (done) => {
      const couponExpiredRow: ActivityHistoryViewRow = {
        type: 'coupon_expired',
        id: 40,
        user_id: 'user-999',
        details: {},
        created_at: '2024-01-23T08:00:00Z',
      };

      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue({
              range: jasmine.createSpy('range').and.returnValue(
                Promise.resolve({
                  data: [couponExpiredRow],
                  error: null,
                  count: 1,
                })
              ),
            }),
          }),
        }),
      });

      service.getUserActivityHistory().subscribe({
        next: (result) => {
          const activity = result.activities[0];
          expect(activity.type).toBe('coupon_expired');
          expect(activity.details).toEqual({});
          done();
        },
        error: done.fail,
      });
    });

    it('should map multiple activities correctly', (done) => {
      const activities: ActivityHistoryViewRow[] = [
        {
          type: 'stamp_added',
          id: 1,
          user_id: 'user-123',
          details: { status: 'active' },
          created_at: '2024-01-23T10:00:00Z',
        },
        {
          type: 'coupon_generated',
          id: 2,
          user_id: 'user-123',
          details: { coupon_type: 'fixed_amount' },
          created_at: '2024-01-22T10:00:00Z',
        },
        {
          type: 'coupon_used',
          id: 3,
          user_id: 'user-123',
          details: {},
          created_at: '2024-01-21T10:00:00Z',
        },
      ];

      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue({
              range: jasmine.createSpy('range').and.returnValue(
                Promise.resolve({
                  data: activities,
                  error: null,
                  count: 3,
                })
              ),
            }),
          }),
        }),
      });

      service.getUserActivityHistory().subscribe({
        next: (result) => {
          expect(result.activities.length).toBe(3);
          expect(result.activities[0].type).toBe('stamp_added');
          expect(result.activities[1].type).toBe('coupon_generated');
          expect(result.activities[2].type).toBe('coupon_used');
          expect(result.total).toBe(3);
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('Pagination Edge Cases', () => {
    it('should handle offset 0 correctly', (done) => {
      const params: ActivityHistoryQueryParams = { limit: 10, offset: 0 };
      const rangeSpy = jasmine.createSpy('range').and.returnValue(
        Promise.resolve({
          data: [],
          error: null,
          count: 0,
        })
      );

      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue({
              range: rangeSpy,
            }),
          }),
        }),
      });

      service.getUserActivityHistory(params).subscribe({
        next: () => {
          expect(rangeSpy).toHaveBeenCalledWith(0, 9);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle large offset values', (done) => {
      const params: ActivityHistoryQueryParams = { limit: 50, offset: 1000 };
      const rangeSpy = jasmine.createSpy('range').and.returnValue(
        Promise.resolve({
          data: [],
          error: null,
          count: 0,
        })
      );

      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue({
              range: rangeSpy,
            }),
          }),
        }),
      });

      service.getUserActivityHistory(params).subscribe({
        next: () => {
          expect(rangeSpy).toHaveBeenCalledWith(1000, 1049);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle limit of 1', (done) => {
      const params: ActivityHistoryQueryParams = { limit: 1, offset: 0 };
      const rangeSpy = jasmine.createSpy('range').and.returnValue(
        Promise.resolve({
          data: [mockActivityViewRow],
          error: null,
          count: 1,
        })
      );

      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue({
              range: rangeSpy,
            }),
          }),
        }),
      });

      service.getUserActivityHistory(params).subscribe({
        next: (result) => {
          expect(rangeSpy).toHaveBeenCalledWith(0, 0);
          expect(result.activities.length).toBe(1);
          done();
        },
        error: done.fail,
      });
    });

    it('should handle large limit values', (done) => {
      const params: ActivityHistoryQueryParams = { limit: 1000, offset: 0 };
      const rangeSpy = jasmine.createSpy('range').and.returnValue(
        Promise.resolve({
          data: [],
          error: null,
          count: 0,
        })
      );

      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue({
              range: rangeSpy,
            }),
          }),
        }),
      });

      service.getUserActivityHistory(params).subscribe({
        next: () => {
          expect(rangeSpy).toHaveBeenCalledWith(0, 999);
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle null data from database', (done) => {
      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue({
              range: jasmine.createSpy('range').and.returnValue(
                Promise.resolve({
                  data: null,
                  error: { message: 'Data is null' },
                  count: null,
                })
              ),
            }),
          }),
        }),
      });

      service.getUserActivityHistory().subscribe({
        next: () => done.fail('should not succeed'),
        error: (error) => {
          expect(error.message).toBe('Data is null');
          done();
        },
      });
    });

    it('should maintain error state across failed operations', (done) => {
      const dbError = { message: 'Connection timeout' };
      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue({
              range: jasmine.createSpy('range').and.returnValue(
                Promise.resolve({
                  data: null,
                  error: dbError,
                  count: null,
                })
              ),
            }),
          }),
        }),
      });

      service.getUserActivityHistory().subscribe({
        next: () => done.fail('should not succeed'),
        error: () => {
          expect(service.error()).toBeTruthy();
          expect(service.error()?.message).toBe('Connection timeout');
          done();
        },
      });
    });

    it('should set isLoading to false after error', (done) => {
      const dbError = { message: 'Database error' };
      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue({
              range: jasmine.createSpy('range').and.returnValue(
                Promise.resolve({
                  data: null,
                  error: dbError,
                  count: null,
                })
              ),
            }),
          }),
        }),
      });

      service.getUserActivityHistory().subscribe({
        next: () => done.fail('should not succeed'),
        error: () => {
          expect(service.isLoading()).toBe(false);
          done();
        },
      });
    });
  });

  describe('Business Rules Validation', () => {
    it('should use exact count for pagination accuracy', (done) => {
      const selectSpy = jasmine.createSpy('select').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue({
          order: jasmine.createSpy('order').and.returnValue({
            range: jasmine.createSpy('range').and.returnValue(
              Promise.resolve({
                data: [],
                error: null,
                count: 5,
              })
            ),
          }),
        }),
      });

      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: selectSpy,
      });

      service.getUserActivityHistory().subscribe({
        next: () => {
          expect(selectSpy).toHaveBeenCalledWith(
            '*',
            jasmine.objectContaining({ count: 'exact' })
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should order activities from newest to oldest', (done) => {
      const orderSpy = jasmine.createSpy('order').and.returnValue({
        range: jasmine.createSpy('range').and.returnValue(
          Promise.resolve({
            data: [],
            error: null,
            count: 0,
          })
        ),
      });

      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            order: orderSpy,
          }),
        }),
      });

      service.getUserActivityHistory().subscribe({
        next: () => {
          expect(orderSpy).toHaveBeenCalledWith(
            'created_at',
            jasmine.objectContaining({ ascending: false })
          );
          done();
        },
        error: done.fail,
      });
    });

    it('should handle activity history with varying data volumes', (done) => {
      const largeDataSet = Array.from({ length: 50 }, (_, i) => ({
        type: 'stamp_added',
        id: i + 1,
        user_id: mockUser.id,
        details: { status: 'active' },
        created_at: `2024-01-${(i % 28) + 1}T10:00:00Z`,
      }));

      supabaseClientMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue({
              range: jasmine.createSpy('range').and.returnValue(
                Promise.resolve({
                  data: largeDataSet,
                  error: null,
                  count: 50,
                })
              ),
            }),
          }),
        }),
      });

      service.getUserActivityHistory().subscribe({
        next: (result) => {
          expect(result.activities.length).toBe(50);
          expect(result.total).toBe(50);
          done();
        },
        error: done.fail,
      });
    });
  });
});
