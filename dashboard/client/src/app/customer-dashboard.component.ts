import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PolicyPortfolio } from './dashboard.models';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="portfolio-dashboard">
      <div class="dashboard-intro portfolio-heading">
        <div>
          <p class="eyebrow">PORTFOLIO / CUSTOMERS</p>
          <h2>Customer portfolio</h2>
          <p>Customer segments by age, risk, sales channel, and policy type.</p>
        </div>
        <div class="channel-controls">
          <label for="customer-year">Year</label>
          <select id="customer-year" [ngModel]="selectedYear" (ngModelChange)="yearChange.emit($event)">
            <option *ngFor="let year of years">{{ year }}</option>
          </select>
        </div>
      </div>
      <div class="portfolio-summary">
        <article class="summary-card violet"><div class="card-label">Customers</div><div class="metric">{{ portfolio.summary.customerCount | number }}</div><div class="detail">Unique customers in view</div></article>
        <article class="summary-card mint"><div class="card-label">Policies</div><div class="metric">{{ portfolio.summary.policyCount | number }}</div><div class="detail">Policies held by customers</div></article>
        <article class="summary-card orange"><div class="card-label">Top age group</div><div class="metric">{{ portfolio.customerBreakdown.ageBands[0]?.label || 'N/A' }}</div><div class="detail">{{ portfolio.customerBreakdown.ageBands[0]?.count | number }} customers</div></article>
        <article class="summary-card blue"><div class="card-label">Top risk band</div><div class="metric">{{ portfolio.customerBreakdown.riskBands[0]?.label || 'N/A' }}</div><div class="detail">{{ portfolio.customerBreakdown.riskBands[0]?.count | number }} customers</div></article>
      </div>
      <article class="panel customer-segmentation">
        <div class="panel-heading"><div><h2>Customer profile</h2><p>Unique customer counts across the selected portfolio period</p></div><span class="panel-action">Customer view</span></div>
        <div class="customer-segmentation-grid">
          <div class="customer-breakdown">
            <h3>Age</h3>
            <div class="portfolio-row" *ngFor="let item of portfolio.customerBreakdown.ageBands"><span>{{ item.label }}</span><strong>{{ item.count | number }}</strong></div>
          </div>
          <div class="customer-breakdown">
            <h3>Risk band</h3>
            <div class="portfolio-row" *ngFor="let item of portfolio.customerBreakdown.riskBands"><span>{{ item.label }}</span><strong>{{ item.count | number }}</strong></div>
          </div>
          <div class="customer-breakdown">
            <h3>Sales channel</h3>
            <div class="portfolio-row" *ngFor="let item of portfolio.customerBreakdown.channels"><span>{{ item.label }}</span><strong>{{ item.count | number }}</strong></div>
          </div>
          <div class="customer-breakdown">
            <h3>Policy type</h3>
            <div class="portfolio-row" *ngFor="let item of portfolio.customerBreakdown.policyTypes"><span>{{ item.label }}</span><strong>{{ item.count | number }}</strong></div>
          </div>
        </div>
      </article>
      <article class="panel age-profile-panel">
        <div class="panel-heading"><div><h2>Age-group portfolio profile</h2><p>Dominant customer attributes and average claim experience by age group</p></div><span class="panel-action">Portfolio detail</span></div>
        <div class="age-profile-table">
          <div class="age-profile-head"><span>Age</span><span>Customers</span><span>Risk</span><span>Channel</span><span>Policy type</span><span>Avg. claimed</span><span>Avg. paid</span></div>
          <div class="age-profile-row" *ngFor="let item of portfolio.ageProfiles">
            <strong>{{ item.label }}</strong>
            <span>{{ item.customerCount | number }}</span>
            <span>{{ item.riskBand }}</span>
            <span>{{ item.channel }}</span>
            <span>{{ item.policyType }}</span>
            <span>{{ formatCurrency(item.averageClaimAmount) }}</span>
            <span>{{ formatCurrency(item.averagePaidAmount) }}</span>
          </div>
        </div>
      </article>
    </section>
  `,
})
export class CustomerDashboardComponent {
  @Input({ required: true }) portfolio!: PolicyPortfolio;
  @Input({ required: true }) years: (number | string)[] = [];
  @Input({ required: true }) selectedYear: number | string = 'All years';
  @Output() yearChange = new EventEmitter<number | string>();

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(value);
  }
}
