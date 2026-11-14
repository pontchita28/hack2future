import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseCsv } from './clean-data.mjs';

const policiesPath = resolve(import.meta.dirname, 'data', 'policies.csv');

export async function getPoliciesByChannel(selectedYear = null) {
  const rows = parseCsv(await readFile(policiesPath, 'utf8'));
  const headers = rows.shift() ?? [];
  const yearIndex = headers.indexOf('start_date');
  const channelIndex = headers.indexOf('channel');
  const premiumIndex = headers.indexOf('annual_premium');
  const totals = new Map();
  const years = new Set();

  for (const row of rows) {
    const year = row[yearIndex]?.slice(0, 4);
    if (/^\d{4}$/.test(year)) {
      years.add(Number(year));
    }
    if (selectedYear && Number(year) !== selectedYear) {
      continue;
    }
    const channel = row[channelIndex]?.trim();
    if (!channel) {
      continue;
    }
    const summary = totals.get(channel) ?? { channel, policyCount: 0, totalAnnualPremium: 0 };
    summary.policyCount += 1;
    summary.totalAnnualPremium += parseAmount(row[premiumIndex]);
    totals.set(channel, summary);
  }

  const totalPolicies = [...totals.values()].reduce((total, summary) => total + summary.policyCount, 0);
  const data = [...totals.values()]
    .sort((first, second) => second.policyCount - first.policyCount)
    .map((summary) => ({
      ...summary,
      totalAnnualPremium: Number(summary.totalAnnualPremium.toFixed(2)),
      percentOfPolicies: totalPolicies
        ? Number(((summary.policyCount / totalPolicies) * 100).toFixed(2))
        : 0,
    }));

  return { years: [...years].sort(), data };
}

function parseAmount(value) {
  const amount = Number((value ?? '').replace(/[$,]/g, '').trim());
  return Number.isFinite(amount) ? amount : 0;
}
