import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface NavLink {
  path: string;
  label: string;
  icon: 'home' | 'ticket' | 'user';
  ariaLabel: string;
}

/**
 * Navigation Component
 *
 * Responsive navigation bar that adapts between mobile and desktop:
 * - Mobile: Fixed bottom navigation with icons and labels
 * - Desktop: Horizontal navigation in header
 *
 * Features:
 * - Active route highlighting
 * - Keyboard navigation support
 * - ARIA labels for accessibility
 * - Smooth transitions and hover effects
 */
@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="nav-container" role="navigation" aria-label="Główna nawigacja">
      <div class="nav-content">
        @for (link of navLinks(); track link.path) {
          <a
            [routerLink]="link.path"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            class="nav-link"
            [attr.aria-label]="link.ariaLabel"
            [attr.aria-current]="isActive(link.path) ? 'page' : null"
          >
            <div class="icon-wrapper">
              <!-- Home Icon -->
              @if (link.icon === 'home') {
                <svg class="nav-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M3 9L12 2L21 9V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9Z"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path d="M9 21V12H15V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              }

              <!-- Ticket Icon -->
              @if (link.icon === 'ticket') {
                <svg class="nav-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M3 8C3 7.44772 3.44772 7 4 7H20C20.5523 7 21 7.44772 21 8V10C19.8954 10 19 10.8954 19 12C19 13.1046 19.8954 14 21 14V16C21 16.5523 20.5523 17 20 17H4C3.44772 17 3 16.5523 3 16V14C4.10457 14 5 13.1046 5 12C5 10.8954 4.10457 10 3 10V8Z"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path d="M9 7V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 2" />
                </svg>
              }

              <!-- User Icon -->
              @if (link.icon === 'user') {
                <svg class="nav-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2" />
                  <path
                    d="M6 21V19C6 16.7909 7.79086 15 10 15H14C16.2091 15 18 16.7909 18 19V21"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                </svg>
              }
            </div>
            <span class="nav-label">{{ link.label }}</span>
          </a>
        }
      </div>
    </nav>
  `,
  styles: [
    `
      .nav-container {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: white;
        box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
        z-index: 100;
      }

      .nav-content {
        display: flex;
        justify-content: space-around;
        align-items: center;
        padding: 0.75rem 1rem;
        max-width: 100%;
      }

      .nav-link {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        padding: 0.5rem 1rem;
        color: #757575;
        text-decoration: none;
        border-radius: 12px;
        transition: all 0.2s ease;
        position: relative;
        min-width: 64px;
      }

      .nav-link:hover {
        color: #6750a4;
        background: #f5f3ff;
      }

      .nav-link:focus-visible {
        outline: 2px solid #6750a4;
        outline-offset: 2px;
      }

      .nav-link.active {
        color: #6750a4;
        font-weight: 600;
      }

      .nav-link.active::before {
        content: '';
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 32px;
        height: 3px;
        background: linear-gradient(90deg, #6750a4 0%, #7c5cbe 100%);
        border-radius: 0 0 4px 4px;
      }

      .icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
      }

      .nav-icon {
        width: 100%;
        height: 100%;
        transition: transform 0.2s ease;
      }

      .nav-link:hover .nav-icon {
        transform: scale(1.1);
      }

      .nav-link.active .nav-icon {
        filter: drop-shadow(0 2px 4px rgba(103, 80, 164, 0.3));
      }

      .nav-label {
        font-size: 0.75rem;
        font-weight: 500;
        letter-spacing: 0.3px;
        text-align: center;
      }

      /* Desktop Styles */
      @media (min-width: 768px) {
        .nav-container {
          position: relative;
          box-shadow: none;
          background: transparent;
        }

        .nav-content {
          justify-content: flex-end;
          gap: 0.5rem;
          padding: 0;
        }

        .nav-link {
          flex-direction: row;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          min-width: auto;
        }

        .nav-link.active::before {
          display: none;
        }

        .nav-link.active {
          background: rgba(103, 80, 164, 0.1);
        }

        .icon-wrapper {
          width: 20px;
          height: 20px;
        }

        .nav-label {
          font-size: 0.875rem;
        }
      }

      /* Tablet Styles */
      @media (min-width: 640px) and (max-width: 767px) {
        .nav-content {
          padding: 1rem 2rem;
        }

        .nav-link {
          padding: 0.75rem 1.5rem;
        }
      }

      /* Accessibility - Reduced Motion */
      @media (prefers-reduced-motion: reduce) {
        .nav-link,
        .nav-icon {
          transition: none;
        }
      }
    `,
  ],
})
export class Navigation {
  protected navLinks = signal<NavLink[]>([
    {
      path: '/',
      label: 'Home',
      icon: 'home',
      ariaLabel: 'Przejdź do strony głównej',
    },
    {
      path: '/coupons',
      label: 'Kupony',
      icon: 'ticket',
      ariaLabel: 'Przejdź do kuponów',
    },
    {
      path: '/profile',
      label: 'Profil',
      icon: 'user',
      ariaLabel: 'Przejdź do profilu',
    },
  ]);

  protected isActive(path: string): boolean {
    return window.location.pathname === path;
  }
}
