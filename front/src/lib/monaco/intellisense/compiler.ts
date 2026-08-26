import { WorkerType } from "@/app/interface/scheduler-api/worker";
import {
  findWorkerEditorConfig,
  MonacoCompilerPreset,
} from "../worker-editor-config";

type MonacoNamespace = typeof import("monaco-editor");

/**
 * Compiler options manually translated from the worker tsconfig files into
 * the enum values understood by Monaco's TypeScript worker.
 */
export function getCompilerOptions(
  monaco: MonacoNamespace,
  workerType?: WorkerType | string,
): import("monaco-editor").languages.typescript.CompilerOptions {
  const ts = monaco.languages.typescript;
  const preset =
    findWorkerEditorConfig(workerType)?.compilerPreset ?? "node";

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

  return compilerOptionsForPreset(ts, preset, base, jsxAutomatic);
}

function compilerOptionsForPreset(
  ts: MonacoNamespace["languages"]["typescript"],
  preset: MonacoCompilerPreset,
  base: import("monaco-editor").languages.typescript.CompilerOptions,
  jsxAutomatic: import("monaco-editor").languages.typescript.JsxEmit,
): import("monaco-editor").languages.typescript.CompilerOptions {

  switch (preset) {
    case "nest":

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

      return {
        ...base,
        module: ts.ModuleKind.CommonJS,
        lib: ["esnext"],
      };

    case "next":

      return {
        ...base,
        module: ts.ModuleKind.ESNext,
        jsx: jsxAutomatic,
        lib: ["dom", "dom.iterable", "esnext"],
      };

    case "react":

      return {
        ...base,
        module: ts.ModuleKind.ESNext,
        jsx: jsxAutomatic,
        useDefineForClassFields: true,
        lib: ["es2022", "dom", "dom.iterable"],
      };

    case "node":

      return {
        ...base,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        lib: ["esnext", "dom"],
      };
  }
}

const DIAGNOSTIC_CODES_TO_IGNORE = [2307, 2580, 7016, 2792];

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

  const { typescriptDefaults, javascriptDefaults } = monaco.languages.typescript;

  typescriptDefaults.setCompilerOptions(options);
  typescriptDefaults.setDiagnosticsOptions(diagnostics);
  typescriptDefaults.setEagerModelSync(true);

  javascriptDefaults.setCompilerOptions(options);
  javascriptDefaults.setDiagnosticsOptions(diagnostics);
  javascriptDefaults.setEagerModelSync(true);
}
