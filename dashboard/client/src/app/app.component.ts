import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { PolicyPortfolio, Summary, TeamOverview, TeamOverviewResponse } from './dashboard.models';
import { SummaryCardComponent } from './summary-card.component';
import { TeamOverviewComponent } from './team-overview.component';
import { TeamDashboardComponent } from './team-dashboard.component';
import { PolicyPortfolioComponent } from './policy-portfolio.component';
import { CustomerDashboardComponent } from './customer-dashboard.component';

interface Claim {
  claimId: string;
  policyId: string;
  claimType: string;
  amount: number;
  paid: number;
  status: string;
  team: string;
  lossDate: Date;
  city: string;
  annualPremium: number;
}

interface Policy {
  policyId: string;
  customerId: string;
  city: string;
  policyType: string;
  annualPremium: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, SummaryCardComponent, TeamOverviewComponent, TeamDashboardComponent, PolicyPortfolioComponent, CustomerDashboardComponent],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  claims: Claim[] = [];
  filteredClaims: Claim[] = [];
  statuses = ['All statuses', 'Open', 'Under Review', 'Paid', 'Denied'];
  claimTypes = ['All claim types'];
  selectedStatus = 'All statuses';
  selectedType = 'All claim types';
  isLoading = true;
  errorMessage = '';
  summary: Summary[] = [];
  statusCounts: { label: string; count: number; color: string }[] = [];
  typeCounts: { label: string; count: number }[] = [];
  monthlyCounts: { label: string; count: number; height: number }[] = [];
  cityCounts: { city: string; count: number; amount: number }[] = [];
  teamOverview: TeamOverview[] = [];
  teamYears: (number | string)[] = [];
  selectedTeamYear: number | string = 'All years';
  activeDashboard: 'claims' | 'teams' | 'portfolio' | 'customers' = 'claims';
  policyPortfolio!: PolicyPortfolio;
  portfolioYears: (number | string)[] = [];
  selectedPortfolioYear: number | string = 'All years';

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    forkJoin({
      claims: this.http.get('/api/claims', { responseType: 'text' }),
      policies: this.http.get('/api/policies', { responseType: 'text' }),
      teamOverview: this.http.get<TeamOverviewResponse>('/api/team-overview'),
      policyPortfolio: this.http.get<PolicyPortfolio>('/api/policy-portfolio'),
    }).subscribe({
      next: ({ claims, policies, teamOverview, policyPortfolio }) => {
        const policyMap = this.parsePolicies(policies);
        this.claims = this.parseClaims(claims, policyMap);
        this.claimTypes = ['All claim types', ...Array.from(new Set(this.claims.map((claim) => claim.claimType))).sort()];
        this.teamOverview = teamOverview.data;
        this.teamYears = ['All years', ...teamOverview.years];
        this.policyPortfolio = policyPortfolio;
        this.portfolioYears = ['All years', ...policyPortfolio.years];
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'The dashboard data could not be loaded. Confirm the claims API is running on port 3000.';
        this.isLoading = false;
      },
    });
  }

  onTeamYearChange(): void {
    const query = this.selectedTeamYear === 'All years' ? '' : `?year=${this.selectedTeamYear}`;
    this.http.get<TeamOverviewResponse>(`/api/team-overview${query}`).subscribe({
      next: (response) => {
        this.teamOverview = response.data;
      },
      error: () => {
        this.errorMessage = 'The team overview could not be loaded.';
      },
    });
  }

  onPortfolioYearChange(): void {
    const query = this.selectedPortfolioYear === 'All years' ? '' : `?year=${this.selectedPortfolioYear}`;
    this.http.get<PolicyPortfolio>(`/api/policy-portfolio${query}`).subscribe({
      next: (portfolio) => {
        this.policyPortfolio = portfolio;
      },
      error: () => {
        this.errorMessage = 'The policy portfolio could not be loaded.';
      },
    });
  }

  onCustomerYearChange(): void {
    this.onPortfolioYearChange();
  }

  applyFilters(): void {
    this.filteredClaims = this.claims.filter((claim) =>
      (this.selectedStatus === 'All statuses' || claim.status === this.selectedStatus) &&
      (this.selectedType === 'All claim types' || claim.claimType === this.selectedType)
    );
    this.buildVisuals();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(value);
  }

  private buildVisuals(): void {
    const total = this.filteredClaims.reduce((sum, claim) => sum + claim.amount, 0);
    const paid = this.filteredClaims.reduce((sum, claim) => sum + claim.paid, 0);
    const reserve = Math.max(total - paid, 0);
    const open = this.filteredClaims.filter((claim) => claim.status === 'Open' || claim.status === 'Under Review').length;
    const avg = this.filteredClaims.length ? total / this.filteredClaims.length : 0;
    const premium = this.filteredClaims.reduce((sum, claim) => sum + claim.annualPremium, 0);
    this.summary = [
      { label: 'Gross incurred', value: this.formatCurrency(total), detail: `${this.filteredClaims.length} claims in view`, tone: 'violet' },
      { label: 'Paid cash', value: this.formatCurrency(paid), detail: `${total ? Math.round((paid / total) * 100) : 0}% of incurred`, tone: 'mint' },
      { label: 'Open reserve', value: this.formatCurrency(reserve), detail: `${open} claims need attention`, tone: 'orange' },
      { label: 'Loss ratio', value: `${premium ? Math.round((total / premium) * 100) : 0}%`, detail: 'Incurred claims / premium', tone: 'blue' },
    ];

    const statuses = ['Open', 'Under Review', 'Paid', 'Denied'];
    const colors = ['#ff9b71', '#d2096a', '#ff72b5', '#8b245f'];
    this.statusCounts = statuses.map((label, index) => ({
      label,
      count: this.filteredClaims.filter((claim) => claim.status === label).length,
      color: colors[index],
    }));
    this.typeCounts = Array.from(new Set(this.filteredClaims.map((claim) => claim.claimType)))
      .map((label) => ({ label, count: this.filteredClaims.filter((claim) => claim.claimType === label).length }))
      .sort((a, b) => b.count - a.count);
    const monthMap = new Map<string, number>();
    this.filteredClaims.forEach((claim) => {
      const month = claim.lossDate.toLocaleString('en-CA', { month: 'short' });
      monthMap.set(month, (monthMap.get(month) ?? 0) + 1);
    });
    const monthOrder = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
    const maxMonth = Math.max(...monthOrder.map((month) => monthMap.get(month) ?? 0), 1);
    this.monthlyCounts = monthOrder.map((label) => ({
      label,
      count: monthMap.get(label) ?? 0,
      height: Math.max(((monthMap.get(label) ?? 0) / maxMonth) * 100, 4),
    }));
    const cityMap = new Map<string, { count: number; amount: number }>();
    this.filteredClaims.forEach((claim) => {
      const entry = cityMap.get(claim.city) ?? { count: 0, amount: 0 };
      cityMap.set(claim.city, { count: entry.count + 1, amount: entry.amount + claim.amount });
    });
    this.cityCounts = Array.from(cityMap.entries())
      .map(([city, values]) => ({ city, ...values }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }

  private parsePolicies(csv: string): Map<string, Policy> {
    const rows = this.parseCsv(csv);
    return new Map(rows.slice(1).map((row) => [row[0], { policyId: row[0], customerId: row[1], city: row[3], policyType: row[4], annualPremium: row[10] }]));
  }

  private parseClaims(csv: string, policies: Map<string, Policy>): Claim[] {
    return this.parseCsv(csv).slice(1).map((row) => {
      const policy = policies.get(row[1]);
      return {
        claimId: row[0],
        policyId: row[1],
        claimType: row[4] || 'Unknown',
        amount: this.parseMoney(row[5]),
        paid: this.parseMoney(row[8]),
        status: row[7] || 'Unknown',
        team: row[6] || 'Unassigned',
        lossDate: new Date(row[2]),
        city: policy?.city || 'Unknown',
        annualPremium: this.parseMoney(policy?.annualPremium || '0'),
      };
    });
  }

  private parseMoney(value: string): number {
    const parsed = Number((value || '0').replace(/[$,]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private parseCsv(csv: string): string[][] {
    return csv.trim().split(/\r?\n/).map((line) => line.split(',').map((value) => value.trim().replace(/^"|"$/g, '')));
  }
}
