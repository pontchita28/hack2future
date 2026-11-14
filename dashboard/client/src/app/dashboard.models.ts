export interface Summary {
  label: string;
  value: string;
  detail: string;
  tone: string;
}

export interface ChannelSummary {
  channel: string;
  policyCount: number;
  totalAnnualPremium: number;
  percentOfPolicies: number;
}

export interface ChannelResponse {
  years: number[];
  data: ChannelSummary[];
}

export interface TeamOverview {
  team: string;
  claimCount: number;
  clientCount: number;
  totalClaimAmount: number;
  percentOfClaimAmount: number;
  percentOfClaims: number;
  percentOfClients: number;
  underReview: number;
  statusCounts: Record<string, number>;
  typeCounts: Record<string, number>;
  locationCounts: Record<string, number>;
  topType: { name: string; count: number };
  topLocation: { name: string; count: number };
}

export interface TeamOverviewResponse {
  years: number[];
  data: TeamOverview[];
}

export interface PolicyPortfolio {
  years: number[];
  summary: {
    policyCount: number;
    customerCount: number;
    totalAnnualPremium: number;
    averagePremium: number;
    renewedCount: number;
    renewalEligibleCount: number;
    renewalRate: number | null;
  };
  policyTypes: { label: string; count: number }[];
  riskBands: { label: string; count: number }[];
  channels: { label: string; count: number; annualPremium: number; incurredClaims: number; lossRatio: number; percentOfPolicies: number }[];
  customerBreakdown: {
    ageBands: { label: string; count: number }[];
    riskBands: { label: string; count: number }[];
    channels: { label: string; count: number }[];
    policyTypes: { label: string; count: number }[];
  };
  ageProfiles: {
    label: string;
    customerCount: number;
    policyCount: number;
    riskBand: string;
    channel: string;
    policyType: string;
    averageClaimAmount: number;
    averagePaidAmount: number;
  }[];
  cities: { label: string; count: number }[];
}
