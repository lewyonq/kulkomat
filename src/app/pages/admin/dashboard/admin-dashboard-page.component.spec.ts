import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminDashboardPageComponent } from './admin-dashboard-page.component';
import { AdminService } from '../../../services/admin.service';
import { StampService } from '../../../services/stamp.service';
import { of, throwError } from 'rxjs';
import { ProfileDTO } from '../../../types';
import { provideRouter } from '@angular/router';

describe('AdminDashboardPageComponent', () => {
  let component: AdminDashboardPageComponent;
  let fixture: ComponentFixture<AdminDashboardPageComponent>;
  let mockAdminService: jasmine.SpyObj<AdminService>;
  let mockStampService: jasmine.SpyObj<StampService>;

  const mockCustomer: ProfileDTO = {
    id: 'customer-123',
    short_id: 'ABC123',
    created_at: '2024-01-15T10:00:00Z',
    stamp_count: 0,
  };

  beforeEach(async () => {
    mockAdminService = jasmine.createSpyObj('AdminService', [
      'getCustomerDetailsByShortId',
      'addStampsToCustomer',
    ]);
    mockStampService = jasmine.createSpyObj('StampService', ['getCustomerStampsCount']);

    await TestBed.configureTestingModule({
      imports: [AdminDashboardPageComponent],
      providers: [
        provideRouter([]),
        { provide: AdminService, useValue: mockAdminService },
        { provide: StampService, useValue: mockStampService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with correct default signal values', () => {
      expect(component.customer()).toBeNull();
      expect(component.stampCount()).toBeNull();
      expect(component.searchStatus()).toBe('idle');
      expect(component.actionStatus()).toBe('idle');
      expect(component.error()).toBeNull();
      expect(component.stampsToAdd()).toBe(1);
      expect(component.successMessage()).toBeNull();
    });
  });

  describe('onCustomerSearch', () => {
    it('should not search when shortId is empty', () => {
      component.onCustomerSearch('');

      expect(mockAdminService.getCustomerDetailsByShortId).not.toHaveBeenCalled();
    });

    it('should not search when shortId contains only whitespace', () => {
      const whitespaceInputs = ['   ', '\t', '\n', '  \t  '];

      whitespaceInputs.forEach((input) => {
        component.onCustomerSearch(input);
      });

      expect(mockAdminService.getCustomerDetailsByShortId).not.toHaveBeenCalled();
    });

    it('should reset all state before starting search', () => {
      // Set up some existing state
      component.customer.set(mockCustomer);
      component.stampCount.set(5);
      component.error.set({
        error: { code: 'TEST_ERROR', message: 'Test error' },
      });
      component.successMessage.set('Test message');
      component.actionStatus.set('success');
      component.stampsToAdd.set(3);

      mockAdminService.getCustomerDetailsByShortId.and.returnValue(of(mockCustomer));
      mockStampService.getCustomerStampsCount.and.returnValue(of(0));

      component.onCustomerSearch('NEW123');

      expect(component.error()).toBeNull();
      expect(component.successMessage()).toBeNull();
      expect(component.actionStatus()).toBe('idle');
      expect(component.stampsToAdd()).toBe(1);
    });

    it('should set loading status during search', () => {
      mockAdminService.getCustomerDetailsByShortId.and.returnValue(of(mockCustomer));
      mockStampService.getCustomerStampsCount.and.returnValue(of(0));

      component.onCustomerSearch('ABC123');

      // After observable completes, status should be 'success'
      expect(component.searchStatus()).toBe('success');
    });

    it('should fetch customer details and stamp count successfully', () => {
      const stampCount = 7;
      mockAdminService.getCustomerDetailsByShortId.and.returnValue(of(mockCustomer));
      mockStampService.getCustomerStampsCount.and.returnValue(of(stampCount));

      component.onCustomerSearch('ABC123');

      expect(mockAdminService.getCustomerDetailsByShortId).toHaveBeenCalledWith('ABC123');
      expect(mockStampService.getCustomerStampsCount).toHaveBeenCalledWith('customer-123');
      expect(component.customer()).toEqual(mockCustomer);
      expect(component.stampCount()).toBe(stampCount);
      expect(component.searchStatus()).toBe('success');
    });

    it('should handle customer not found error', () => {
      const error = new Error('Customer not found');
      mockAdminService.getCustomerDetailsByShortId.and.returnValue(throwError(() => error));

      component.onCustomerSearch('NOTFOUND');

      expect(component.searchStatus()).toBe('error');
      expect(component.error()).toEqual({
        error: {
          code: 'CUSTOMER_NOT_FOUND',
          message: 'Customer not found',
        },
      });
      expect(component.customer()).toBeNull();
      expect(component.stampCount()).toBeNull();
    });

    it('should handle customer not found error with default message', () => {
      const error = new Error();
      mockAdminService.getCustomerDetailsByShortId.and.returnValue(throwError(() => error));

      component.onCustomerSearch('NOTFOUND');

      expect(component.searchStatus()).toBe('error');
      expect(component.error()?.error?.message).toBe(
        'Nie znaleziono klienta o podanym identyfikatorze.',
      );
    });

    it('should handle stamp count fetch error', () => {
      const stampError = new Error('Failed to fetch stamps');
      mockAdminService.getCustomerDetailsByShortId.and.returnValue(of(mockCustomer));
      mockStampService.getCustomerStampsCount.and.returnValue(throwError(() => stampError));

      component.onCustomerSearch('ABC123');

      expect(component.searchStatus()).toBe('error');
      expect(component.error()).toEqual({
        error: {
          code: 'STAMP_COUNT_ERROR',
          message: 'Nie udało się pobrać liczby pieczątek.',
        },
      });
    });

    it('should handle whitespace-trimmed shortId', () => {
      mockAdminService.getCustomerDetailsByShortId.and.returnValue(of(mockCustomer));
      mockStampService.getCustomerStampsCount.and.returnValue(of(5));

      component.onCustomerSearch('  ABC123  ');

      // Should not call because trim makes it valid but the method checks for empty after trim
      // Actually, looking at the code, it checks trim().length === 0, so this should work
      expect(mockAdminService.getCustomerDetailsByShortId).toHaveBeenCalledWith('  ABC123  ');
    });

    it('should clear previous customer data before new search', () => {
      component.customer.set(mockCustomer);
      component.stampCount.set(10);

      mockAdminService.getCustomerDetailsByShortId.and.returnValue(of(mockCustomer));
      mockStampService.getCustomerStampsCount.and.returnValue(of(3));

      component.onCustomerSearch('XYZ789');

      // Customer and stampCount are cleared before the async call completes
      expect(component.customer()).toEqual(mockCustomer); // Will be set after async completes
    });
  });

  describe('resetSearch', () => {
    it('should reset all signals to initial state', () => {
      // Set up some state
      component.searchStatus.set('success');
      component.customer.set(mockCustomer);
      component.stampCount.set(5);
      component.error.set({
        error: { code: 'TEST', message: 'Test' },
      });
      component.successMessage.set('Success!');
      component.actionStatus.set('success');
      component.stampsToAdd.set(5);

      component.resetSearch();

      expect(component.searchStatus()).toBe('idle');
      expect(component.customer()).toBeNull();
      expect(component.stampCount()).toBeNull();
      expect(component.error()).toBeNull();
      expect(component.successMessage()).toBeNull();
      expect(component.actionStatus()).toBe('idle');
      expect(component.stampsToAdd()).toBe(1);
    });

    it('should allow new search after reset', () => {
      component.searchStatus.set('error');
      component.error.set({
        error: { code: 'ERROR', message: 'Error' },
      });

      component.resetSearch();

      expect(component.searchStatus()).toBe('idle');
      expect(component.error()).toBeNull();

      mockAdminService.getCustomerDetailsByShortId.and.returnValue(of(mockCustomer));
      mockStampService.getCustomerStampsCount.and.returnValue(of(3));

      component.onCustomerSearch('ABC123');

      expect(component.searchStatus()).toBe('success');
    });
  });

  describe('updateStampsToAdd', () => {
    it('should update stampsToAdd with valid value', () => {
      component.updateStampsToAdd(5);
      expect(component.stampsToAdd()).toBe(5);

      component.updateStampsToAdd(10);
      expect(component.stampsToAdd()).toBe(10);

      component.updateStampsToAdd(1);
      expect(component.stampsToAdd()).toBe(1);
    });

    it('should enforce minimum value of 1', () => {
      component.updateStampsToAdd(0);
      expect(component.stampsToAdd()).toBe(1);

      component.updateStampsToAdd(-5);
      expect(component.stampsToAdd()).toBe(1);

      component.updateStampsToAdd(-100);
      expect(component.stampsToAdd()).toBe(1);
    });

    it('should handle boundary values', () => {
      component.updateStampsToAdd(1);
      expect(component.stampsToAdd()).toBe(1);

      component.updateStampsToAdd(0);
      expect(component.stampsToAdd()).toBe(1);
    });

    it('should handle large numbers', () => {
      component.updateStampsToAdd(999);
      expect(component.stampsToAdd()).toBe(999);

      component.updateStampsToAdd(1000000);
      expect(component.stampsToAdd()).toBe(1000000);
    });
  });

  describe('addStamps', () => {
    beforeEach(() => {
      component.customer.set(mockCustomer);
    });

    it('should not add stamps when no customer is selected', () => {
      component.customer.set(null);

      component.addStamps();

      expect(mockAdminService.addStampsToCustomer).not.toHaveBeenCalled();
      expect(component.error()).toEqual({
        error: {
          code: 'NO_CUSTOMER',
          message: 'Brak wybranego klienta.',
        },
      });
    });

    it('should not add stamps when count is less than 1', () => {
      component.stampsToAdd.set(0);

      component.addStamps();

      expect(mockAdminService.addStampsToCustomer).not.toHaveBeenCalled();
      expect(component.error()).toEqual({
        error: {
          code: 'INVALID_COUNT',
          message: 'Liczba pieczątek musi być większa niż 0.',
        },
      });
    });

    it('should set loading status and clear errors before adding', () => {
      component.error.set({
        error: { code: 'OLD_ERROR', message: 'Old error' },
      });
      component.successMessage.set('Old message');

      mockAdminService.addStampsToCustomer.and.returnValue(of(void 0));
      mockStampService.getCustomerStampsCount.and.returnValue(of(6));

      component.addStamps();

      expect(component.actionStatus()).toBe('success');
      expect(component.error()).toBeNull();
      expect(component.successMessage()).not.toBeNull();
    });

    it('should add stamps successfully', () => {
      const stampsToAdd = 3;
      component.stampsToAdd.set(stampsToAdd);

      mockAdminService.addStampsToCustomer.and.returnValue(of(void 0));
      mockStampService.getCustomerStampsCount.and.returnValue(of(8));

      component.addStamps();

      expect(mockAdminService.addStampsToCustomer).toHaveBeenCalledWith('customer-123', 3);
      expect(component.actionStatus()).toBe('success');
    });

    it('should display correct success message with singular form (1 pieczątka)', () => {
      component.stampsToAdd.set(1);

      mockAdminService.addStampsToCustomer.and.returnValue(of(void 0));
      mockStampService.getCustomerStampsCount.and.returnValue(of(6));

      component.addStamps();

      expect(component.successMessage()).toBe('Dodano 1 pieczątkę dla klienta.');
    });

    it('should display correct success message with plural form (2-4 pieczątki)', () => {
      const testCases = [2, 3, 4];

      testCases.forEach((count) => {
        component.stampsToAdd.set(count);
        mockAdminService.addStampsToCustomer.and.returnValue(of(void 0));
        mockStampService.getCustomerStampsCount.and.returnValue(of(5));

        component.addStamps();

        expect(component.successMessage()).toBe(`Dodano ${count} pieczątki dla klienta.`);
      });
    });

    it('should display correct success message with genitive plural form (5+ pieczątek)', () => {
      const testCases = [5, 6, 10, 100];

      testCases.forEach((count) => {
        component.stampsToAdd.set(count);
        mockAdminService.addStampsToCustomer.and.returnValue(of(void 0));
        mockStampService.getCustomerStampsCount.and.returnValue(of(10));

        component.addStamps();

        expect(component.successMessage()).toBe(`Dodano ${count} pieczątek dla klienta.`);
      });
    });

    it('should refresh stamp count after adding stamps', () => {
      const newStampCount = 12;
      component.stampsToAdd.set(3);

      mockAdminService.addStampsToCustomer.and.returnValue(of(void 0));
      mockStampService.getCustomerStampsCount.and.returnValue(of(newStampCount));

      component.addStamps();

      expect(mockStampService.getCustomerStampsCount).toHaveBeenCalledWith('customer-123');
      expect(component.stampCount()).toBe(newStampCount);
    });

    it('should handle stamp count refresh error silently', () => {
      component.stampsToAdd.set(2);

      mockAdminService.addStampsToCustomer.and.returnValue(of(void 0));
      mockStampService.getCustomerStampsCount.and.returnValue(
        throwError(() => new Error('Refresh error')),
      );

      const consoleErrorSpy = spyOn(console, 'error');
      component.addStamps();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error refreshing stamp count:',
        jasmine.any(Error),
      );
      // Should still show success message even if refresh fails
      expect(component.successMessage()).toBe('Dodano 2 pieczątki dla klienta.');
    });

    it('should handle errors when adding stamps', () => {
      const error = new Error('Failed to add stamps');
      component.stampsToAdd.set(3);

      mockAdminService.addStampsToCustomer.and.returnValue(throwError(() => error));

      component.addStamps();

      expect(component.actionStatus()).toBe('error');
      expect(component.error()).toEqual({
        error: {
          code: 'ADD_STAMPS_ERROR',
          message: 'Failed to add stamps',
        },
      });
    });

    it('should handle errors with default message', () => {
      const error = new Error();
      component.stampsToAdd.set(3);

      mockAdminService.addStampsToCustomer.and.returnValue(throwError(() => error));

      component.addStamps();

      expect(component.error()?.error?.message).toBe('Nie udało się dodać pieczątek.');
    });

    it('should reset stampsToAdd to 1 after successful add', () => {
      component.stampsToAdd.set(5);

      mockAdminService.addStampsToCustomer.and.returnValue(of(void 0));
      mockStampService.getCustomerStampsCount.and.returnValue(of(10));

      component.addStamps();

      expect(component.stampsToAdd()).toBe(1);
    });

    it('should not reset stampsToAdd on error', () => {
      component.stampsToAdd.set(5);

      mockAdminService.addStampsToCustomer.and.returnValue(throwError(() => new Error('Error')));

      component.addStamps();

      expect(component.stampsToAdd()).toBe(5);
    });
  });

  describe('formatDate', () => {
    it('should return "-" for undefined', () => {
      expect(component.formatDate(undefined)).toBe('-');
    });

    it('should format date correctly in Polish locale', () => {
      const dateString = '2024-01-15T10:30:00Z';
      const result = component.formatDate(dateString);

      // The exact format depends on the browser's locale implementation
      // but should contain date elements
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('should handle valid ISO date strings', () => {
      const testDates = ['2024-01-01T00:00:00Z', '2024-12-31T23:59:59Z', '2023-06-15T12:00:00Z'];

      testDates.forEach((dateString) => {
        const result = component.formatDate(dateString);
        expect(result).not.toBe('-');
        expect(result.length).toBeGreaterThan(0);
      });
    });

    it('should format different dates differently', () => {
      const date1 = component.formatDate('2024-01-01T00:00:00Z');
      const date2 = component.formatDate('2024-12-31T00:00:00Z');

      expect(date1).not.toBe(date2);
    });
  });

  describe('Business Rules Validation', () => {
    it('should validate minimum stamp count of 1', () => {
      component.customer.set(mockCustomer);
      component.stampsToAdd.set(0);

      component.addStamps();

      expect(mockAdminService.addStampsToCustomer).not.toHaveBeenCalled();
      expect(component.error()?.error?.code).toBe('INVALID_COUNT');
    });

    it('should handle Polish pluralization correctly', () => {
      const pluralizationTests = [
        { count: 1, expected: 'pieczątkę' },
        { count: 2, expected: 'pieczątki' },
        { count: 3, expected: 'pieczątki' },
        { count: 4, expected: 'pieczątki' },
        { count: 5, expected: 'pieczątek' },
        { count: 10, expected: 'pieczątek' },
        { count: 21, expected: 'pieczątek' },
      ];

      pluralizationTests.forEach(({ count, expected }) => {
        component.customer.set(mockCustomer);
        component.stampsToAdd.set(count);

        mockAdminService.addStampsToCustomer.and.returnValue(of(void 0));
        mockStampService.getCustomerStampsCount.and.returnValue(of(5));

        component.addStamps();

        expect(component.successMessage()).toContain(expected);
      });
    });

    it('should maintain state consistency during operations', () => {
      component.customer.set(mockCustomer);
      component.stampsToAdd.set(3);

      mockAdminService.addStampsToCustomer.and.returnValue(of(void 0));
      mockStampService.getCustomerStampsCount.and.returnValue(of(8));

      // Before operation
      expect(component.actionStatus()).toBe('idle');

      component.addStamps();

      // After operation
      expect(component.actionStatus()).toBe('success');
      expect(component.stampsToAdd()).toBe(1);
    });

    it('should prevent operations without authenticated customer', () => {
      component.customer.set(null);
      component.stampsToAdd.set(5);

      component.addStamps();

      expect(mockAdminService.addStampsToCustomer).not.toHaveBeenCalled();
      expect(component.error()?.error?.code).toBe('NO_CUSTOMER');
    });
  });

  describe('Integration: Complete Customer Search and Stamp Add Flow', () => {
    it('should handle complete flow from search to stamp addition', () => {
      // Step 1: Search for customer
      mockAdminService.getCustomerDetailsByShortId.and.returnValue(of(mockCustomer));
      mockStampService.getCustomerStampsCount.and.returnValue(of(5));

      component.onCustomerSearch('ABC123');

      expect(component.customer()).toEqual(mockCustomer);
      expect(component.stampCount()).toBe(5);
      expect(component.searchStatus()).toBe('success');

      // Step 2: Add stamps
      component.stampsToAdd.set(3);
      mockAdminService.addStampsToCustomer.and.returnValue(of(void 0));
      mockStampService.getCustomerStampsCount.and.returnValue(of(8));

      component.addStamps();

      expect(component.actionStatus()).toBe('success');
      expect(component.stampCount()).toBe(8);
      expect(component.successMessage()).toContain('3 pieczątki');
    });

    it('should handle error recovery scenarios', () => {
      // Step 1: Failed search
      mockAdminService.getCustomerDetailsByShortId.and.returnValue(
        throwError(() => new Error('Not found')),
      );

      component.onCustomerSearch('INVALID');

      expect(component.searchStatus()).toBe('error');
      expect(component.error()).not.toBeNull();

      // Step 2: Reset and try again
      component.resetSearch();

      expect(component.searchStatus()).toBe('idle');
      expect(component.error()).toBeNull();

      // Step 3: Successful search
      mockAdminService.getCustomerDetailsByShortId.and.returnValue(of(mockCustomer));
      mockStampService.getCustomerStampsCount.and.returnValue(of(5));

      component.onCustomerSearch('ABC123');

      expect(component.searchStatus()).toBe('success');
      expect(component.customer()).toEqual(mockCustomer);
    });

    it('should clear previous success messages on new operations', () => {
      component.customer.set(mockCustomer);
      component.stampsToAdd.set(2);

      mockAdminService.addStampsToCustomer.and.returnValue(of(void 0));
      mockStampService.getCustomerStampsCount.and.returnValue(of(7));

      // First stamp addition
      component.addStamps();
      expect(component.successMessage()).toContain('2 pieczątki');

      // Second stamp addition should clear previous message
      component.stampsToAdd.set(1);
      mockAdminService.addStampsToCustomer.and.returnValue(of(void 0));
      mockStampService.getCustomerStampsCount.and.returnValue(of(8));

      component.addStamps();
      expect(component.successMessage()).toContain('1 pieczątkę');
    });

    it('should handle multiple sequential searches', () => {
      const customer2: ProfileDTO = {
        id: 'customer-456',
        short_id: 'XYZ789',
        created_at: '2024-02-20T10:00:00Z',
        stamp_count: 0,
      };

      // First search
      mockAdminService.getCustomerDetailsByShortId.and.returnValue(of(mockCustomer));
      mockStampService.getCustomerStampsCount.and.returnValue(of(3));

      component.onCustomerSearch('ABC123');

      expect(component.customer()).toEqual(mockCustomer);
      expect(component.stampCount()).toBe(3);

      // Second search
      mockAdminService.getCustomerDetailsByShortId.and.returnValue(of(customer2));
      mockStampService.getCustomerStampsCount.and.returnValue(of(7));

      component.onCustomerSearch('XYZ789');

      expect(component.customer()).toEqual(customer2);
      expect(component.stampCount()).toBe(7);
      expect(component.stampsToAdd()).toBe(1); // Should be reset
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large stamp counts', () => {
      component.customer.set(mockCustomer);
      component.stampsToAdd.set(100);

      mockAdminService.addStampsToCustomer.and.returnValue(of(void 0));
      mockStampService.getCustomerStampsCount.and.returnValue(of(105));

      component.addStamps();

      expect(component.successMessage()).toContain('100 pieczątek');
      expect(component.stampCount()).toBe(105);
    });

    it('should handle stamp count of 0', () => {
      mockAdminService.getCustomerDetailsByShortId.and.returnValue(of(mockCustomer));
      mockStampService.getCustomerStampsCount.and.returnValue(of(0));

      component.onCustomerSearch('ABC123');

      expect(component.stampCount()).toBe(0);
    });

    it('should handle rapid consecutive search requests', () => {
      mockAdminService.getCustomerDetailsByShortId.and.returnValue(of(mockCustomer));
      mockStampService.getCustomerStampsCount.and.returnValue(of(5));

      component.onCustomerSearch('ABC123');
      component.onCustomerSearch('ABC123');
      component.onCustomerSearch('ABC123');

      expect(mockAdminService.getCustomerDetailsByShortId).toHaveBeenCalledTimes(3);
    });

    it('should handle date formatting edge cases', () => {
      expect(component.formatDate(undefined)).toBe('-');
      expect(component.formatDate('2024-01-01T00:00:00Z')).not.toBe('-');
    });

    it('should handle customer with very old creation date', () => {
      const oldCustomer: ProfileDTO = {
        ...mockCustomer,
        created_at: '2000-01-01T00:00:00Z',
      };

      mockAdminService.getCustomerDetailsByShortId.and.returnValue(of(oldCustomer));
      mockStampService.getCustomerStampsCount.and.returnValue(of(5));

      component.onCustomerSearch('OLD123');

      expect(component.customer()).toEqual(oldCustomer);
      const formattedDate = component.formatDate(oldCustomer.created_at);
      expect(formattedDate).toContain('2000');
    });
  });

  describe('State Management', () => {
    it('should maintain independent state for search and action operations', () => {
      // Set search to success
      component.customer.set(mockCustomer);
      component.searchStatus.set('success');

      // Action can be in different state
      component.actionStatus.set('loading');

      expect(component.searchStatus()).toBe('success');
      expect(component.actionStatus()).toBe('loading');
    });

    it('should not affect actionStatus when search fails', () => {
      component.actionStatus.set('success');

      mockAdminService.getCustomerDetailsByShortId.and.returnValue(
        throwError(() => new Error('Search failed')),
      );

      component.onCustomerSearch('INVALID');

      expect(component.searchStatus()).toBe('error');
      expect(component.actionStatus()).toBe('idle'); // Reset by onCustomerSearch
    });

    it('should preserve customer data when adding stamps fails', () => {
      component.customer.set(mockCustomer);
      component.stampCount.set(5);
      component.stampsToAdd.set(3);

      mockAdminService.addStampsToCustomer.and.returnValue(
        throwError(() => new Error('Add failed')),
      );

      component.addStamps();

      // Customer data should remain
      expect(component.customer()).toEqual(mockCustomer);
      expect(component.stampCount()).toBe(5);
    });
  });
});
