import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { NgClass } from '@angular/common';

/**
 * AlertComponent - Alert message display
 *
 * Displays alert messages with different severity levels.
 * Uses Tailwind CSS for styling.
 *
 * @example
 * <app-alert message="Error occurred" type="error" />
 * <app-alert message="Success!" type="success" />
 */
@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (message()) {
      <div
        role="alert"
        [ngClass]="{
          'p-4 rounded-lg border': true,
          'bg-red-50 border-red-200 text-red-800': type() === 'error',
          'bg-green-50 border-green-200 text-green-800': type() === 'success',
          'bg-blue-50 border-blue-200 text-blue-800': type() === 'info',
          'bg-yellow-50 border-yellow-200 text-yellow-800': type() === 'warning',
        }"
      >
        <p class="text-sm font-medium">{{ message() }}</p>
      </div>
    }
  `,
})
export class AlertComponent {
  /**
   * Alert message to display
   */
  message = input.required<string | null>();

  /**
   * Alert severity type
   * Defaults to 'error'
   */
  type = input<'error' | 'success' | 'info' | 'warning'>('error');
}
