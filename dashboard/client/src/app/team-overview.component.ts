import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TeamOverview } from './dashboard.models';

@Component({
  selector: 'app-team-overview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="team-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">CLAIMS OPERATIONS</p>
          <h2>Team overview</h2>
          <p>Workload, review status, claim type, and location by adjuster team.</p>
        </div>
        <div class="channel-controls">
          <label for="team-year">Year</label>
          <select id="team-year" [ngModel]="selectedYear" (ngModelChange)="yearChange.emit($event)">
            <option *ngFor="let year of years">{{ year }}</option>
          </select>
        </div>
      </div>
      <div class="team-grid">
        <article class="team-card" *ngFor="let item of teams">
          <div class="team-card-heading">
            <div class="team-badge">{{ item.team.replace('Team ', '') }}</div>
            <div><h3>{{ item.team }}</h3><span>{{ item.claimCount }} claims · {{ item.percentOfClaims }}% of claims</span></div>
          </div>
          <div class="team-metrics">
            <div><strong>{{ item.underReview }}</strong><span>Under review</span></div>
            <div><strong>{{ item.clientCount }}</strong><span>Clients ({{ item.percentOfClients }}%)</span></div>
            <div><strong>{{ item.statusCounts['Open'] || 0 }}</strong><span>Open</span></div>
            <div><strong>{{ item.statusCounts['Paid'] || 0 }}</strong><span>Paid</span></div>
            <div><strong>{{ item.statusCounts['Denied'] || 0 }}</strong><span>Denied</span></div>
          </div>
          <div class="team-details">
            <div><span>Top claim type</span><strong>{{ item.topType.name }} ({{ item.topType.count }})</strong></div>
            <div><span>Primary location</span><strong>{{ item.topLocation.name }} ({{ item.topLocation.count }})</strong></div>
            <div><span>Claim value share</span><strong>{{ item.percentOfClaimAmount }}%</strong></div>
          </div>
        </article>
      </div>
    </section>
  `,
})
export class TeamOverviewComponent {
  @Input({ required: true }) teams: TeamOverview[] = [];
  @Input({ required: true }) years: (number | string)[] = [];
  @Input({ required: true }) selectedYear: number | string = 'All years';
  @Output() yearChange = new EventEmitter<number | string>();
}
