import { Component, Input } from '@angular/core';
import { Summary } from './dashboard.models';

@Component({
  selector: 'app-summary-card',
  standalone: true,
  template: `
    <article class="summary-card" [class]="item.tone">
      <div class="card-label">{{ item.label }} <span>↗</span></div>
      <div class="metric">{{ item.value }}</div>
      <div class="detail">{{ item.detail }}</div>
    </article>
  `,
})
export class SummaryCardComponent {
  @Input({ required: true }) item!: Summary;
}
