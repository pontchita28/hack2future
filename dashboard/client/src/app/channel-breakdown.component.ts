import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ChannelSummary } from './dashboard.models';

@Component({
  selector: 'app-channel-breakdown',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <article class="panel channel-panel">
      <div class="panel-heading">
        <div>
          <h2>Policies by sales channel</h2>
          <p>How policies were sold across the portfolio</p>
        </div>
        <div class="channel-controls">
          <label for="channel-year">Year</label>
          <select id="channel-year" [ngModel]="selectedYear" (ngModelChange)="yearChange.emit($event)">
            <option *ngFor="let year of years">{{ year }}</option>
          </select>
        </div>
      </div>
      <div class="channel-bar" role="img" aria-label="Policy acquisition channel distribution">
        <div
          *ngFor="let item of summaries"
          class="channel-segment"
          [class]="'channel-segment ' + item.channel.toLowerCase()"
          [style.width.%]="item.percentOfPolicies"
          [title]="item.channel + ': ' + item.percentOfPolicies + '%'">
        </div>
      </div>
      <div class="channel-legend">
        <div class="legend-item" *ngFor="let item of summaries">
          <span [class]="'channel-icon ' + item.channel.toLowerCase()">●</span>
          <span>{{ item.channel }}</span>
          <strong>{{ item.percentOfPolicies }}%</strong>
        </div>
      </div>
    </article>
  `,
})
export class ChannelBreakdownComponent {
  @Input({ required: true }) summaries: ChannelSummary[] = [];
  @Input({ required: true }) years: (number | string)[] = [];
  @Input({ required: true }) selectedYear: number | string = 'All years';
  @Output() yearChange = new EventEmitter<number | string>();

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
