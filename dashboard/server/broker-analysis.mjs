import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseCsv } from './clean-data.mjs';

const policiesPath = resolve(import.meta.dirname, 'data', 'policies.csv');

export async function getBrokerStats() {
  const rows = parseCsv(await readFile(policiesPath, 'utf8'));
  const headers = rows.shift() ?? [];
  const yearIndex = headers.indexOf('start_date');
  const brokerIndex = headers.indexOf('broker_code');
  const brokersByYear = new Map();

  for (const row of rows) {
    const year = row[yearIndex]?.slice(0, 4);
    const brokerCode = row[brokerIndex]?.trim();
    if (!/^\d{4}$/.test(year) || !brokerCode) {
      continue;
    }
    const brokers = brokersByYear.get(year) ?? new Set();
    brokers.add(brokerCode);
    brokersByYear.set(year, brokers);
  }

  let previousCount = null;
  return [...brokersByYear.entries()]
    .sort(([firstYear], [secondYear]) => firstYear.localeCompare(secondYear))
    .map(([year, brokers]) => {
      const count = brokers.size;
      const percentIncrease = previousCount && previousCount > 0
        ? Number((((count - previousCount) / previousCount) * 100).toFixed(2))
        : null;
      previousCount = count;
      return { year: Number(year), brokerCount: count, percentIncrease };
    });
}
