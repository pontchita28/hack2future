import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TeamOverview } from './dashboard.models';
import { TeamOverviewComponent } from './team-overview.component';

@Component({
  selector: 'app-team-dashboard',
  standalone: true,
  imports: [CommonModule, TeamOverviewComponent],
  template: `
    <section class="team-dashboard">
      <div class="dashboard-intro">
        <div>
          <p class="eyebrow">PEOPLE / CLAIMS OPERATIONS</p>
          <h2>Team performance</h2>
          <p>Compare workload, client reach, claim exposure, and operational status by team.</p>
        </div>
      </div>
      <app-team-overview
        [teams]="teams"
        [years]="years"
        [selectedYear]="selectedYear"
        (yearChange)="yearChange.emit($event)">
      </app-team-overview>
    </section>
  `,
})
export class TeamDashboardComponent {
  @Input({ required: true }) teams: TeamOverview[] = [];
  @Input({ required: true }) years: (number | string)[] = [];
  @Input({ required: true }) selectedYear: number | string = 'All years';
  @Output() yearChange = new EventEmitter<number | string>();
}
