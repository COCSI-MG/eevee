import { BigQuery, TableField } from '@google-cloud/bigquery';
import { randomBytes } from 'crypto';

const projectId = process.env.GOOGLE_CLOUD_PROJECT;
if (!projectId) {
  throw new Error('GOOGLE_CLOUD_PROJECT env var is required to use test-utils/bq');
}

const DATASET_ID = process.env.EEVEE_BQ_DATASET || 'eevee_ab_validation';
const LOCATION = process.env.EEVEE_BQ_LOCATION || 'US';
const TABLE_TTL_MS = 60 * 60 * 1000;

export const bq = new BigQuery({ projectId });

let datasetReady: Promise<void> | undefined;
async function ensureDataset(): Promise<void> {
  if (!datasetReady) {
    datasetReady = (async () => {
      const dataset = bq.dataset(DATASET_ID);
      const [exists] = await dataset.exists();
      if (!exists) {
        await bq.createDataset(DATASET_ID, { location: LOCATION });
      }
    })().catch((err) => {
      datasetReady = undefined;
      throw err;
    });
  }
  return datasetReady;
}

export interface SeededTable {
  name: string;
  fqn: string;
  drop: () => Promise<void>;
}

export async function seedTable(
  prefix: string,
  schema: TableField[],
  rows: Record<string, unknown>[],
): Promise<SeededTable> {
  await ensureDataset();
  const dataset = bq.dataset(DATASET_ID);
  const tableName = `${prefix}_${randomBytes(4).toString('hex')}`;

  await dataset.createTable(tableName, {
    schema,
    expirationTime: String(Date.now() + TABLE_TTL_MS),
  });

  if (rows.length) {
    const cols = schema.map((f) => f.name as string);
    const values = rows
      .map(
        (row) =>
          '(' + cols.map((c) => bqLiteral(row[c])).join(', ') + ')',
      )
      .join(', ');

    await bq.query({
      query: `INSERT INTO \`${projectId}.${DATASET_ID}.${tableName}\` (${cols
        .map((c) => `\`${c}\``)
        .join(', ')}) VALUES ${values}`,
      location: LOCATION,
    });
  }

  return {
    name: tableName,
    fqn: `\`${projectId}.${DATASET_ID}.${tableName}\``,
    drop: async () => {
      try {
        await dataset.table(tableName).delete();
      } catch {
        // table expiration is a safety net
      }
    },
  };
}

function bqLiteral(v: unknown): string {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  const escaped = String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `'${escaped}'`;
}
