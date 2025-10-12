import { Component, Input, computed, signal } from '@angular/core';
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
        <h2 class="title">Twoje pieczątki</h2>

        <!-- Ice cream icons grid -->
        <div class="icons-grid">
          @for (stamp of stamps(); track $index) {
            <div class="icon-wrapper" [class.collected]="stamp.collected">
              <!-- Ice cream cone SVG icon -->
              <svg class="ice-cream-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- Cone -->
                <path d="M9 13L12 21L15 13H9Z" [attr.fill]="stamp.collected ? '#D4A574' : '#E0E0E0'" stroke="currentColor" stroke-width="1.5"/>
                <!-- Ice cream scoops -->
                <circle cx="12" cy="10" r="3" [attr.fill]="stamp.collected ? '#FFB6C1' : '#F5F5F5'" stroke="currentColor" stroke-width="1.5"/>
                <circle cx="9.5" cy="8" r="2.5" [attr.fill]="stamp.collected ? '#FF69B4' : '#F5F5F5'" stroke="currentColor" stroke-width="1.5"/>
                <circle cx="14.5" cy="8" r="2.5" [attr.fill]="stamp.collected ? '#FFD700' : '#F5F5F5'" stroke="currentColor" stroke-width="1.5"/>
              </svg>
            </div>
          }
        </div>

        <!-- Progress bar -->
        <div class="progress-section">
          <div class="progress-bar-container">
            <div class="progress-bar-background">
              <div
                class="progress-bar-fill"
                [style.width.%]="percentage()">
              </div>
            </div>
          </div>

          <p class="progress-text">
            <span class="current">{{ normalizedStampCount() }}</span>
            <span class="separator">/</span>
            <span class="total">{{ maxStamps }}</span>
            <span class="unit">pieczątek</span>
          </p>
        </div>

        <!-- Status message -->
        <div class="message-container">
          @if (isComplete()) {
            <p class="message complete">
              🎉 Masz komplet! Wykorzystaj kupon na darmową gałkę.
            </p>
          } @else {
            <p class="message">
              Brakuje ci <strong>{{ stampsToReward() }}</strong>
              {{ stampsToReward() === 1 ? 'pieczątki' : 'pieczątek' }} do darmowej gałki!
            </p>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
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
      gap: 1.5rem;
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
      gap: 1rem;
      padding: 1rem 0;
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
      background: #f5f5f5;
      transition: all 0.3s ease;
    }

    .icon-wrapper.collected {
      background: #fff3f0;
      transform: scale(1.05);
    }

    .ice-cream-icon {
      width: 80%;
      height: 80%;
      transition: all 0.3s ease;
    }

    .icon-wrapper.collected .ice-cream-icon {
      filter: drop-shadow(0 2px 4px rgba(255, 105, 180, 0.3));
    }

    .icon-wrapper:not(.collected) .ice-cream-icon {
      opacity: 0.5;
      stroke: #bdbdbd;
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
      background: linear-gradient(90deg, #FF69B4, #FFD700);
      border-radius: 6px;
      transition: width 0.6s ease;
      box-shadow: 0 2px 4px rgba(255, 105, 180, 0.3);
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
      color: #6750a4;
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
      font-family: system-ui, -apple-system, sans-serif;
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
  `]
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
      collected: index < this.normalizedStampCount()
    }));
  });
}
