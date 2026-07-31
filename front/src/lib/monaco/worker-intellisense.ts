import { WorkerType } from "@/app/interface/scheduler-api/worker";
import WORKER_SOURCE_MAP from "./worker-source-map.json";

type MonacoNamespace = typeof import("monaco-editor");

/**
 * Maps a {@link WorkerType} to the `node-worker-images/<dir>` folder whose
 * `package.json` / `tsconfig.json` describe the runtime the student code will
 * actually execute in. Everything below is derived from those workers so the
 * in-browser editor mirrors the real execution environment.
 */
const workerSourceMap = WORKER_SOURCE_MAP as Record<string, string>;

const DEFAULT_PACK_DIR = "node";

/**
 * Resolves the type-pack / worker directory name for a given worker type.
 */
export function resolvePackDir(workerType?: WorkerType | string): string {
  if (!workerType) return DEFAULT_PACK_DIR;
  return workerSourceMap[workerType] ?? DEFAULT_PACK_DIR;
}

/**
 * Compiler options derived from each worker's `tsconfig.json`, translated into
 * the Monaco TypeScript worker representation. Monaco only understands the enum
 * values exposed on `monaco.languages.typescript`, so we build them lazily from
 * the live namespace instead of hardcoding numbers.
 */
export function getCompilerOptions(
  monaco: MonacoNamespace,
  workerType?: WorkerType | string,
): import("monaco-editor").languages.typescript.CompilerOptions {
  const ts = monaco.languages.typescript;
  const dir = resolvePackDir(workerType);

  const jsxAutomatic = ts.JsxEmit.ReactJSX ?? ts.JsxEmit.React;

  const base: import("monaco-editor").languages.typescript.CompilerOptions = {
    allowJs: true,
    checkJs: false,
    allowNonTsExtensions: true,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    skipLibCheck: true,
    resolveJsonModule: true,
    forceConsistentCasingInFileNames: true,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    baseUrl: ".",
    noImplicitAny: false,
    strict: false,
  };

  switch (dir) {
    case "nest.js":
      // node-worker-images/nest.js/tsconfig.json
      return {
        ...base,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        strictNullChecks: true,
        lib: ["esnext", "dom", "dom.iterable"],
      };

    case "grpc":
      // node-worker-images/grpc/tsconfig.json
      return {
        ...base,
        module: ts.ModuleKind.CommonJS,
        lib: ["esnext"],
      };

    case "next.js-cypress":
      // node-worker-images/next.js-cypress/tsconfig.json
      return {
        ...base,
        module: ts.ModuleKind.ESNext,
        jsx: jsxAutomatic,
        lib: ["dom", "dom.iterable", "esnext"],
      };

    case "reactjs-cypress":
      // node-worker-images/reactjs-cypress/tsconfig.app.json
      return {
        ...base,
        module: ts.ModuleKind.ESNext,
        jsx: jsxAutomatic,
        useDefineForClassFields: true,
        lib: ["es2022", "dom", "dom.iterable"],
      };

    case "node-teraorm":
    case "node":
    default:
      // node-worker-images/node/tsconfig.json (also node-teraorm)
      return {
        ...base,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        lib: ["esnext", "dom"],
      };
  }
}

/**
 * Diagnostics we silence regardless of the loaded type packs. These are the
 * codes that would otherwise produce false positives when a dependency ships no
 * declaration file, keeping IntelliSense (completions/hovers) useful without
 * red-squiggling valid student code.
 *
 * - 2307: Cannot find module '...'          (dependency without a type pack)
 * - 2580: Cannot find name 'require'/'module'/'process'
 * - 7016: Could not find a declaration file for module '...'
 * - 2792: Cannot find module (did you mean moduleResolution?)
 */
const DIAGNOSTIC_CODES_TO_IGNORE = [2307, 2580, 7016, 2792];

/**
 * Applies the derived compiler options + diagnostics to both the TypeScript and
 * JavaScript language defaults. Safe to call on every editor mount.
 */
export function applyLanguageDefaults(
  monaco: MonacoNamespace,
  workerType?: WorkerType | string,
): void {
  const options = getCompilerOptions(monaco, workerType);
  const diagnostics = {
    noSemanticValidation: false,
    noSyntaxValidation: false,
    diagnosticCodesToIgnore: DIAGNOSTIC_CODES_TO_IGNORE,
  };

  const { typescriptDefaults, javascriptDefaults } =
    monaco.languages.typescript;

  typescriptDefaults.setCompilerOptions(options);
  typescriptDefaults.setDiagnosticsOptions(diagnostics);
  typescriptDefaults.setEagerModelSync(true);

  javascriptDefaults.setCompilerOptions(options);
  javascriptDefaults.setDiagnosticsOptions(diagnostics);
  javascriptDefaults.setEagerModelSync(true);
}
