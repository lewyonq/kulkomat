import { Component } from '@angular/core';

/**
 * AuthCardComponent
 *
 * Reusable wrapper component for authentication forms and buttons.
 * Provides consistent branding and layout for login/registration views.
 * Uses content projection (ng-content) for flexible content composition.
 */
@Component({
  selector: 'app-auth-card',
  standalone: true,
  imports: [],
  template: `
    <div
      class="flex min-h-screen justify-center bg-gradient-to-br from-primary-50 to-accent-50 px-4 py-2"
    >
      <div class="w-full max-w-md">
        <div class="rounded-2xl bg-white p-8 shadow-xl">
          <ng-content />
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class AuthCardComponent {}
