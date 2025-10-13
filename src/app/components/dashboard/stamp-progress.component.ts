import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Stamp Progress Component
 *
 * Displays the user's stamp collection progress with:
 * - Visual representation using ice cream icons (colored for collected, gray for missing)
 * - Progress bar showing completion percentage
 * - Text showing current/total stamps (e.g., "3/10 pieczątek")
 * - Dynamic message based on progress
 *
 * @Input stampCount - Current number of stamps collected (0-10)
 * @Input maxStamps - Maximum number of stamps (default: 10)
 */
@Component({
  selector: 'app-stamp-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stamp-progress-container">
      <div class="stamp-progress-card">
        <!-- Ice cream icons grid -->
        <div class="icons-grid">
          @for (stamp of stamps(); track $index) {
            <div class="icon-wrapper" [class.collected]="stamp.collected">
              <img src="./assets/icons/icecream_material.svg" alt="Ice Cream" class="w-8 h-8 ice-cream-icon"/>
            </div>
          }
        </div>

        <!-- Progress bar -->
        <div class="progress-section">
          <div class="progress-bar-container">
            <div class="progress-bar-background">
              <div class="progress-bar-fill" [style.width.%]="percentage()"></div>
            </div>
          </div>

          <p class="progress-text">
            <span class="current">{{ normalizedStampCount() }}</span>
            <span class="separator">/</span>
            <span class="total">{{ maxStamps }}</span>
            <span class="unit">pieczątek</span>
          </p>
        </div>

        
      </div>
    </div>
  `,
  styles: [
    `
      .stamp-progress-container {
        width: 100%;
        padding: 1rem;
      }

      .stamp-progress-card {
        background: white;
        border-radius: 16px;
        padding: 2rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1a1a1a;
        margin: 0;
        text-align: center;
      }

      /* Icons Grid */
      .icons-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 0.5rem;
        justify-items: center;
      }

      .icon-wrapper {
        width: 100%;
        max-width: 60px;
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        background:rgba(245, 245, 245, 0.53);
        transition: all 0.3s ease;
      }

      .icon-wrapper.collected {
        background: var(--gradient-primary);
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(219, 39, 119, 0.4);
      }

      .ice-cream-icon {
        width: 80%;
        height: 80%;
        transition: all 0.3s ease;
      }

      .icon-wrapper:not(.collected) .ice-cream-icon {
        filter: grayscale(100%) brightness(0.7);
      }

      .icon-wrapper.collected .ice-cream-icon {
        filter: sepia(1) hue-rotate(250deg) saturate(1);
      }

      /* Progress Bar */
      .progress-section {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .progress-bar-container {
        width: 100%;
      }

      .progress-bar-background {
        width: 100%;
        height: 12px;
        background: #e0e0e0;
        border-radius: 6px;
        overflow: hidden;
        position: relative;
      }

      .progress-bar-fill {
        height: 100%;
        background: var(--gradient-primary);
        border-radius: 6px;
        transition: width 0.6s ease;
        box-shadow: 0 2px 8px rgba(219, 39, 119, 0.4);
      }

      .progress-text {
        text-align: center;
        font-size: 1.25rem;
        font-weight: 600;
        color: #424242;
        margin: 0;
        font-family: 'Courier New', monospace;
      }

      .progress-text .current {
        color: rgb(var(--color-primary));
        font-size: 1.5rem;
      }

      .progress-text .separator {
        color: #9e9e9e;
        padding: 0 0.25rem;
      }

      .progress-text .total {
        color: #757575;
      }

      .progress-text .unit {
        font-size: 0.875rem;
        margin-left: 0.5rem;
        font-family:
          system-ui,
          -apple-system,
          sans-serif;
      }

      /* Message */
      .message-container {
        text-align: center;
      }

      .message {
        font-size: 1rem;
        color: #616161;
        margin: 0;
        line-height: 1.5;
      }

      .message strong {
        color: #6750a4;
        font-weight: 700;
      }

      .message.complete {
        color: #2e7d32;
        font-weight: 600;
        font-size: 1.125rem;
        padding: 1rem;
        background: #e8f5e9;
        border-radius: 8px;
        border: 2px solid #a5d6a7;
      }

      /* Responsive Design */
      @media (max-width: 640px) {
        .stamp-progress-card {
          padding: 1.5rem;
        }

        .icons-grid {
          gap: 0.75rem;
        }

        .icon-wrapper {
          max-width: 50px;
        }

        .title {
          font-size: 1.25rem;
        }

        .progress-text {
          font-size: 1rem;
        }

        .progress-text .current {
          font-size: 1.25rem;
        }
      }

      @media (max-width: 480px) {
        .icons-grid {
          grid-template-columns: repeat(5, 1fr);
          gap: 0.5rem;
        }

        .icon-wrapper {
          max-width: 45px;
        }
      }
    `,
  ],
})
export class StampProgressComponent {
  @Input() stampCount: number = 0;
  @Input() maxStamps: number = 10;

  /**
   * Normalized stamp count (ensures it's within valid range 0-maxStamps)
   */
  protected normalizedStampCount = computed(() => {
    return Math.max(0, Math.min(this.stampCount, this.maxStamps));
  });

  /**
   * Percentage of stamps collected
   */
  protected percentage = computed(() => {
    return (this.normalizedStampCount() / this.maxStamps) * 100;
  });

  /**
   * Number of stamps remaining to reach reward
   */
  protected stampsToReward = computed(() => {
    return Math.max(0, this.maxStamps - this.normalizedStampCount());
  });

  /**
   * Whether all stamps have been collected
   */
  protected isComplete = computed(() => {
    return this.normalizedStampCount() >= this.maxStamps;
  });

  /**
   * Array of stamp objects for rendering icons
   * Each stamp has a 'collected' property indicating if it's been earned
   */
  protected stamps = computed(() => {
    return Array.from({ length: this.maxStamps }, (_, index) => ({
      collected: index < this.normalizedStampCount(),
    }));
  });
}
