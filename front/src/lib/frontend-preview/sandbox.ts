import type { SandboxSetup } from "@codesandbox/sandpack-client";
import type { FileNode } from "@/types/shared";
import { PREVIEW_CONTEXT_MENU_SCRIPT } from "@/constants/frontend-preview";
import type { PreviewEntry, PreviewStrategy, SandboxFiles } from "./types";

export type { PreviewEntry, PreviewStrategy } from "./types";

const IGNORED_FILES = new Set([
  "package.json",
  "sandbox.config.json",
]);

export function previewFiles(tree: FileNode): Record<string, string> {
  const files: Record<string, string> = {};

  function visit(node: FileNode) {
    if (node.isFile) {
      files[node.path.replace(/^\/+/, "")] = node.content ?? "";
    } else {
      node.children?.forEach(visit);
    }
  }
  visit(tree);
  return files;
}

export function previewEntries(
  files: Record<string, string>,
  strategy: PreviewStrategy
): PreviewEntry[] {
  return strategy.getEntries(files);
}

function shouldIgnoreFile(path: string): boolean {
  const isNodeModule = path.startsWith("node_modules/") || path.includes("/node_modules/");

  return isNodeModule || IGNORED_FILES.has(path);
}

function prepareSandboxFiles(source: Record<string, string>): SandboxFiles {
  const files: SandboxFiles = {};

  for (const [path, code] of Object.entries(source)) {
    if (shouldIgnoreFile(path)) continue;

    files[`/${path}`] = { code };
  }

  for (const [path, file] of Object.entries(files)) {
    if (!path.startsWith("/public/")) continue;

    const publicPath = path.slice("/public".length);
    files[publicPath] ??= file;
  }

  return files;
}

function blockHtmlContextMenu(files: SandboxFiles) {
  for (const [path, file] of Object.entries(files)) {
    if (!/\.html?$/i.test(path)) continue;

    const document = new DOMParser().parseFromString(file.code, "text/html");

    const script = document.createElement("script");

    script.textContent = PREVIEW_CONTEXT_MENU_SCRIPT;

    document.head.prepend(script);

    files[path] = {
      ...file,
      code: `<!doctype html>\n${document.documentElement.outerHTML}`
    };
  }
}

function createPackageJson(
  main: string,
  dependencies: SandboxSetup["dependencies"],
  devDependencies: SandboxSetup["devDependencies"]
): SandboxFiles[string] {
  return {
    code: JSON.stringify({
      main,
      dependencies,
      devDependencies
    })
  };
}

export function createPreviewSandbox(
  entry: PreviewEntry,
  source: Record<string, string>,
  strategy: PreviewStrategy,
  blockContextMenu = false
): SandboxSetup {
  if (!Object.hasOwn(source, entry.path)) throw new Error(`Arquivo não encontrado: ${entry.path}`);

  const files = prepareSandboxFiles(source);
  if (blockContextMenu) blockHtmlContextMenu(files);

  const { main, template } = strategy.prepareEntry(entry, files, blockContextMenu);
  const dependencies = { ...strategy.dependencies };
  const devDependencies = { ...strategy.devDependencies };

  files["/package.json"] = createPackageJson(
    main,
    dependencies,
    devDependencies
  );

  return {
    files,
    dependencies,
    devDependencies,
    entry: main,
    template
  };
}
