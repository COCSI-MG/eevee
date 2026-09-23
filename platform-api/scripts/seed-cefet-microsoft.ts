import * as dotenv from 'dotenv';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { DataSource, QueryRunner } from 'typeorm';
import { PublicClientApplication } from '@azure/msal-node';
import { HashUtils } from '../src/utils/hash.utils';
import { readCefetRoster, RosterCourse } from './cefet-roster';

dotenv.config({ path: join(__dirname, '../.env') });
const GRAPH = 'https://graph.microsoft.com/v1.0';
const SCOPES = ['User.ReadBasic.All'];
const fold = (value: string) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLocaleUpperCase('pt-BR');

type GraphUser = { id: string; displayName?: string; userPrincipalName?: string; mail?: string };

async function graphUsers(token: string): Promise<GraphUser[]> {
  const users: GraphUser[] = [];
  let next: string | undefined = `${GRAPH}/users?$select=id,displayName,userPrincipalName,mail&$top=999`;
  while (next) {
    const response = await fetch(next, { headers: { Authorization: `Bearer ${token}` } });
    if (response.status === 429) {
      const retry = Number(response.headers.get('retry-after') ?? 2);
      await new Promise((resolve) => setTimeout(resolve, Math.min(retry, 30) * 1000));
      continue;
    }
    if (!response.ok) throw new Error(`Microsoft Graph users request failed: HTTP ${response.status}`);
    const page = await response.json() as { value: GraphUser[]; '@odata.nextLink'?: string };
    users.push(...page.value);
    next = page['@odata.nextLink'];
  }
  return users;
}

function resolveRoster(users: GraphUser[], courses: RosterCourse[]) {
  const byName = new Map<string, GraphUser[]>();
  for (const user of users) {
    if (!user.displayName) continue;
    const key = fold(user.displayName);
    byName.set(key, [...(byName.get(key) ?? []), user]);
  }
  const matches: Array<{ course: string; rosterName: string; user: GraphUser }> = [];
  const missing: Array<{ course: string; rosterName: string }> = [];
  const ambiguous: Array<{ course: string; rosterName: string; candidates: string[] }> = [];
  for (const course of courses) for (const rosterName of course.students) {
    const candidates = byName.get(fold(rosterName)) ?? [];
    if (candidates.length === 1) matches.push({ course: course.name, rosterName, user: candidates[0] });
    else if (!candidates.length) missing.push({ course: course.name, rosterName });
    else ambiguous.push({ course: course.name, rosterName, candidates: candidates.map((u) => u.userPrincipalName ?? u.mail ?? u.id) });
  }
  return { matches, missing, ambiguous };
}

async function enroll(query: QueryRunner, match: { course: string; user: GraphUser }, dryRun: boolean) {
  const email = match.user.mail ?? match.user.userPrincipalName;
  if (!email) throw new Error(`Matched Microsoft user has no mail/UPN: ${match.user.id}`);
  const classRows = await query.query(`SELECT "id" FROM "class" WHERE "name" = $1 LIMIT 1`, [match.course]);
  if (!classRows.length) throw new Error(`EEVEE class not found: ${match.course}`);
  if (dryRun) return;
  // Never-usable password: a real bcrypt hash of a random, immediately-discarded secret.
  // Avoids relying on how bcrypt.compareSync handles a non-hash literal.
  const placeholderPasswordHash = HashUtils.hashPassword(randomUUID());
  const userRows = await query.query(`INSERT INTO "user" ("email", "name", "isAdmin", "passwordHash", "externalSubject", "identityProvider") VALUES ($1, $2, false, $3, $4, 'microsoft') ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name", "externalSubject" = EXCLUDED."externalSubject", "identityProvider" = EXCLUDED."identityProvider" RETURNING "id"`, [email, match.user.displayName ?? email, placeholderPasswordHash, match.user.id]);
  await query.query(`INSERT INTO "user_class" ("userId", "classId") VALUES ($1, $2) ON CONFLICT ("userId", "classId") DO NOTHING`, [userRows[0].id, classRows[0].id]);
}

async function main() {
  const rosterPath = process.argv[2];
  if (!rosterPath) throw new Error('Usage: ts-node scripts/seed-cefet-microsoft.ts <roster.txt> [--dry-run]');
  const tenantId = process.env.MICROSOFT_TENANT_ID;
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  if (!tenantId || !clientId) throw new Error('Set MICROSOFT_TENANT_ID and MICROSOFT_CLIENT_ID for the CEFET tenant application.');
  const dryRun = process.argv.includes('--dry-run');
  const courses = await readCefetRoster(rosterPath);
  const msal = new PublicClientApplication({ auth: { clientId, authority: `https://login.microsoftonline.com/${tenantId}` } });
  const auth = await msal.acquireTokenByDeviceCode({ scopes: SCOPES, deviceCodeCallback: (message) => console.log(message) });
  if (!auth?.accessToken) throw new Error('Microsoft device-code login did not return an access token.');
  const result = resolveRoster(await graphUsers(auth.accessToken), courses);
  console.log(JSON.stringify({ courses: courses.map((c) => ({ name: c.name, students: c.students.length })), matched: result.matches.length, missing: result.missing, ambiguous: result.ambiguous, dryRun }, null, 2));
  if (result.missing.length || result.ambiguous.length) throw new Error('Refusing enrollment while roster names are missing or ambiguous. Resolve the report and rerun.');
  const dataSource = new DataSource({ type: 'postgres', host: process.env.PG_HOST ?? 'localhost', port: Number(process.env.PG_PORT ?? 5432), username: process.env.PG_USERNAME, password: process.env.PG_PASSWORD, database: process.env.PG_DATABASE, synchronize: false });
  await dataSource.initialize();
  const runner = dataSource.createQueryRunner(); await runner.connect();
  try { if (!dryRun) await runner.startTransaction(); for (const match of result.matches) await enroll(runner, { course: match.course, user: match.user }, dryRun); if (!dryRun) await runner.commitTransaction(); console.log(dryRun ? 'Dry run complete; no database writes.' : 'CEFET Microsoft enrollment complete.'); } catch (error) { if (!dryRun) await runner.rollbackTransaction(); throw error; } finally { await runner.release(); await dataSource.destroy(); }
}

main().catch((error) => { console.error('CEFET Microsoft seed failed:', error.message); process.exitCode = 1; });
