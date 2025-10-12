import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

/**
 * Coupon Navigation Card Component
 *
 * Interactive card that navigates to the coupons view.
 * Displays an icon, title, subtitle, and optional badge with active coupon count.
 *
 * @Input activeCouponsCount - Number of active coupons (displayed in badge if > 0)
 */
@Component({
  selector: 'app-coupon-navigation-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="coupon-card-container">
      <button
        class="coupon-card"
        (click)="navigateToCoupons()"
        type="button"
        aria-label="Przejdź do kuponów">

        <div class="card-header">
          <div class="icon-container">
            <!-- Coupon icon SVG -->
            <svg class="coupon-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9V6C3 5.46957 3.21071 4.96086 3.58579 4.58579C3.96086 4.21071 4.46957 4 5 4H19C19.5304 4 20.0391 4.21071 20.4142 4.58579C20.7893 4.96086 21 5.46957 21 6V9"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M3 9C3.79565 9 4.55871 9.31607 5.12132 9.87868C5.68393 10.4413 6 11.2044 6 12C6 12.7956 5.68393 13.5587 5.12132 14.1213C4.55871 14.6839 3.79565 15 3 15"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M21 9C20.2044 9 19.4413 9.31607 18.8787 9.87868C18.3161 10.4413 18 11.2044 18 12C18 12.7956 18.3161 13.5587 18.8787 14.1213C19.4413 14.6839 20.2044 15 21 15"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M3 15V18C3 18.5304 3.21071 19.0391 3.58579 19.4142C3.96086 19.7893 4.46957 20 5 20H19C19.5304 20 20.0391 19.7893 20.4142 19.4142C20.7893 19.0391 21 18.5304 21 18V15"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M10 12H14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>

            <!-- Badge with count -->
            @if (activeCouponsCount !== undefined && activeCouponsCount > 0) {
              <div class="badge" [attr.aria-label]="activeCouponsCount + ' aktywnych kuponów'">
                {{ activeCouponsCount }}
              </div>
            }
          </div>
        </div>

        <div class="card-content">
          <h3 class="card-title">Moje kupony</h3>
          <p class="card-subtitle">
            @if (activeCouponsCount !== undefined && activeCouponsCount > 0) {
              {{ activeCouponsCount }} {{ getCouponLabel(activeCouponsCount) }}
            } @else {
              Zobacz dostępne rabaty
            }
          </p>
        </div>

        <div class="card-action">
          <!-- Arrow icon -->
          <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </button>
    </div>
  `,
  styles: [`
    .coupon-card-container {
      width: 100%;
      padding: 1rem;
    }

    .coupon-card {
      width: 100%;
      background: white;
      border: none;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: left;
      position: relative;
      overflow: hidden;
    }

    .coupon-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(103, 80, 164, 0.05), rgba(255, 105, 180, 0.05));
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }

    .coupon-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }

    .coupon-card:hover::before {
      opacity: 1;
    }

    .coupon-card:active {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    /* Ripple effect */
    .coupon-card::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(103, 80, 164, 0.1);
      transform: translate(-50%, -50%);
      transition: width 0.6s, height 0.6s;
    }

    .coupon-card:active::after {
      width: 300px;
      height: 300px;
    }

    .card-header {
      flex-shrink: 0;
    }

    .icon-container {
      position: relative;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #6750a4, #7e57c2);
      border-radius: 12px;
      color: white;
    }

    .coupon-icon {
      width: 32px;
      height: 32px;
    }

    .badge {
      position: absolute;
      top: -6px;
      right: -6px;
      background: #ff4444;
      color: white;
      font-size: 0.75rem;
      font-weight: 700;
      min-width: 24px;
      height: 24px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 6px;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.1);
      }
    }

    .card-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 0;
      z-index: 1;
    }

    .card-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0;
    }

    .card-subtitle {
      font-size: 0.875rem;
      color: #666;
      margin: 0;
    }

    .card-action {
      flex-shrink: 0;
      z-index: 1;
    }

    .arrow-icon {
      width: 24px;
      height: 24px;
      color: #6750a4;
      transition: transform 0.3s ease;
    }

    .coupon-card:hover .arrow-icon {
      transform: translateX(4px);
    }

    /* Responsive Design */
    @media (max-width: 640px) {
      .coupon-card {
        padding: 1.25rem;
      }

      .icon-container {
        width: 50px;
        height: 50px;
      }

      .coupon-icon {
        width: 28px;
        height: 28px;
      }

      .card-title {
        font-size: 1.125rem;
      }

      .card-subtitle {
        font-size: 0.8125rem;
      }
    }
  `]
})
export class CouponNavigationCardComponent {
  @Input() activeCouponsCount?: number;

  private router = inject(Router);

  /**
   * Navigate to coupons page
   */
  navigateToCoupons(): void {
    this.router.navigate(['/coupons']);
  }

  /**
   * Get proper Polish label for coupon count
   */
  getCouponLabel(count: number): string {
    if (count === 1) {
      return 'aktywny kupon';
    } else if (count >= 2 && count <= 4) {
      return 'aktywne kupony';
    } else {
      return 'aktywnych kuponów';
    }
  }
}
