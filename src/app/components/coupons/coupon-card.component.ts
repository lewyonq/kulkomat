import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CouponCardViewModel } from '../../types/view-models';

/**
 * Coupon Card Component
 *
 * Displays a single coupon with:
 * - Icon with gradient based on coupon type
 * - Title and description
 * - Expiry date
 * - Status badge (active/used/expired)
 *
 * Visual variations:
 * - free_scoop: Purple gradient, ticket icon
 * - percentage: Blue gradient, percent icon
 * - amount: Green gradient, coins icon
 *
 * @Input coupon - Coupon view model with computed properties
 * @Output couponClick - Emitted when active coupon is clicked
 */
@Component({
  selector: 'app-coupon-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="coupon-card"
      [class.inactive]="!coupon().isActive"
      [class.clickable]="coupon().isActive"
      (click)="onCouponClick()"
      (keydown.enter)="onCouponClick()"
      (keydown.space)="onCouponClick()"
      role="button"
      [attr.tabindex]="coupon().isActive ? 0 : -1"
      [attr.aria-label]="coupon().title + ', ' + coupon().formattedExpiryDate + (coupon().isActive ? '. Kliknij aby wykorzystać' : '')"
      [attr.aria-disabled]="!coupon().isActive"
    >
      <!-- Icon Section -->
      <div class="icon-section" [style.background]="coupon().iconGradient">
        <!-- Ticket Icon (free_scoop) -->
        @if (coupon().iconName === 'ticket') {
          <svg
            class="coupon-icon"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 8C3 7.44772 3.44772 7 4 7H20C20.5523 7 21 7.44772 21 8V10C19.8954 10 19 10.8954 19 12C19 13.1046 19.8954 14 21 14V16C21 16.5523 20.5523 17 20 17H4C3.44772 17 3 16.5523 3 16V14C4.10457 14 5 13.1046 5 12C5 10.8954 4.10457 10 3 10V8Z"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M9 7V17"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
              stroke-dasharray="2 2"
            />
          </svg>
        }

        <!-- Percent Icon (percentage) -->
        @if (coupon().iconName === 'percent') {
          <svg
            class="coupon-icon"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="7" cy="7" r="2" stroke="white" stroke-width="2" />
            <circle cx="17" cy="17" r="2" stroke="white" stroke-width="2" />
            <path d="M19 5L5 19" stroke="white" stroke-width="2" stroke-linecap="round" />
          </svg>
        }

        <!-- Coins Icon (amount) -->
        @if (coupon().iconName === 'coins') {
          <svg
            class="coupon-icon"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="9" cy="11" r="7" stroke="white" stroke-width="2" />
            <path
              d="M15 7C17.7614 7 20 9.23858 20 12C20 14.7614 17.7614 17 15 17"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
            />
            <path d="M9 8V14M6 11H12" stroke="white" stroke-width="2" stroke-linecap="round" />
          </svg>
        }
      </div>

      <!-- Content Section -->
      <div class="content-section">
        <div class="header">
          <h3 class="title">{{ coupon().title }}</h3>
          <span
            class="status-badge"
            [class.active]="coupon().isActive"
            [class.used]="coupon().isUsed"
            [class.expired]="coupon().isExpired"
          >
            @if (coupon().isActive) {
              Aktywny
            } @else if (coupon().isUsed) {
              Wykorzystany
            } @else if (coupon().isExpired) {
              Wygasły
            }
          </span>
        </div>

        <p class="description">{{ coupon().description }}</p>
        <p class="expiry-date">{{ coupon().formattedExpiryDate }}</p>
      </div>
    </div>
  `,
  styles: [
    `
      .coupon-card {
        display: flex;
        gap: 1rem;
        background: white;
        border-radius: 12px;
        padding: 1.25rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }

      .coupon-card:not(.inactive):hover {
        transform: translateY(-4px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
      }

      .coupon-card.inactive {
        opacity: 0.6;
        background: #f5f5f5;
      }

      .coupon-card.inactive::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: repeating-linear-gradient(
          45deg,
          transparent,
          transparent 10px,
          rgba(0, 0, 0, 0.02) 10px,
          rgba(0, 0, 0, 0.02) 20px
        );
        pointer-events: none;
      }

      .coupon-card.clickable {
        cursor: pointer;
      }

      .coupon-card.clickable:focus {
        outline: 2px solid #6750a4;
        outline-offset: 2px;
      }

      .coupon-card.clickable:active {
        transform: scale(0.98);
      }

      /* Icon Section */
      .icon-section {
        flex-shrink: 0;
        width: 64px;
        height: 64px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .coupon-icon {
        width: 36px;
        height: 36px;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
      }

      /* Content Section */
      .content-section {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.75rem;
      }

      .title {
        font-size: 1.125rem;
        font-weight: 700;
        color: #1a1a1a;
        margin: 0;
        line-height: 1.3;
      }

      .coupon-card.inactive .title {
        color: #757575;
      }

      .status-badge {
        flex-shrink: 0;
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .status-badge.active {
        background: #e8f5e9;
        color: #2e7d32;
        border: 1px solid #a5d6a7;
      }

      .status-badge.used {
        background: #e3f2fd;
        color: #1565c0;
        border: 1px solid #90caf9;
      }

      .status-badge.expired {
        background: #ffebee;
        color: #c62828;
        border: 1px solid #ef9a9a;
      }

      .description {
        font-size: 0.875rem;
        color: #616161;
        margin: 0;
        line-height: 1.5;
      }

      .coupon-card.inactive .description {
        color: #9e9e9e;
      }

      .expiry-date {
        font-size: 0.8125rem;
        color: #757575;
        margin: 0;
        font-weight: 500;
      }

      .coupon-card.inactive .expiry-date {
        color: #bdbdbd;
      }

      /* Responsive Design */
      @media (max-width: 640px) {
        .coupon-card {
          padding: 1rem;
          gap: 0.875rem;
        }

        .icon-section {
          width: 56px;
          height: 56px;
        }

        .coupon-icon {
          width: 32px;
          height: 32px;
        }

        .title {
          font-size: 1rem;
        }

        .description {
          font-size: 0.8125rem;
        }

        .status-badge {
          font-size: 0.6875rem;
          padding: 0.2rem 0.625rem;
        }
      }

      @media (max-width: 480px) {
        .header {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .status-badge {
          align-self: flex-start;
        }
      }
    `,
  ],
})
export class CouponCardComponent {
  coupon = input.required<CouponCardViewModel>();
  couponClick = output<CouponCardViewModel>();

  protected onCouponClick(): void {
    if (!this.coupon().isActive) {
      return;
    }
    this.couponClick.emit(this.coupon());
  }
}
