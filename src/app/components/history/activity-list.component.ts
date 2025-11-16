import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityItemViewModel } from '../../types/view-models';
import { ActivityListItemComponent } from './activity-list-item.component';

/**
 * Activity List Component (Dumb)
 *
 * Wyświetla listę aktywności użytkownika.
 * Obsługuje infinite scroll - emituje zdarzenie loadMore gdy użytkownik
 * przewinie listę do końca.
 */
@Component({
  selector: 'app-activity-list',
  standalone: true,
  imports: [CommonModule, ActivityListItemComponent],
  template: `
    <div class="activity-list" role="list">
      @for (activity of activities; track activity.id) {
        <div role="listitem">
          <app-activity-list-item [activity]="activity" />
        </div>
      }
    </div>
  `,
  styles: [
    `
      .activity-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 0;
      }
    `,
  ],
})
export class ActivityListComponent {
  @Input({ required: true }) activities: ActivityItemViewModel[] = [];
}
