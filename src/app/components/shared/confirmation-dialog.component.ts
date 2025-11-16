import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Confirmation Dialog Component
 *
 * Reusable modal dialog for confirming user actions.
 * Features:
 * - Customizable title, message, and button labels
 * - Accessible with proper ARIA attributes
 * - Backdrop click to close
 * - Keyboard support (ESC to close)
 * - Smooth animations
 *
 * @Input isOpen - Controls dialog visibility
 * @Input title - Dialog title text
 * @Input message - Dialog message/description text
 * @Input confirmLabel - Label for confirm button (default: "Tak")
 * @Input cancelLabel - Label for cancel button (default: "Nie")
 * @Input confirmButtonClass - Custom CSS class for confirm button
 * @Output confirm - Emitted when user confirms
 * @Output cancel - Emitted when user cancels or closes dialog
 */
@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div
        class="dialog-overlay"
        (click)="onBackdropClick()"
        (keydown.escape)="onCancel()"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="'dialog-title'"
        [attr.aria-describedby]="'dialog-message'"
        tabindex="-1"
      >
        <div
          class="dialog-container"
          (click)="$event.stopPropagation()"
          tabindex="-1"
          (keydown)="$event.stopPropagation()"
        >
          <!-- Dialog Header -->
          <div class="dialog-header">
            <h2 id="dialog-title" class="dialog-title">{{ title() }}</h2>
          </div>

          <!-- Dialog Content -->
          <div class="dialog-content">
            <p id="dialog-message" class="dialog-message">{{ message() }}</p>
          </div>

          <!-- Dialog Actions -->
          <div class="dialog-actions">
            <button
              class="dialog-button cancel-button"
              (click)="onCancel()"
              type="button"
              aria-label="Anuluj"
            >
              {{ cancelLabel() }}
            </button>
            <button
              class="dialog-button confirm-button"
              [class]="confirmButtonClass()"
              (click)="onConfirm()"
              type="button"
              aria-label="Potwierdź"
            >
              {{ confirmLabel() }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      /* Overlay */
      .dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 1rem;
        animation: fadeIn 0.2s ease-out;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      /* Dialog Container */
      .dialog-container {
        background: white;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        max-width: 400px;
        width: 100%;
        animation: slideUp 0.3s ease-out;
        overflow: hidden;
      }

      @keyframes slideUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      /* Dialog Header */
      .dialog-header {
        padding: 1.5rem 1.5rem 1rem 1.5rem;
        border-bottom: 1px solid #e0e0e0;
      }

      .dialog-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: #1a1a1a;
        margin: 0;
        line-height: 1.3;
      }

      /* Dialog Content */
      .dialog-content {
        padding: 1.5rem;
      }

      .dialog-message {
        font-size: 0.9375rem;
        color: #616161;
        margin: 0;
        line-height: 1.6;
      }

      /* Dialog Actions */
      .dialog-actions {
        display: flex;
        gap: 0.75rem;
        padding: 1rem 1.5rem 1.5rem 1.5rem;
        justify-content: flex-end;
      }

      .dialog-button {
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-size: 0.9375rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        border: none;
        min-width: 80px;
      }

      .cancel-button {
        background: #f5f5f5;
        color: #616161;
      }

      .cancel-button:hover {
        background: #e0e0e0;
      }

      .cancel-button:active {
        transform: scale(0.98);
      }

      .confirm-button {
        background: var(--gradient-primary);
        color: white;
        box-shadow: 0 2px 8px rgba(103, 80, 164, 0.3);
      }

      .confirm-button:hover {
        background: #5842a0;
        box-shadow: 0 4px 12px rgba(103, 80, 164, 0.4);
      }

      .confirm-button:active {
        transform: scale(0.98);
      }

      /* Responsive Design */
      @media (max-width: 480px) {
        .dialog-container {
          max-width: 100%;
          margin: 1rem;
        }

        .dialog-header {
          padding: 1.25rem 1.25rem 0.875rem 1.25rem;
        }

        .dialog-title {
          font-size: 1.125rem;
        }

        .dialog-content {
          padding: 1.25rem;
        }

        .dialog-message {
          font-size: 0.875rem;
        }

        .dialog-actions {
          padding: 0.875rem 1.25rem 1.25rem 1.25rem;
          flex-direction: column-reverse;
        }

        .dialog-button {
          width: 100%;
        }
      }
    `,
  ],
})
export class ConfirmationDialogComponent {
  isOpen = input<boolean>(false);
  title = input<string>('Potwierdzenie');
  message = input<string>('Czy na pewno chcesz kontynuować?');
  confirmLabel = input<string>('Tak');
  cancelLabel = input<string>('Nie');
  confirmButtonClass = input<string>('');

  confirm = output<void>();
  cancel = output<void>();

  protected onConfirm(): void {
    this.confirm.emit();
  }

  protected onCancel(): void {
    this.cancel.emit();
  }

  protected onBackdropClick(): void {
    this.onCancel();
  }
}
