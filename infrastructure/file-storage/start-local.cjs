const { spawnSync } = require("node:child_process");
const { createHash, randomBytes } = require("node:crypto");
const { appendFileSync, existsSync, readdirSync, readFileSync } = require("node:fs");
const { join } = require("node:path");
const { parseEnv } = require("node:util");

const namespace = "eevee-dev-storage";
const service = "source-storage";
const claim = "eevee-student-source";
const keyName = "EEVEE_STORAGE_SIGNING_SECRET";
const envPath = join(__dirname, "../../platform-api/.env");

function kubectl(args, { input, foreground = false, namespaced = true } = {}) {
  const context = ["--context", "minikube"];
  if (namespaced) context.push("-n", namespace);
  const result = spawnSync("kubectl", [...context, ...args], {
    input,
    encoding: "utf8",
    stdio: foreground ? "inherit" : ["pipe", "pipe", "inherit"],
  });
  if (result.error) throw result.error;
  if (foreground) {
    process.exitCode = result.status ?? (result.signal === "SIGINT" ? 130 : 1);
    return;
  }
  if (result.status !== 0) {
    throw new Error(`kubectl ${args[0]} falhou (${result.status}).`);
  }
  return result.stdout;
}

function apply(resource, options = {}) {
  kubectl(["apply", "-f", "-"], { ...options, input: JSON.stringify(resource) });
}

function ensureSigningSecret(configuredKey) {
  let result = kubectl([
    "get", "secret", service, "--ignore-not-found", "-o", "json",
  ]);
  if (!result) {
    result = kubectl(["create", "-f", "-", "-o", "json"], {
      input: JSON.stringify({
        apiVersion: "v1",
        kind: "Secret",
        metadata: { name: service },
        stringData: { [keyName]: configuredKey || randomBytes(32).toString("hex") },
      }),
    });
  }
  const secret = JSON.parse(result);
  const key = Buffer.from(secret.data?.[keyName] ?? "", "base64").toString("utf8");
  if (key.length < 32) {
    throw new Error(
      `O Secret ${service} precisa de ${keyName} com pelo menos 32 caracteres.`,
    );
  }
  if (configuredKey && configuredKey !== key) {
    throw new Error(
      `${keyName} em platform-api/.env difere do Secret ${service}. Use a mesma chave nos dois.`,
    );
  }
  return { key, version: secret.metadata.resourceVersion };
}

function configureStorage(port) {
  if (!/^[1-9]\d{0,4}$/.test(port) || Number(port) > 65535) {
    throw new Error("SOURCE_STORAGE_PORT precisa ser uma porta entre 1 e 65535.");
  }
  if (!existsSync(envPath)) {
    throw new Error("Crie platform-api/.env a partir de platform-api/.env.example.");
  }
  const env = parseEnv(readFileSync(envPath, "utf8"));
  const url = `http://127.0.0.1:${port}`;
  const tunnelUrls = [url, `http://localhost:${port}`];
  const internalUrl = env.EEVEE_STORAGE_URL?.replace(/\/$/, "");
  const publicUrl = env.EEVEE_STORAGE_PUBLIC_URL?.replace(/\/$/, "");
  if (internalUrl && !tunnelUrls.includes(internalUrl)) {
    throw new Error(
      `Ajuste EEVEE_STORAGE_URL em platform-api/.env para ${url} ou use a porta configurada em SOURCE_STORAGE_PORT.`,
    );
  }
  if (
    /^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/.test(publicUrl ?? "") &&
    !tunnelUrls.includes(publicUrl)
  ) {
    throw new Error(`Ajuste EEVEE_STORAGE_PUBLIC_URL em platform-api/.env para ${url}.`);
  }
  if (env[keyName] && env[keyName].length < 32) {
    throw new Error(`${keyName} em platform-api/.env precisa de pelo menos 32 caracteres.`);
  }

  apply(
    { apiVersion: "v1", kind: "Namespace", metadata: { name: namespace } },
    { namespaced: false },
  );
  const { key, version: secretVersion } = ensureSigningSecret(env[keyName]);
  const missingSettings = [];
  if (!env.EEVEE_STORAGE_URL) missingSettings.push(`EEVEE_STORAGE_URL=${url}`);
  if (!env[keyName]) {
    const setting = `${keyName}=${JSON.stringify(key)}`;
    if (parseEnv(setting)[keyName] !== key) {
      throw new Error(`Configure ${keyName} em platform-api/.env com o valor do Secret ${service}.`);
    }
    missingSettings.push(setting);
  }
  if (missingSettings.length) {
    appendFileSync(envPath, `\n${missingSettings.join("\n")}\n`);
    console.log("Configuração de armazenamento adicionada a platform-api/.env.");
  }

  const pvc = kubectl(["get", "pvc", claim, "--ignore-not-found", "-o", "name"]);
  if (!pvc) kubectl(["create", "-f", join(__dirname, "minikube-pvc.yaml")]);

  const outputDirectory = join(__dirname, "../../file-storage-api/dist");
  const modules = readdirSync(outputDirectory).filter((name) => name.endsWith(".js")).sort();
  const data = Object.fromEntries(
    modules.map((name) => [name, readFileSync(join(outputDirectory, name), "utf8")]),
  );
  apply({ apiVersion: "v1", kind: "ConfigMap", metadata: { name: service }, data });
  kubectl(["apply", "-f", join(__dirname, "minikube.yaml")]);
  // Roll the pod when its source or injected Secret changes.
  const checksum = createHash("sha256")
    .update(JSON.stringify([data, secretVersion]))
    .digest("hex");
  const patch = {
    spec: {
      template: {
        metadata: { annotations: { "eevee/storage-config-checksum": checksum } },
      },
    },
  };
  kubectl(["patch", "deployment", service, "--type=merge", "-p", JSON.stringify(patch)]);
  kubectl(["rollout", "status", `deployment/${service}`, "--timeout=180s"]);

  console.log(`Abrindo túnel da File Storage API em ${url}. Use Ctrl+C para fechar.`);
  kubectl(
    ["port-forward", "--address", "127.0.0.1", `svc/${service}`, `${port}:3020`],
    { foreground: true },
  );
}

try {
  configureStorage(process.argv[2] ?? "3320");
} catch (error) {
  console.error(`File Storage API: ${error.message}`);
  process.exitCode = 1;
}
