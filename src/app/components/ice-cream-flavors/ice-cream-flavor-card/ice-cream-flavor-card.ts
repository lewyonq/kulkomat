import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlavorVM } from '../../../types/view-models';

/**
 * Ice Cream Flavor Card Component
 *
 * Komponent-prezenter wyświetlający pojedynczy smak lodów.
 * Pokazuje nazwę smaku oraz status dostępności.
 */
@Component({
  selector: 'app-ice-cream-flavor-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flavor-card">
      <div class="flavor-info">
        <h3 class="flavor-name">{{ flavor.name }}</h3>
        <span
          class="availability-badge"
          [class.available]="flavor.isAvailable"
          [class.unavailable]="!flavor.isAvailable"
        >
          {{ flavor.isAvailable ? 'Dostępny' : 'Niedostępny' }}
        </span>
      </div>
    </div>
  `,
  styles: [
    `
      .flavor-card {
        background: rgb(var(--color-surface));
        border-radius: 12px;
        padding: 1rem 1.5rem;
        box-shadow: var(--shadow-md);
        transition: all 0.2s ease;
      }

      .flavor-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
      }

      .flavor-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
      }

      .flavor-name {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: rgb(var(--color-text-primary));
      }

      .availability-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.875rem;
        font-weight: 500;
        white-space: nowrap;
      }

      .availability-badge.available {
        background: rgba(var(--color-success), 0.1);
        color: rgb(var(--color-success));
      }

      .availability-badge.unavailable {
        background: rgba(var(--color-text-tertiary), 0.1);
        color: rgb(var(--color-text-secondary));
      }
    `,
  ],
})
export class IceCreamFlavorCard {
  /**
   * Dane smaku do wyświetlenia
   */
  @Input({ required: true }) flavor!: FlavorVM;
}
