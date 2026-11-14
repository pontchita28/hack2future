import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { cleanData } from './clean-data.mjs';
import { getBrokerStats } from './broker-analysis.mjs';
import { getPoliciesByChannel } from './policies-analysis.mjs';
import { getTeamOverview } from './teams-analysis.mjs';
import { getPolicyPortfolio } from './policy-portfolio-analysis.mjs';

const dataDirectory = resolve(import.meta.dirname, 'data');
const port = Number(process.env.PORT ?? 3000);
const routes = new Map([
  ['/api/claims', 'claims.csv'],
  ['/api/policies', 'policies.csv'],
]);

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host ?? 'localhost'}`);
  if (requestUrl.pathname === '/api/brokers') {
    try {
      const stats = await getBrokerStats();
      response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify(stats));
    } catch (error) {
      console.error('Unable to calculate broker statistics', error);
      response.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ error: 'Unable to calculate broker statistics' }));
    }
    return;
  }
  if (requestUrl.pathname === '/api/policies-by-channel') {
    try {
      const yearParameter = requestUrl.searchParams.get('year');
      const selectedYear = yearParameter ? Number(yearParameter) : null;
      const stats = await getPoliciesByChannel(Number.isInteger(selectedYear) ? selectedYear : null);
      response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify(stats));
    } catch (error) {
      console.error('Unable to calculate policies by channel', error);
      response.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ error: 'Unable to calculate policies by channel' }));
    }
    return;
  }
  if (requestUrl.pathname === '/api/team-overview') {
    try {
      const yearParameter = requestUrl.searchParams.get('year');
      const selectedYear = yearParameter ? Number(yearParameter) : null;
      const overview = await getTeamOverview(Number.isInteger(selectedYear) ? selectedYear : null);
      response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify(overview));
    } catch (error) {
      console.error('Unable to calculate team overview', error);
      response.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ error: 'Unable to calculate team overview' }));
    }
    return;
  }
  if (requestUrl.pathname === '/api/policy-portfolio') {
    try {
      const yearParameter = requestUrl.searchParams.get('year');
      const selectedYear = yearParameter ? Number(yearParameter) : null;
      const portfolio = await getPolicyPortfolio(Number.isInteger(selectedYear) ? selectedYear : null);
      response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify(portfolio));
    } catch (error) {
      console.error('Unable to calculate policy portfolio', error);
      response.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ error: 'Unable to calculate policy portfolio' }));
    }
    return;
  }

  const fileName = routes.get(requestUrl.pathname);
  if (!fileName) {
    response.writeHead(404, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ error: 'Route not found' }));
    return;
  }

  try {
    const csv = await readFile(resolve(dataDirectory, fileName), 'utf8');
    response.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Access-Control-Allow-Origin': 'http://localhost:4200',
    });
    response.end(csv);
  } catch (error) {
    console.error(`Unable to load ${fileName}`, error);
    response.writeHead(500, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ error: 'Unable to load dashboard data' }));
  }
});

cleanData()
  .then(({ claims, policies }) => {
    server.listen(port, () => {
      console.log(`Claims data API listening on http://localhost:${port} (${claims} claims, ${policies} policies)`);
    });
  })
  .catch((error) => {
    console.error('Unable to clean server data before starting API', error);
    process.exitCode = 1;
  });
