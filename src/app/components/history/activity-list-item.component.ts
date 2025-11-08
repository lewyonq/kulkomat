import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityItemViewModel } from '../../types/view-models';

/**
 * Activity List Item Component (Dumb)
 *
 * Reprezentuje pojedynczy wiersz na liście historii.
 * Wyświetla ikonę, tytuł, opis i datę zdarzenia.
 * Wygląd jest zależny od typu aktywności (ngSwitch).
 */
@Component({
  selector: 'app-activity-list-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="activity-item" [attr.data-type]="activity.type">
      <!-- Icon -->
      <div class="activity-icon" [style.background]="activity.color">
        @switch (activity.icon) {
          @case ('stamp-plus') {
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="white" stroke-width="2.5" stroke-linecap="round" />
              <circle cx="12" cy="12" r="9" stroke="white" stroke-width="2" />
            </svg>
          }
          @case ('coupon-generated') {
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M20 12V6H4V12C5.1 12 6 12.9 6 14C6 15.1 5.1 16 4 16V18H20V16C18.9 16 18 15.1 18 14C18 12.9 18.9 12 20 12Z"
                stroke="white"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <circle cx="12" cy="11" r="2" fill="white" />
            </svg>
          }
          @case ('coupon-used') {
            <img src="assets/icons/icecream_material.svg" alt="" />
          }
          @case ('coupon-expired') {
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="9" stroke="white" stroke-width="2" />
              <path
                d="M8 8L16 16M16 8L8 16"
                stroke="white"
                stroke-width="2.5"
                stroke-linecap="round"
              />
            </svg>
          }
        }
      </div>

      <!-- Content -->
      <div class="activity-content">
        <h4 class="activity-title">{{ activity.title }}</h4>
        <p class="activity-description">{{ activity.description }}</p>
        <time class="activity-date" [attr.datetime]="activity.date">{{ activity.date }}</time>
      </div>
    </div>
  `,
  styles: [
    `
      .activity-item {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        background: rgb(var(--color-surface));
        border-radius: 12px;
        transition: all 0.2s ease;
        border: 1px solid rgba(var(--color-primary), 0.1);
      }

      .activity-item:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
        border-color: rgba(var(--color-primary), 0.2);
      }

      .activity-icon {
        flex-shrink: 0;
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: var(--shadow-sm);
      }

      .activity-icon svg {
        width: 24px;
        height: 24px;
      }

      .activity-content {
        flex: 1;
        min-width: 0;
      }

      .activity-title {
        margin: 0 0 0.25rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: rgb(var(--color-text-primary));
      }

      .activity-description {
        margin: 0 0 0.5rem 0;
        font-size: 0.875rem;
        color: rgb(var(--color-text-secondary));
        line-height: 1.4;
      }

      .activity-date {
        display: inline-block;
        font-size: 0.75rem;
        color: rgb(var(--color-text-tertiary));
        font-weight: 500;
      }
    `,
  ],
})
export class ActivityListItemComponent {
  @Input({ required: true }) activity!: ActivityItemViewModel;
}
