import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseCsv } from './clean-data.mjs';

const claimsPath = resolve(import.meta.dirname, 'data', 'claims.csv');
const policiesPath = resolve(import.meta.dirname, 'data', 'policies.csv');

export async function getTeamOverview(selectedYear = null) {
  const [claimsCsv, policiesCsv] = await Promise.all([
    readFile(claimsPath, 'utf8'),
    readFile(policiesPath, 'utf8'),
  ]);
  const claims = parseCsv(claimsCsv);
  const policies = parseCsv(policiesCsv);
  const claimHeaders = claims.shift() ?? [];
  const policyHeaders = policies.shift() ?? [];
  const policyIdIndex = policyHeaders.indexOf('policy_id');
  const customerIdIndex = policyHeaders.indexOf('customer_id');
  const cityIndex = policyHeaders.indexOf('city');
  const claimPolicyIdIndex = claimHeaders.indexOf('policy_id');
  const teamIndex = claimHeaders.indexOf('adjuster_team');
  const statusIndex = claimHeaders.indexOf('status');
  const typeIndex = claimHeaders.indexOf('claim_type');
  const amountIndex = claimHeaders.indexOf('claim_amount');
  const lossDateIndex = claimHeaders.indexOf('loss_date');
  const policyDetails = new Map(policies.map((row) => [
    row[policyIdIndex],
    { city: row[cityIndex] || 'Unknown', customerId: row[customerIdIndex] || 'Unknown' },
  ]));
  const teams = new Map();
  const years = new Set();
  const allClientIds = new Set();

  for (const claim of claims) {
    const claimYear = claim[lossDateIndex]?.slice(0, 4);
    if (/^\d{4}$/.test(claimYear)) {
      years.add(Number(claimYear));
    }
    if (selectedYear && Number(claimYear) !== selectedYear) {
      continue;
    }
    const team = claim[teamIndex]?.trim() || 'Unassigned';
    const summary = teams.get(team) ?? {
      team,
      claimCount: 0,
      clientIds: new Set(),
      totalClaimAmount: 0,
      percentOfClaimAmount: 0,
      underReview: 0,
      statusCounts: {},
      typeCounts: {},
      locationCounts: {},
    };
    const status = claim[statusIndex]?.trim() || 'Unknown';
    const type = claim[typeIndex]?.trim() || 'Unknown';
    const policy = policyDetails.get(claim[claimPolicyIdIndex]);
    const location = policy?.city || 'Unknown';
    const clientId = policy?.customerId || 'Unknown';
    summary.claimCount += 1;
    if (clientId !== 'Unknown') {
      summary.clientIds.add(clientId);
      allClientIds.add(clientId);
    }
    summary.totalClaimAmount += parseAmount(claim[amountIndex]);
    summary.underReview += status === 'Under Review' ? 1 : 0;
    summary.statusCounts[status] = (summary.statusCounts[status] ?? 0) + 1;
    summary.typeCounts[type] = (summary.typeCounts[type] ?? 0) + 1;
    summary.locationCounts[location] = (summary.locationCounts[location] ?? 0) + 1;
    teams.set(team, summary);
  }

  const teamSummaries = [...teams.values()];
  const totalClaimAmount = teamSummaries
    .reduce((total, summary) => total + summary.totalClaimAmount, 0);
  const totalClaims = teamSummaries.reduce((total, summary) => total + summary.claimCount, 0);
  const data = teamSummaries
    .sort((first, second) => second.claimCount - first.claimCount)
    .map(({ clientIds, ...summary }) => ({
      ...summary,
      clientCount: clientIds.size,
      totalClaimAmount: Number(summary.totalClaimAmount.toFixed(2)),
      percentOfClaimAmount: totalClaimAmount
        ? Number(((summary.totalClaimAmount / totalClaimAmount) * 100).toFixed(2))
        : 0,
      percentOfClaims: totalClaims ? Number(((summary.claimCount / totalClaims) * 100).toFixed(2)) : 0,
      percentOfClients: allClientIds.size ? Number(((clientIds.size / allClientIds.size) * 100).toFixed(2)) : 0,
      topType: getTopEntry(summary.typeCounts),
      topLocation: getTopEntry(summary.locationCounts),
    }));
  return { years: [...years].sort(), data };
}

function parseAmount(value) {
  const amount = Number((value ?? '').replace(/[$,]/g, '').trim());
  return Number.isFinite(amount) ? amount : 0;
}

function getTopEntry(counts) {
  const [name, count] = Object.entries(counts).sort((first, second) => second[1] - first[1])[0] ?? ['Unknown', 0];
  return { name, count };
}
