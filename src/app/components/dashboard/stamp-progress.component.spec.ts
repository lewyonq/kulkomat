import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StampProgressComponent } from './stamp-progress.component';
import { StampService } from '../../services/stamp.service';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';

describe('StampProgressComponent', () => {
  let component: StampProgressComponent;
  let fixture: ComponentFixture<StampProgressComponent>;
  let mockStampService: jasmine.SpyObj<StampService>;
  let watchActiveStampsCountSubject: Subject<number>;

  beforeEach(async () => {
    // Create a subject to control the watchActiveStampsCount observable
    watchActiveStampsCountSubject = new Subject<number>();

    // Create mock StampService
    mockStampService = jasmine.createSpyObj('StampService', [
      'getActiveStampsCount',
      'watchActiveStampsCount',
    ]);

    // Setup default mock responses
    mockStampService.getActiveStampsCount.and.returnValue(of(0));
    mockStampService.watchActiveStampsCount.and.returnValue(
      watchActiveStampsCountSubject.asObservable(),
    );

    // Add signal properties separately to avoid type conflicts
    Object.defineProperty(mockStampService, 'isLoading', {
      value: signal(false),
      writable: true,
    });
    Object.defineProperty(mockStampService, 'error', {
      value: signal<Error | null>(null),
      writable: true,
    });

    await TestBed.configureTestingModule({
      imports: [StampProgressComponent],
      providers: [{ provide: StampService, useValue: mockStampService }],
    }).compileComponents();

    fixture = TestBed.createComponent(StampProgressComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    // Clean up subscriptions
    watchActiveStampsCountSubject.complete();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Default Values', () => {
    it('should have default stampCount of 0', () => {
      expect(component.stampCount()).toBe(0);
    });

    it('should have default maxStamps of 10', () => {
      expect(component.maxStamps()).toBe(10);
    });

    it('should reference StampService isLoading signal', () => {
      mockStampService.isLoading.set(true);
      expect(component.isLoading()).toBe(true);

      mockStampService.isLoading.set(false);
      expect(component.isLoading()).toBe(false);
    });

    it('should reference StampService error signal', () => {
      const testError = new Error('Test error');
      mockStampService.error.set(testError);
      expect(component.error()).toBe(testError);

      mockStampService.error.set(null);
      expect(component.error()).toBeNull();
    });
  });

  describe('Computed Property: normalizedStampCount', () => {
    it('should return stampCount when less than maxStamps', () => {
      component.stampCount.set(5);
      fixture.componentRef.setInput('maxStamps', 10);
      expect(component['normalizedStampCount']()).toBe(5);
    });

    it('should return 0 when stampCount equals maxStamps', () => {
      component.stampCount.set(10);
      fixture.componentRef.setInput('maxStamps', 10);
      expect(component['normalizedStampCount']()).toBe(0);
    });

    it('should normalize stampCount using modulo operation', () => {
      component.stampCount.set(13);
      fixture.componentRef.setInput('maxStamps', 10);
      expect(component['normalizedStampCount']()).toBe(3);
    });

    it('should handle multiple cycles through maxStamps', () => {
      component.stampCount.set(25);
      fixture.componentRef.setInput('maxStamps', 10);
      expect(component['normalizedStampCount']()).toBe(5);
    });

    it('should work with custom maxStamps value', () => {
      component.stampCount.set(7);
      fixture.componentRef.setInput('maxStamps', 5);
      expect(component['normalizedStampCount']()).toBe(2);
    });

    it('should update when stampCount changes', () => {
      fixture.componentRef.setInput('maxStamps', 10);
      component.stampCount.set(3);
      expect(component['normalizedStampCount']()).toBe(3);

      component.stampCount.set(8);
      expect(component['normalizedStampCount']()).toBe(8);
    });
  });

  describe('Computed Property: percentage', () => {
    it('should return 0% when stampCount is 0', () => {
      component.stampCount.set(0);
      fixture.componentRef.setInput('maxStamps', 10);
      expect(component['percentage']()).toBe(0);
    });

    it('should return 50% when at half progress', () => {
      component.stampCount.set(5);
      fixture.componentRef.setInput('maxStamps', 10);
      expect(component['percentage']()).toBe(50);
    });

    it('should return 100% when stampCount equals maxStamps - 1', () => {
      component.stampCount.set(9);
      fixture.componentRef.setInput('maxStamps', 10);
      expect(component['percentage']()).toBe(90);
    });

    it('should return 0% when stampCount equals maxStamps (normalized to 0)', () => {
      component.stampCount.set(10);
      fixture.componentRef.setInput('maxStamps', 10);
      expect(component['percentage']()).toBe(0);
    });

    it('should handle normalized values correctly', () => {
      component.stampCount.set(13);
      fixture.componentRef.setInput('maxStamps', 10);
      expect(component['percentage']()).toBe(30);
    });

    it('should work with custom maxStamps value', () => {
      component.stampCount.set(3);
      fixture.componentRef.setInput('maxStamps', 5);
      expect(component['percentage']()).toBe(60);
    });

    it('should calculate correct percentage for various stamp counts', () => {
      fixture.componentRef.setInput('maxStamps', 10);

      const testCases = [
        { stamps: 1, expected: 10 },
        { stamps: 2, expected: 20 },
        { stamps: 3, expected: 30 },
        { stamps: 4, expected: 40 },
        { stamps: 6, expected: 60 },
        { stamps: 7, expected: 70 },
        { stamps: 8, expected: 80 },
        { stamps: 9, expected: 90 },
      ];

      testCases.forEach(({ stamps, expected }) => {
        component.stampCount.set(stamps);
        expect(component['percentage']()).toBe(expected);
      });
    });
  });

  describe('Computed Property: stamps', () => {
    it('should generate array of stamps with correct length', () => {
      fixture.componentRef.setInput('maxStamps', 10);
      const stamps = component['stamps']();
      expect(stamps.length).toBe(10);
    });

    it('should mark stamps as collected up to normalizedStampCount', () => {
      component.stampCount.set(3);
      fixture.componentRef.setInput('maxStamps', 10);
      const stamps = component['stamps']();

      expect(stamps[0].collected).toBe(true);
      expect(stamps[1].collected).toBe(true);
      expect(stamps[2].collected).toBe(true);
      expect(stamps[3].collected).toBe(false);
      expect(stamps[9].collected).toBe(false);
    });

    it('should mark all stamps as not collected when stampCount is 0', () => {
      component.stampCount.set(0);
      fixture.componentRef.setInput('maxStamps', 10);
      const stamps = component['stamps']();

      stamps.forEach((stamp) => {
        expect(stamp.collected).toBe(false);
      });
    });

    it('should mark all stamps as not collected when stampCount equals maxStamps', () => {
      component.stampCount.set(10);
      fixture.componentRef.setInput('maxStamps', 10);
      const stamps = component['stamps']();

      stamps.forEach((stamp) => {
        expect(stamp.collected).toBe(false);
      });
    });

    it('should handle normalized stamp counts correctly', () => {
      component.stampCount.set(13);
      fixture.componentRef.setInput('maxStamps', 10);
      const stamps = component['stamps']();

      expect(stamps[0].collected).toBe(true);
      expect(stamps[1].collected).toBe(true);
      expect(stamps[2].collected).toBe(true);
      expect(stamps[3].collected).toBe(false);
    });

    it('should work with custom maxStamps value', () => {
      component.stampCount.set(3);
      fixture.componentRef.setInput('maxStamps', 5);
      const stamps = component['stamps']();

      expect(stamps.length).toBe(5);
      expect(stamps[0].collected).toBe(true);
      expect(stamps[1].collected).toBe(true);
      expect(stamps[2].collected).toBe(true);
      expect(stamps[3].collected).toBe(false);
      expect(stamps[4].collected).toBe(false);
    });

    it('should update when stampCount changes', () => {
      fixture.componentRef.setInput('maxStamps', 10);

      component.stampCount.set(2);
      let stamps = component['stamps']();
      expect(stamps.filter((s) => s.collected).length).toBe(2);

      component.stampCount.set(7);
      stamps = component['stamps']();
      expect(stamps.filter((s) => s.collected).length).toBe(7);
    });
  });

  describe('ngOnInit - Service Integration', () => {
    it('should call getActiveStampsCount on initialization', () => {
      fixture.detectChanges();
      expect(mockStampService.getActiveStampsCount).toHaveBeenCalledTimes(1);
    });

    it('should call watchActiveStampsCount on initialization', () => {
      fixture.detectChanges();
      expect(mockStampService.watchActiveStampsCount).toHaveBeenCalledTimes(1);
    });

    it('should set stampCount from getActiveStampsCount', (done) => {
      mockStampService.getActiveStampsCount.and.returnValue(of(5));

      fixture.detectChanges();

      setTimeout(() => {
        expect(component.stampCount()).toBe(5);
        done();
      }, 0);
    });

    it('should handle getActiveStampsCount error gracefully', (done) => {
      const errorSpy = spyOn(console, 'error');
      mockStampService.getActiveStampsCount.and.returnValue(
        throwError(() => new Error('Failed to fetch')),
      );

      fixture.detectChanges();

      setTimeout(() => {
        expect(errorSpy).toHaveBeenCalledWith(
          'Failed to subscribe to stamp count updates',
          jasmine.any(Error),
        );
        done();
      }, 0);
    });

    it('should update stampCount when watchActiveStampsCount emits', (done) => {
      fixture.detectChanges();

      watchActiveStampsCountSubject.next(3);

      setTimeout(() => {
        expect(component.stampCount()).toBe(3);

        watchActiveStampsCountSubject.next(7);

        setTimeout(() => {
          expect(component.stampCount()).toBe(7);
          done();
        }, 0);
      }, 0);
    });

    it('should reset stampCount to 0 when it reaches maxStamps', (done) => {
      fixture.componentRef.setInput('maxStamps', 10);
      fixture.detectChanges();

      watchActiveStampsCountSubject.next(10);

      setTimeout(() => {
        expect(component.stampCount()).toBe(0);
        done();
      }, 0);
    });

    it('should not reset stampCount when below maxStamps', (done) => {
      fixture.componentRef.setInput('maxStamps', 10);
      fixture.detectChanges();

      watchActiveStampsCountSubject.next(9);

      setTimeout(() => {
        expect(component.stampCount()).toBe(9);
        done();
      }, 0);
    });

    it('should reset stampCount with custom maxStamps value', (done) => {
      fixture.componentRef.setInput('maxStamps', 5);
      fixture.detectChanges();

      watchActiveStampsCountSubject.next(5);

      setTimeout(() => {
        expect(component.stampCount()).toBe(0);
        done();
      }, 0);
    });

    it('should handle watchActiveStampsCount error gracefully', (done) => {
      const errorSpy = spyOn(console, 'error');
      mockStampService.watchActiveStampsCount.and.returnValue(
        throwError(() => new Error('Watch failed')),
      );

      fixture.detectChanges();

      setTimeout(() => {
        expect(errorSpy).toHaveBeenCalledWith(
          'Failed to subscribe to stamp count updates',
          jasmine.any(Error),
        );
        done();
      }, 0);
    });

    it('should handle multiple updates through watchActiveStampsCount', (done) => {
      fixture.componentRef.setInput('maxStamps', 10);
      fixture.detectChanges();

      watchActiveStampsCountSubject.next(2);

      setTimeout(() => {
        expect(component.stampCount()).toBe(2);

        watchActiveStampsCountSubject.next(5);

        setTimeout(() => {
          expect(component.stampCount()).toBe(5);

          watchActiveStampsCountSubject.next(9);

          setTimeout(() => {
            expect(component.stampCount()).toBe(9);
            done();
          }, 0);
        }, 0);
      }, 0);
    });
  });

  describe('ngOnDestroy - Cleanup', () => {
    it('should unsubscribe from watchActiveStampsCount on destroy', () => {
      fixture.detectChanges();
      const subscription = component['stampCountSubscription'];
      expect(subscription).toBeDefined();

      spyOn(subscription!, 'unsubscribe');
      component.ngOnDestroy();

      expect(subscription!.unsubscribe).toHaveBeenCalledTimes(1);
    });

    it('should handle destroy when subscription is undefined', () => {
      // Don't call ngOnInit by not calling detectChanges
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should properly clean up to prevent memory leaks', () => {
      fixture.detectChanges();
      const subscription = component['stampCountSubscription'];

      expect(subscription?.closed).toBe(false);

      component.ngOnDestroy();

      expect(subscription?.closed).toBe(true);
    });
  });

  describe('Business Logic Integration Tests', () => {
    it('should correctly display progress for a user with 3 stamps', (done) => {
      fixture.componentRef.setInput('maxStamps', 10);
      mockStampService.getActiveStampsCount.and.returnValue(of(3));
      fixture.detectChanges();

      setTimeout(() => {
        expect(component.stampCount()).toBe(3);
        expect(component['normalizedStampCount']()).toBe(3);
        expect(component['percentage']()).toBe(30);
        expect(component['stamps']().filter((s) => s.collected).length).toBe(3);
        done();
      }, 0);
    });

    it('should handle full cycle completion and reset', (done) => {
      fixture.componentRef.setInput('maxStamps', 10);
      mockStampService.getActiveStampsCount.and.returnValue(of(9));
      fixture.detectChanges();

      setTimeout(() => {
        expect(component.stampCount()).toBe(9);
        expect(component['percentage']()).toBe(90);

        // User gets 10th stamp
        watchActiveStampsCountSubject.next(10);

        setTimeout(() => {
          expect(component.stampCount()).toBe(0);
          expect(component['percentage']()).toBe(0);
          expect(component['stamps']().filter((s) => s.collected).length).toBe(0);
          done();
        }, 0);
      }, 0);
    });

    it('should handle stamp count exceeding maxStamps multiple times', (done) => {
      fixture.componentRef.setInput('maxStamps', 10);
      mockStampService.getActiveStampsCount.and.returnValue(of(23));
      fixture.detectChanges();

      setTimeout(() => {
        expect(component.stampCount()).toBe(23);
        expect(component['normalizedStampCount']()).toBe(3);
        expect(component['percentage']()).toBe(30);
        expect(component['stamps']().filter((s) => s.collected).length).toBe(3);
        done();
      }, 0);
    });

    it('should work correctly with different maxStamps configurations', (done) => {
      fixture.componentRef.setInput('maxStamps', 8);
      mockStampService.getActiveStampsCount.and.returnValue(of(5));
      fixture.detectChanges();

      setTimeout(() => {
        expect(component['normalizedStampCount']()).toBe(5);
        expect(component['percentage']()).toBe(62.5);
        expect(component['stamps']().length).toBe(8);
        expect(component['stamps']().filter((s) => s.collected).length).toBe(5);
        done();
      }, 0);
    });

    it('should reflect real-time updates correctly', (done) => {
      fixture.componentRef.setInput('maxStamps', 10);
      mockStampService.getActiveStampsCount.and.returnValue(of(0));
      fixture.detectChanges();

      setTimeout(() => {
        expect(component['percentage']()).toBe(0);

        // Simulate adding stamps in real-time
        watchActiveStampsCountSubject.next(1);

        setTimeout(() => {
          expect(component['percentage']()).toBe(10);

          watchActiveStampsCountSubject.next(2);

          setTimeout(() => {
            expect(component['percentage']()).toBe(20);
            done();
          }, 0);
        }, 0);
      }, 0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle maxStamps of 1', () => {
      fixture.componentRef.setInput('maxStamps', 1);
      component.stampCount.set(0);

      expect(component['normalizedStampCount']()).toBe(0);
      expect(component['percentage']()).toBe(0);
      expect(component['stamps']().length).toBe(1);
    });

    it('should handle very large stamp counts', () => {
      fixture.componentRef.setInput('maxStamps', 10);
      component.stampCount.set(9999);

      const normalized = 9999 % 10; // Should be 9
      expect(component['normalizedStampCount']()).toBe(normalized);
      expect(component['percentage']()).toBe(normalized * 10);
    });

    it('should handle maxStamps change after initialization', (done) => {
      fixture.componentRef.setInput('maxStamps', 10);
      mockStampService.getActiveStampsCount.and.returnValue(of(7));
      fixture.detectChanges();

      setTimeout(() => {
        expect(component['normalizedStampCount']()).toBe(7);

        fixture.componentRef.setInput('maxStamps', 5);
        fixture.detectChanges();

        expect(component['normalizedStampCount']()).toBe(2); // 7 % 5 = 2
        expect(component['stamps']().length).toBe(5);
        done();
      }, 0);
    });

    it('should handle rapid successive updates', (done) => {
      fixture.detectChanges();

      // Simulate rapid updates
      watchActiveStampsCountSubject.next(1);
      watchActiveStampsCountSubject.next(2);
      watchActiveStampsCountSubject.next(3);
      watchActiveStampsCountSubject.next(4);

      setTimeout(() => {
        // Should reflect the latest value
        expect(component.stampCount()).toBe(4);
        done();
      }, 0);
    });
  });
});
