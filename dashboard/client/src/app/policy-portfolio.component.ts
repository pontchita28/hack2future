import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PolicyPortfolio } from './dashboard.models';

@Component({
  selector: 'app-policy-portfolio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="portfolio-dashboard">
      <div class="dashboard-intro portfolio-heading">
        <div>
          <p class="eyebrow">PORTFOLIO / POLICIES</p>
          <h2>Policy portfolio</h2>
          <p>Premium scale, retention, risk, and distribution mix.</p>
        </div>
        <div class="channel-controls">
          <label for="portfolio-year">Year</label>
          <select id="portfolio-year" [ngModel]="selectedYear" (ngModelChange)="yearChange.emit($event)">
            <option *ngFor="let year of years">{{ year }}</option>
          </select>
        </div>
      </div>
      <div class="portfolio-summary">
        <article class="summary-card violet"><div class="card-label">Policies</div><div class="metric">{{ portfolio.summary.policyCount | number }}</div><div class="detail">Active portfolio records</div></article>
        <article class="summary-card mint"><div class="card-label">Annual premium</div><div class="metric">{{ formatCurrency(portfolio.summary.totalAnnualPremium) }}</div><div class="detail">Total written premium</div></article>
        <article class="summary-card orange"><div class="card-label">Renewal rate</div><div class="metric">{{ portfolio.summary.renewalRate === null ? 'N/A' : portfolio.summary.renewalRate + '%' }}</div><div class="detail">{{ portfolio.summary.renewedCount | number }} renewed of {{ portfolio.summary.renewalEligibleCount | number }} eligible</div></article>
        <article class="summary-card blue"><div class="card-label">Average premium</div><div class="metric">{{ formatCurrency(portfolio.summary.averagePremium) }}</div><div class="detail">Per policy</div></article>
      </div>
      <div class="portfolio-grid">
        <article class="panel portfolio-list"><div class="panel-heading"><div><h2>Policy type</h2><p>Portfolio composition</p></div></div><div class="portfolio-row" *ngFor="let item of portfolio.policyTypes"><span>{{ item.label }}</span><strong>{{ item.count | number }}</strong></div></article>
        <article class="panel portfolio-list"><div class="panel-heading"><div><h2>Risk band</h2><p>Underwriting mix</p></div></div><div class="portfolio-row" *ngFor="let item of portfolio.riskBands"><span>{{ item.label }}</span><strong>{{ item.count | number }}</strong></div></article>
        <article class="panel portfolio-list"><div class="panel-heading"><div><h2>Sales channel</h2><p>How policies were sold</p></div></div><div class="portfolio-row" *ngFor="let item of portfolio.channels"><span>{{ item.label }}</span><strong>{{ item.count | number }}</strong></div></article>
      </div>
      <article class="panel channel-panel portfolio-channel-panel">
        <div class="panel-heading"><div><h2>Policies by sales channel</h2><p>How policies were sold across the portfolio</p></div><span class="panel-action">Portfolio mix</span></div>
        <div class="channel-bar" role="img" aria-label="Policy acquisition channel distribution">
          <div
            *ngFor="let item of portfolio.channels"
            class="channel-segment"
            [class]="'channel-segment ' + item.label.toLowerCase()"
            [style.width.%]="item.percentOfPolicies"
            [title]="item.label + ': ' + item.percentOfPolicies + '%'">
          </div>
        </div>
        <div class="channel-legend">
          <div class="legend-item" *ngFor="let item of portfolio.channels">
            <span [class]="'channel-icon ' + item.label.toLowerCase()">●</span>
            <span>{{ item.label }}</span>
            <strong>{{ item.count | number }} policies · {{ item.percentOfPolicies }}%</strong>
          </div>
        </div>
      </article>
      <article class="panel portfolio-list city-list"><div class="panel-heading"><div><h2>Portfolio by city</h2><p>Policy concentration</p></div></div><div class="portfolio-city" *ngFor="let item of portfolio.cities.slice(0, 5)"><span>{{ item.label }}</span><div class="portfolio-track"><i [style.width.%]="portfolio.summary.policyCount ? item.count / portfolio.summary.policyCount * 100 : 0"></i></div><strong>{{ item.count | number }}</strong></div></article>
    </section>
  `,
})
export class PolicyPortfolioComponent {
  @Input({ required: true }) portfolio!: PolicyPortfolio;
  @Input({ required: true }) years: (number | string)[] = [];
  @Input({ required: true }) selectedYear: number | string = 'All years';
  @Output() yearChange = new EventEmitter<number | string>();

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(value);
  }
}
