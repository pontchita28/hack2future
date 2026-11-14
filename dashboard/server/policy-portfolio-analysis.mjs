import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseCsv } from './clean-data.mjs';

const policiesPath = resolve(import.meta.dirname, 'data', 'policies.csv');

export async function getPolicyPortfolio(selectedYear = null) {
  const [policiesCsv, claimsCsv] = await Promise.all([
    readFile(policiesPath, 'utf8'),
    readFile(resolve(import.meta.dirname, 'data', 'claims.csv'), 'utf8'),
  ]);
  const rows = parseCsv(policiesCsv);
  const claimRows = parseCsv(claimsCsv);
  const headers = rows.shift() ?? [];
  const claimHeaders = claimRows.shift() ?? [];
  const indexes = Object.fromEntries([
    'policy_id',
    'customer_id',
    'customer_age',
    'start_date',
    'annual_premium',
    'renewal_status',
    'policy_type',
    'risk_band',
    'channel',
    'city',
  ].map((column) => [column, headers.indexOf(column)]));
  const claimPolicyIdIndex = claimHeaders.indexOf('policy_id');
  const claimAmountIndex = claimHeaders.indexOf('claim_amount');
  const claimPaidAmountIndex = claimHeaders.indexOf('paid_amount');
  const years = new Set();
  const policies = rows.filter((row) => {
    const year = row[indexes.start_date]?.slice(0, 4);
    if (/^\d{4}$/.test(year)) {
      years.add(Number(year));
    }
    return !selectedYear || Number(year) === selectedYear;
  });
  const totalAnnualPremium = policies.reduce((total, row) => total + parseAmount(row[indexes.annual_premium]), 0);
  const currentYear = new Date().getFullYear();
  const renewalEligible = policies.filter((row) => Number(row[indexes.start_date]?.slice(0, 4)) < currentYear);
  const renewed = renewalEligible.filter((row) => row[indexes.renewal_status] === 'Renewed').length;

  return {
    years: [...years].sort(),
    summary: {
      policyCount: policies.length,
      customerCount: new Set(policies.map((row) => row[indexes.customer_id]?.trim()).filter(Boolean)).size,
      totalAnnualPremium: Number(totalAnnualPremium.toFixed(2)),
      averagePremium: policies.length ? Number((totalAnnualPremium / policies.length).toFixed(2)) : 0,
      renewedCount: renewed,
      renewalEligibleCount: renewalEligible.length,
      renewalRate: renewalEligible.length ? Number(((renewed / renewalEligible.length) * 100).toFixed(2)) : null,
    },
    policyTypes: countBy(policies, indexes.policy_type),
    riskBands: countBy(policies, indexes.risk_band),
    channels: getChannelLossRatios(policies, indexes, claimRows, claimPolicyIdIndex, claimAmountIndex),
    customerBreakdown: {
      ageBands: countUniqueCustomers(policies, indexes.customer_id, (row) => ageBand(row[indexes.customer_age])),
      riskBands: countUniqueCustomers(policies, indexes.customer_id, (row) => row[indexes.risk_band]),
      channels: countUniqueCustomers(policies, indexes.customer_id, (row) => row[indexes.channel]),
      policyTypes: countUniqueCustomers(policies, indexes.customer_id, (row) => row[indexes.policy_type]),
    },
    ageProfiles: getAgeProfiles(policies, indexes, claimRows, claimPolicyIdIndex, claimAmountIndex, claimPaidAmountIndex),
    cities: countBy(policies, indexes.city),
  };
}

function getAgeProfiles(policies, indexes, claims, claimPolicyIdIndex, claimAmountIndex, claimPaidAmountIndex) {
  const profiles = new Map();
  const policyAgeBands = new Map();
  for (const row of policies) {
    const age = ageBand(row[indexes.customer_age]);
    const profile = profiles.get(age) ?? {
      label: age,
      customers: new Set(),
      policyCount: 0,
      riskBands: new Map(),
      channels: new Map(),
      policyTypes: new Map(),
      claimCount: 0,
      claimedTotal: 0,
      paidTotal: 0,
    };
    const customerId = row[indexes.customer_id]?.trim();
    if (customerId) {
      profile.customers.add(customerId);
    }
    profile.policyCount += 1;
    increment(profile.riskBands, row[indexes.risk_band]);
    increment(profile.channels, row[indexes.channel]);
    increment(profile.policyTypes, row[indexes.policy_type]);
    policyAgeBands.set(row[indexes.policy_id], age);
    profiles.set(age, profile);
  }

  for (const claim of claims) {
    const age = policyAgeBands.get(claim[claimPolicyIdIndex]);
    const profile = profiles.get(age);
    if (!profile) {
      continue;
    }
    profile.claimCount += 1;
    profile.claimedTotal += parseAmount(claim[claimAmountIndex]);
    profile.paidTotal += parseAmount(claim[claimPaidAmountIndex]);
  }

  return [...profiles.values()]
    .sort((first, second) => ageBandOrder(first.label) - ageBandOrder(second.label))
    .map((profile) => ({
      label: profile.label,
      customerCount: profile.customers.size,
      policyCount: profile.policyCount,
      riskBand: mostCommon(profile.riskBands),
      channel: mostCommon(profile.channels),
      policyType: mostCommon(profile.policyTypes),
      averageClaimAmount: profile.claimCount ? Number((profile.claimedTotal / profile.claimCount).toFixed(2)) : 0,
      averagePaidAmount: profile.claimCount ? Number((profile.paidTotal / profile.claimCount).toFixed(2)) : 0,
    }));
}

function increment(counts, value) {
  const label = value?.trim() || 'Unknown';
  counts.set(label, (counts.get(label) ?? 0) + 1);
}

function mostCommon(counts) {
  return [...counts.entries()].sort((first, second) => second[1] - first[1])[0]?.[0] ?? 'Unknown';
}

function ageBandOrder(label) {
  return ['Under 25', '25-34', '35-44', '45-54', '55-64', '65+', 'Unknown'].indexOf(label);
}

function getChannelLossRatios(selectedPolicies, indexes, claims, claimPolicyIdIndex, claimAmountIndex) {
    const channelByPolicy = new Map();
    const premiumByPolicy = new Map();
    for (const row of selectedPolicies) {
      const policyId = row[indexes.policy_id];
      channelByPolicy.set(policyId, row[indexes.channel]?.trim() || 'Unknown');
      premiumByPolicy.set(policyId, parseAmount(row[indexes.annual_premium]));
    }
    const totals = new Map();
    for (const [policyId, channel] of channelByPolicy) {
      const summary = totals.get(channel) ?? { label: channel, count: 0, annualPremium: 0, incurredClaims: 0 };
      summary.count += 1;
      summary.annualPremium += premiumByPolicy.get(policyId) ?? 0;
      totals.set(channel, summary);
    }
    for (const claim of claims) {
      const channel = channelByPolicy.get(claim[claimPolicyIdIndex]);
      if (!channel) {
        continue;
      }
      const summary = totals.get(channel);
      summary.incurredClaims += parseAmount(claim[claimAmountIndex]);
    }
    const totalPolicies = selectedPolicies.length;
    return [...totals.values()]
      .sort((first, second) => second.count - first.count)
      .map((summary) => ({
        ...summary,
        annualPremium: Number(summary.annualPremium.toFixed(2)),
        incurredClaims: Number(summary.incurredClaims.toFixed(2)),
        lossRatio: summary.annualPremium ? Number(((summary.incurredClaims / summary.annualPremium) * 100).toFixed(2)) : 0,
        percentOfPolicies: totalPolicies ? Number(((summary.count / totalPolicies) * 100).toFixed(2)) : 0,
      }));
}

function countBy(rows, index) {
  const counts = new Map();
  for (const row of rows) {
    const value = row[index]?.trim() || 'Unknown';
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((first, second) => second.count - first.count);
}

function countUniqueCustomers(rows, customerIndex, valueForRow) {
  const customersByValue = new Map();
  for (const row of rows) {
    const customerId = row[customerIndex]?.trim();
    if (!customerId) {
      continue;
    }
    const value = valueForRow(row)?.trim() || 'Unknown';
    const customers = customersByValue.get(value) ?? new Set();
    customers.add(customerId);
    customersByValue.set(value, customers);
  }

  return [...customersByValue.entries()]
    .map(([label, customers]) => ({ label, count: customers.size }))
    .sort((first, second) => second.count - first.count);
}

function ageBand(value) {
  const age = Number(value);
  if (!Number.isFinite(age)) {
    return 'Unknown';
  }
  if (age < 25) {
    return 'Under 25';
  }
  if (age < 35) {
    return '25-34';
  }
  if (age < 45) {
    return '35-44';
  }
  if (age < 55) {
    return '45-54';
  }
  if (age < 65) {
    return '55-64';
  }
  return '65+';
}

function parseAmount(value) {
  const amount = Number((value ?? '').replace(/[$,]/g, '').trim());
  return Number.isFinite(amount) ? amount : 0;
}
