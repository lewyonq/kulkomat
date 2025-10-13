import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * User ID Display Component
 *
 * Displays the user's unique short ID and a QR code for easy scanning by sellers.
 * The QR code is currently a mock SVG placeholder.
 *
 * @Input shortId - User's unique 6-8 character alphanumeric identifier
 * @Input showQRCode - Whether to display the QR code (default: true)
 */
@Component({
  selector: 'app-user-id-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="user-id-container">
      <div class="user-id-card">
        <h2 class="qr-title">Twój kod QR</h2>

        @if (showQRCode) {
          <div class="qr-code-container">
            <!-- Mock QR Code SVG -->
            <svg class="qr-code" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <!-- QR Code pattern - simplified mock -->
              <rect width="100" height="100" fill="white" />

              <!-- Top-left position marker -->
              <rect x="5" y="5" width="20" height="20" fill="black" />
              <rect x="8" y="8" width="14" height="14" fill="white" />
              <rect x="11" y="11" width="8" height="8" fill="black" />

              <!-- Top-right position marker -->
              <rect x="75" y="5" width="20" height="20" fill="black" />
              <rect x="78" y="8" width="14" height="14" fill="white" />
              <rect x="81" y="11" width="8" height="8" fill="black" />

              <!-- Bottom-left position marker -->
              <rect x="5" y="75" width="20" height="20" fill="black" />
              <rect x="8" y="78" width="14" height="14" fill="white" />
              <rect x="11" y="81" width="8" height="8" fill="black" />

              <!-- Data pattern (simplified) -->
              <rect x="35" y="10" width="5" height="5" fill="black" />
              <rect x="45" y="10" width="5" height="5" fill="black" />
              <rect x="55" y="10" width="5" height="5" fill="black" />
              <rect x="30" y="20" width="5" height="5" fill="black" />
              <rect x="40" y="20" width="5" height="5" fill="black" />
              <rect x="50" y="20" width="5" height="5" fill="black" />
              <rect x="60" y="20" width="5" height="5" fill="black" />
              <rect x="35" y="30" width="5" height="5" fill="black" />
              <rect x="45" y="30" width="5" height="5" fill="black" />
              <rect x="55" y="30" width="5" height="5" fill="black" />
              <rect x="65" y="30" width="5" height="5" fill="black" />
              <rect x="30" y="40" width="5" height="5" fill="black" />
              <rect x="40" y="40" width="5" height="5" fill="black" />
              <rect x="60" y="40" width="5" height="5" fill="black" />
              <rect x="70" y="40" width="5" height="5" fill="black" />
              <rect x="35" y="50" width="5" height="5" fill="black" />
              <rect x="55" y="50" width="5" height="5" fill="black" />
              <rect x="65" y="50" width="5" height="5" fill="black" />
              <rect x="75" y="50" width="5" height="5" fill="black" />
              <rect x="40" y="60" width="5" height="5" fill="black" />
              <rect x="50" y="60" width="5" height="5" fill="black" />
              <rect x="70" y="60" width="5" height="5" fill="black" />
              <rect x="35" y="70" width="5" height="5" fill="black" />
              <rect x="45" y="70" width="5" height="5" fill="black" />
              <rect x="65" y="70" width="5" height="5" fill="black" />
              <rect x="40" y="80" width="5" height="5" fill="black" />
              <rect x="50" y="80" width="5" height="5" fill="black" />
              <rect x="60" y="80" width="5" height="5" fill="black" />
              <rect x="80" y="80" width="5" height="5" fill="black" />
            </svg>
          </div>
        }

        <div class="short-id-container">
          <p class="short-id">{{ shortId || '---' }}</p>
        </div>

        <button
          class="copy-button"
          (click)="copyToClipboard()"
          type="button"
          aria-label="Kopiuj identyfikator"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 5H6C5.46957 5 4.96086 5.21071 4.58579 5.58579C4.21071 5.96086 4 6.46957 4 7V19C4 19.5304 4.21071 20.0391 4.58579 20.4142C4.96086 20.7893 5.46957 21 6 21H16C16.5304 21 17.0391 20.7893 17.4142 20.4142C17.7893 20.0391 18 19.5304 18 19V18"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M8 5C8 4.46957 8.21071 3.96086 8.58579 3.58579C8.96086 3.21071 9.46957 3 10 3H14C14.5304 3 15.0391 3.21071 15.4142 3.58579C15.7893 3.96086 16 4.46957 16 5V7C16 7.53043 15.7893 8.03914 15.4142 8.41421C15.0391 8.78929 14.5304 9 14 9H10C9.46957 9 8.96086 8.78929 8.58579 8.41421C8.21071 8.03914 8 7.53043 8 7V5Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span>Kopiuj</span>
        </button>

        @if (showCopiedMessage) {
          <p class="copied-message">Skopiowano!</p>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .user-id-container {
        width: 100%;
        display: flex;
        justify-content: center;
        padding: 0 1rem;
      }

      .user-id-card {
        background: white;
        border-radius: 16px;
        padding: 2rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
        width: 100%;
        max-width: 800px;
      }

      .label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #666;
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .qr-code-container {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 1rem;
        background: white;
        border-radius: 12px;
        border: 2px solid #e0e0e0;
      }

      .qr-code {
        width: 200px;
        height: 200px;
        display: block;
      }

      .qr-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1a1a1a;
        text-align: center;
      }

      .short-id-container {
        width: 100%;
        max-width: 300px;
        text-align: center;
      }

      .short-id {
        font-size: 2rem;
        font-family: 'Courier New', monospace;
        letter-spacing: 0.1rem;
        color: #1a1a1a;
        margin: 0;
        padding: 0.5rem 1.5rem;
        background: linear-gradient(
          135deg,
          rgba(244, 114, 182, 0.15) 0%,
          rgba(236, 72, 153, 0.15) 100%
        );
        border-radius: 12px;
        border: 2px dashed rgba(236, 72, 153, 0.4);
      }

      .copy-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: linear-gradient(
          135deg,
          rgba(219, 39, 119, 1) 0%,
          rgba(236, 72, 153, 1) 50%,
          rgba(244, 114, 182, 1) 100%
        );
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(219, 39, 119, 0.4);
      }

      .copy-button:hover {
        filter: brightness(1.1);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(219, 39, 119, 0.5);
      }

      .copy-button:active {
        transform: translateY(0);
        box-shadow: 0 2px 8px rgba(219, 39, 119, 0.4);
      }

      .copied-message {
        font-size: 0.875rem;
        color: #2e7d32;
        font-weight: 600;
        margin: 0;
        animation: fadeInOut 2s ease-in-out;
      }

      @keyframes fadeInOut {
        0%,
        100% {
          opacity: 0;
        }
        10%,
        90% {
          opacity: 1;
        }
      }

      @media (max-width: 640px) {
        .user-id-card {
          padding: 1.5rem;
        }

        .qr-code {
          width: 160px;
          height: 160px;
        }

        .short-id {
          font-size: 2rem;
          letter-spacing: 0.2rem;
        }
      }
    `,
  ],
})
export class UserIdDisplayComponent {
  @Input() shortId: string = '';
  @Input() showQRCode: boolean = true;

  protected showCopiedMessage = false;

  /**
   * Copy short ID to clipboard
   */
  copyToClipboard(): void {
    if (!this.shortId) return;

    navigator.clipboard.writeText(this.shortId).then(
      () => {
        this.showCopiedMessage = true;
        setTimeout(() => {
          this.showCopiedMessage = false;
        }, 2000);
      },
      (err) => {
        console.error('Failed to copy to clipboard:', err);
      },
    );
  }
}
