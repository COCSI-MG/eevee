import { BigQuery } from "@google-cloud/bigquery";
import { createBigQueryAdapter } from "@teraorm/bigquery";
import { defineModel, tera } from "teraorm";

function parseTableFqn(tableFqn: string) {
  const [projectId, datasetId, tableName] = tableFqn
    .replace(/`/g, "")
    .split(".");

  if (!projectId || !datasetId || !tableName) {
    throw new Error(
      `Invalid table reference: ${tableFqn}. Expected format \`project.dataset.table\`.`,
    );
  }

  return { projectId, datasetId, tableName };
}

export function createTeraRepository(
  bq: BigQuery,
  tableFqn: string,
  modelName: string,
  schema: Record<string, unknown>,
) {
  const { projectId, datasetId, tableName } = parseTableFqn(tableFqn);

  const adapter = createBigQueryAdapter({
    projectId,
    datasetId,
    tableName,
    bigquery: bq,
  });

  const model = defineModel(modelName, schema);
  return tera(model, adapter);
}
