import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Navigation } from './components/navigation/navigation.component';
import { Supabase } from './services/supabase';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet, Navigation],
  template: `
    <div class="flex flex-col h-screen">
      <header class="flex items-center justify-between p-6 futuristic-header">
        <div class="flex items-center cursor-pointer" routerLink="/">
          <img src="./assets/icons/icecream_material.svg" alt="Ice Cream" class="w-12 h-12" />
          <h1 class="text-3xl">Kulkomat</h1>
        </div>
        @if (this.supabase.isAuthenticated()) {
          <app-navigation class="hidden md:block"></app-navigation>
        }
      </header>

      <main class="flex-grow p-4">
        <router-outlet></router-outlet>
      </main>
      @if (this.supabase.isAuthenticated()) {
        <app-navigation class="md:hidden"></app-navigation>
      }
    </div>
  `,
  styles: `
    .futuristic-header {
      /* Pink gradient background using CSS variables */
      background: var(--gradient-primary);

      /* Glass morphism effect */
      backdrop-filter: blur(20px);

      /* Pink shadow with glow effect */
      box-shadow:
        0 8px 32px rgba(219, 39, 119, 0.3),
        0 0 60px rgba(236, 72, 153, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);

      /* Border styling */
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);

      /* Layout */
      position: relative;
      overflow: hidden;
      min-height: 80px;

      /* Text color */
      color: rgb(var(--color-text-on-primary));
    }

    /**
 * Shimmer Animation Effect
 * 
 * Adds a moving light effect across the header
 */
    .futuristic-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      animation: shimmer 3s infinite;
    }

    @keyframes shimmer {
      0% {
        left: -100%;
      }
      100% {
        left: 200%;
      }
    }

    /**
 * Header Title Styling
 * 
 * Enhanced text with pink glow effect
 */
    .futuristic-header h1 {
      text-shadow:
        0 0 20px rgba(255, 255, 255, 0.5),
        0 0 40px rgba(236, 72, 153, 0.5),
        0 2px 4px rgba(0, 0, 0, 0.3);
      font-weight: 700;
      letter-spacing: 0.5px;
    }
  `,
})
export class App {
   protected supabase = inject(Supabase);
}
