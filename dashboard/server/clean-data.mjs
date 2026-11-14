import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const dataDirectory = resolve(import.meta.dirname, 'data');
const cityDictionaryPath = resolve(dataDirectory, 'city-dictionary.json');
const dateColumns = {
  claims: ['loss_date', 'reported_date', 'closed_date'],
  policies: ['start_date'],
};

export async function cleanData() {
  const cityDictionary = await loadCityDictionary();
  const claims = await cleanCsvFile('claims.csv', dateColumns.claims, cityDictionary);
  const policies = await cleanCsvFile('policies.csv', dateColumns.policies, cityDictionary);
  await writeFile(cityDictionaryPath, `${JSON.stringify(cityDictionary, null, 2)}\n`, 'utf8');
  return { claims, policies };
}

async function cleanCsvFile(fileName, columns, cityDictionary) {
  const filePath = resolve(dataDirectory, fileName);
  const rows = parseCsv(await readFile(filePath, 'utf8'));
  const headers = rows.shift() ?? [];
  const claimAmountIndex = headers.indexOf('claim_amount');
  const startDateIndex = headers.indexOf('start_date');
  const cleanedRows = rows
    .filter((row) =>
      !containsTestValue(row) &&
      (claimAmountIndex === -1 || isNumericAmount(row[claimAmountIndex])) &&
      (startDateIndex === -1 || Boolean(row[startDateIndex]?.trim()))
    )
    .map((row) => {
      const record = Object.fromEntries(headers.map((header, index) => [header, row[index] ?? '']));
      for (const column of columns) {
        record[column] = normalizeDate(record[column]);
      }
      if ('city' in record) {
        record.city = normalizeCity(record.city, cityDictionary);
      }
      return headers.map((header) => record[header]);
    });

  await writeFile(filePath, stringifyCsv(headers, cleanedRows), 'utf8');
  return cleanedRows.length;
}

async function loadCityDictionary() {
  const dictionary = JSON.parse(await readFile(cityDictionaryPath, 'utf8'));
  if (!dictionary.aliases || !dictionary.codes) {
    throw new Error('city-dictionary.json must contain aliases and codes objects');
  }
  ensureCanonicalAliases(dictionary);
  return dictionary;
}

function containsTestValue(row) {
  return row.some((value) => /test/i.test(value));
}

function isNumericAmount(value) {
  if (!value?.trim()) {
    return false;
  }
  const amount = Number(value.replace(/[$,]/g, '').trim());
  return Number.isFinite(amount);
}

function normalizeDate(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  const slashDate = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashDate) {
    return `${slashDate[3]}-${slashDate[2].padStart(2, '0')}-${slashDate[1].padStart(2, '0')}`;
  }
  throw new Error(`Unsupported date format: ${value}`);
}

function normalizeCity(value, cityDictionary) {
  const original = value.trim();
  const key = normalizeAliasKey(original);
  const knownCode = cityDictionary.aliases[key] ?? cityDictionary.aliases[normalizeCompactAliasKey(original)];
  if (knownCode) {
    return knownCode;
  }
  const code = original.toUpperCase();
  if (cityDictionary.codes[code]) {
    return code;
  }

  const generatedCode = original
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/gi, '')
    .slice(0, 3)
    .toUpperCase();
  if (!generatedCode) {
    return original;
  }
  cityDictionary.codes[generatedCode] ??= original;
  registerCityAliases(cityDictionary, original, generatedCode);
  return generatedCode;
}

function ensureCanonicalAliases(cityDictionary) {
  for (const [code, city] of Object.entries(cityDictionary.codes)) {
    registerCityAliases(cityDictionary, city, code);
    registerCityAliases(cityDictionary, code, code);
  }
}

function registerCityAliases(cityDictionary, value, code) {
  cityDictionary.aliases[normalizeAliasKey(value)] = code;
  cityDictionary.aliases[normalizeCompactAliasKey(value)] = code;
}

function normalizeAliasKey(value) {
  return value
    .trim()
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeCompactAliasKey(value) {
  return normalizeAliasKey(value).replaceAll(' ', '');
}

export function parseCsv(input) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (character === '"' && quoted && input[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      row.push(value);
      value = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && input[index + 1] === '\n') {
        index += 1;
      }
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
    } else {
      value += character;
    }
  }
  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }
  return rows
    .filter((currentRow) => currentRow.some((cell) => cell.trim()))
    .map((currentRow, rowIndex) => rowIndex === 0
      ? currentRow.map((cell) => cell.replace(/^\uFEFF/, ''))
      : currentRow);
}

function stringifyCsv(headers, rows) {
  return [headers, ...rows]
    .map((row) => row.map((value) => {
      const text = String(value ?? '');
      return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
    }).join(','))
    .join('\n') + '\n';
}
