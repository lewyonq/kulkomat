import { Component, ChangeDetectionStrategy } from '@angular/core';

/**
 * SpinnerComponent - Loading spinner indicator
 *
 * Simple, reusable loading spinner component.
 * Uses Tailwind CSS for styling.
 */
@Component({
  selector: 'app-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex justify-center items-center"
      role="status"
      aria-live="polite"
      aria-label="Ładowanie"
    >
      <div
        class="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"
      ></div>
    </div>
  `,
})
export class SpinnerComponent {}
