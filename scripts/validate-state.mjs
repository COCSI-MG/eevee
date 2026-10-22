import { mkdir, appendFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export function clusterChecks(deployments, pods, jobs) {
  const checks = [];
  const isWorkerPod = (p) =>
    (p.metadata.ownerReferences ?? []).some((owner) => owner.kind === "Job") ||
    Boolean(
      p.metadata.labels?.["job-name"] ||
      p.metadata.labels?.["batch.kubernetes.io/job-name"],
    );
  for (const name of [
    "platform-api-deployment",
    "assignment-runner-deployment",
    "eevee-front-deployment",
    "postgres-deployment",
    "redis-deployment",
  ]) {
    const d = deployments.items.find((item) => item.metadata.name === name);
    const desired = d?.spec.replicas ?? 1;
    checks.push({
      id: `deployment:${name}`,
      ok: Boolean(
        d &&
        desired > 0 &&
        (d.status?.availableReplicas ?? 0) >= desired &&
        (d.status?.updatedReplicas ?? 0) >= desired &&
        (d.status?.observedGeneration ?? 0) >= d.metadata.generation,
      ),
      detail: d
        ? `available=${d.status?.availableReplicas ?? 0}, desired=${desired}`
        : "missing",
    });
  }
  const servicePods = pods.items.filter((p) => !isWorkerPod(p));
  const unhealthy = servicePods.filter(
    (p) =>
      !p.metadata.deletionTimestamp &&
      p.status?.phase !== "Succeeded" &&
      (p.status?.phase === "Failed" ||
        !(p.status?.conditions ?? []).some(
          (c) => c.type === "Ready" && c.status === "True",
        )),
  );
  checks.push({
    id: "pods",
    ok: unhealthy.length === 0,
    detail: `${unhealthy.length} service pods not ready (worker pods excluded)`,
  });
  const failed = jobs.items.filter((j) =>
    (j.status?.conditions ?? []).some(
      (c) => c.type === "Failed" && c.status === "True",
    ),
  );
  checks.push({
    id: "worker-jobs",
    ok: null,
    detail: `${failed.length} failed jobs observed; exit/test failures alone do not establish an infrastructure fault`,
  });
  const crashes = servicePods.flatMap((p) =>
    (p.status?.containerStatuses ?? [])
      .filter((c) => {
        const termination = c.lastState?.terminated;
        const age = Date.now() - Date.parse(termination?.finishedAt);
        return (
          termination &&
          termination.exitCode !== 0 &&
          age >= 0 &&
          age < 24 * 60 * 60 * 1000
        );
      })
      .map(
        (c) =>
          `${p.metadata.name}/${c.name}: restarts=${c.restartCount}, last exit=${c.lastState.terminated.exitCode}`,
      ),
  );
  checks.push({
    id: "container-crashes",
    ok: crashes.length === 0,
    detail: crashes.length
      ? crashes.join("; ")
      : "No abnormal container termination in the last 24 hours",
  });
  return checks;
}

async function github(method, path, body) {
  const response = await fetch(
    `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/${path}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20000),
    },
  );
  if (!response.ok) throw new Error(`GitHub HTTP ${response.status}`);
  return response.status === 204 ? null : response.json();
}

export async function syncIssues(report) {
  if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPOSITORY)
    throw new Error("GitHub token/repository required");
  const issues = [];
  for (let page = 1; ; page++) {
    const batch = await github(
      "GET",
      `issues?state=all&per_page=100&page=${page}`,
    );
    issues.push(...batch.filter((i) => !i.pull_request));
    if (batch.length < 100) break;
  }
  for (const check of report.checks) {
    // Unknown/observational signals cannot open or resolve an incident.
    if (check.ok === null) continue;
    const marker = `<!-- eevee-state:${report.environment}:${check.id} -->`;
    const issue = issues.find((i) => i.body?.includes(marker));
    const body = `${marker}\n${check.ok ? "Recuperado" : "Falha"} em ${report.timestamp}\n\nVerificação: ${check.id}\nResultado: ${check.detail}\n\n${
      process.env.GITHUB_RUN_ID
        ? `Execução: https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
        : "Execução local"
    }\n\nValidação operacional; não substitui teste de submissão de exercício.`;
    if (!check.ok && !issue) {
      await github("POST", "issues", {
        title: `[EEVEE ${report.environment}] ${check.id}`,
        body,
      });
    } else if (!check.ok && issue.state === "closed") {
      await github("PATCH", `issues/${issue.number}`, { state: "open" });
      await github("POST", `issues/${issue.number}/comments`, { body });
    } else if (check.ok && issue?.state === "open") {
      await github("POST", `issues/${issue.number}/comments`, { body });
      await github("PATCH", `issues/${issue.number}`, {
        state: "closed",
        state_reason: "completed",
      });
    }
  }
}

export async function main() {
  const checks = [];
  for (const [id, target] of [
    ["front", process.env.EEVEE_FRONT_URL],
    ["api", process.env.EEVEE_API_URL],
  ]) {
    if (!target) continue;
    const started = performance.now();
    try {
      const response = await fetch(target, {
        signal: AbortSignal.timeout(15000),
        redirect: "error",
      });
      const ok =
        response.ok &&
        (id !== "api" ||
          (await response.text()).trim() === "All systems online!");
      await response.body?.cancel().catch(() => {});
      checks.push({
        id,
        ok,
        durationMs: Math.round(performance.now() - started),
        detail: `HTTP ${response.status}${!ok && response.ok ? ", unexpected health response" : ""}`,
      });
    } catch (error) {
      checks.push({
        id,
        ok: false,
        durationMs: Math.round(performance.now() - started),
        detail: `Request failed (${error.name === "TimeoutError" ? "timeout" : error.cause?.code || "network or redirect"})`,
      });
    }
  }
  if (process.env.EEVEE_KUBERNETES === "true") {
    try {
      const resources = execFileSync(
        "kubectl",
        [
          "--request-timeout=20s",
          "-n",
          process.env.EEVEE_NAMESPACE || "eevee-cefetrj",
          "get",
          "deployments,pods,jobs",
          "-o",
          "json",
        ],
        {
          timeout: 30000,
          maxBuffer: 10 * 1024 * 1024,
          stdio: ["ignore", "pipe", "pipe"],
        },
      );
      const all = JSON.parse(resources).items;
      checks.push(
        ...clusterChecks(
          ...["Deployment", "Pod", "Job"].map((kind) => ({
            items: all.filter((i) => i.kind === kind),
          })),
        ),
      );
    } catch {
      checks.push({
        id: "cluster",
        ok: false,
        detail: "Unable to inspect Kubernetes (access, command or timeout)",
      });
    }
  }
  if (!checks.length)
    throw new Error(
      "Configure EEVEE_FRONT_URL, EEVEE_API_URL or EEVEE_KUBERNETES=true",
    );
  const environment = process.env.EEVEE_ENVIRONMENT || "local";
  if (!/^[a-zA-Z0-9_-]+$/.test(environment))
    throw new Error("Invalid EEVEE_ENVIRONMENT");
  const report = {
    timestamp: new Date().toISOString(),
    environment,
    ok: checks.every((c) => c.ok !== false),
    checks,
  };
  const dir = process.env.EEVEE_HISTORY_DIR || ".eevee-state";
  await mkdir(dir, { recursive: true });
  await appendFile(`${dir}/history.jsonl`, `${JSON.stringify(report)}\n`);
  await writeFile(`${dir}/latest.json`, JSON.stringify(report, null, 2));
  await writeFile(
    `${dir}/latest.md`,
    `# EEVEE: ${report.ok ? "OK nas verificações disponíveis" : "FALHA"}\n\n${report.timestamp} (${environment})\n\n${checks.map((c) => `- ${c.ok === null ? "OBSERVAÇÃO" : c.ok ? "OK" : "FALHA"} ${c.id}: ${c.detail}`).join("\n")}\n`,
  );
  console.log(JSON.stringify(report, null, 2));
  if (process.argv.includes("--sync-github")) await syncIssues(report);
  return report.ok ? 0 : 1;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 2;
    });
}
