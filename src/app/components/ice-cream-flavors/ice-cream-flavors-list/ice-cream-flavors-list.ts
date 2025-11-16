import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { map, Observable } from 'rxjs';
import { FlavorVM } from '../../../types/view-models';
import { IceCreamFlavorService } from '../../../services/ice-cream-flavor.service';
import { IceCreamFlavorCard } from '../ice-cream-flavor-card/ice-cream-flavor-card';

/**
 * Ice Cream Flavors List Component
 *
 * Komponent-kontener wyświetlający listę dostępnych smaków lodów.
 * Pobiera dane z IceCreamFlavorService i renderuje karty smaków.
 * Obsługuje przypadek pustej listy.
 */
@Component({
  selector: 'app-ice-cream-flavors-list',
  standalone: true,
  imports: [CommonModule, IceCreamFlavorCard],
  template: `
    <div class="flavors-list-container">
      <h2 class="flavors-title">Dostępne smaki</h2>

      @if (flavors$ | async; as flavors) {
        @if (flavors.length > 0) {
          <div class="flavors-grid">
            @for (flavor of flavors; track flavor.id) {
              <app-ice-cream-flavor-card [flavor]="flavor"></app-ice-cream-flavor-card>
            }
          </div>
        } @else {
          <div class="empty-state">
            <p class="empty-message">Brak dostępnych smaków w tym momencie.</p>
          </div>
        }
      } @else {
        <div class="loading-state">
          <p>Ładowanie smaków...</p>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .flavors-list-container {
        padding: 1.5rem;
        max-width: 1200px;
        margin: 0 auto;
      }

      .flavors-title {
        font-size: 1.875rem;
        font-weight: 700;
        color: rgb(var(--color-text-primary));
        margin: 0 0 1.5rem 0;
      }

      .flavors-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1rem;
      }

      .empty-state,
      .loading-state {
        text-align: center;
        padding: 3rem 1rem;
      }

      .empty-message {
        font-size: 1rem;
        color: rgb(var(--color-text-secondary));
        margin: 0;
      }

      @media (max-width: 640px) {
        .flavors-list-container {
          padding: 1rem;
        }

        .flavors-title {
          font-size: 1.5rem;
        }

        .flavors-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class IceCreamFlavorsList implements OnInit {
  /**
   * Observable ze strumieniem smaków
   */
  flavors$!: Observable<FlavorVM[]>;

  private iceCreamFlavorService = inject(IceCreamFlavorService);

  constructor() {}

  ngOnInit(): void {
    this.flavors$ = this.iceCreamFlavorService
      .getFlavors()
      .pipe(map((flavors) => flavors.filter((flavor) => flavor.isAvailable)));
  }
}
