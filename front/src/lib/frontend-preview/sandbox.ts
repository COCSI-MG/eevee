import type { SandboxSetup } from "@codesandbox/sandpack-client";
import type { FileNode } from "@/types/shared";
import { PREVIEW_CONTEXT_MENU_SCRIPT } from "@/constants/frontend-preview";

export interface PreviewEntry {
  kind: "react" | "html";
  path: string;
  label: string;
}

export const PREVIEW_DEPENDENCIES = {
  react: "19.2.0",
  "react-dom": "19.2.0",
  "react-router": "7.18.4"
};

type SandboxFiles = SandboxSetup["files"];

const IGNORED_FILES = new Set([
  "package.json",
  "sandbox.config.json",
]);

const REACT_HTML = `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

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

export function previewEntries(files: Record<string, string>, react: boolean): PreviewEntry[] {
  const entries: PreviewEntry[] = [];
  if (react) {
    const candidates = ["src/main.tsx", "src/main.jsx", "src/main.ts", "src/main.js"];

    entries.push({
      kind: "react",
      path: candidates.find((path) => path in files) ?? candidates[0],
      label: "Aplicação React"
    });
  }

  const htmlFiles = Object.keys(files)
    .filter((path) => /\.html?$/i.test(path))
    .sort();

  for (const path of htmlFiles) {
    entries.push({
      kind: "html",
      path,
      label: path
    });
  }

  return entries;
}

function prepareHtml(
  entry: PreviewEntry,
  files: SandboxSetup["files"]
): string {
  const document = new DOMParser().parseFromString(files[`/${entry.path}`].code, "text/html");

  let index = 0;

  for (const script of document.querySelectorAll("script")) {
    const type = script.type.trim().toLowerCase();

    if (type && type !== "text/javascript" && type !== "application/javascript") continue;

    const src = script.getAttribute("src");

    let code = script.textContent ?? "";

    if (src) {
      const url = new URL(src, `https://preview.invalid/${entry.path}`);

      if (url.origin !== "https://preview.invalid") continue;

      const path = decodeURIComponent(url.pathname);

      if (!(path in files)) throw new Error(`Arquivo não encontrado: ${path}`);

      code = files[path].code;
    }

    let path = `/${entry.path}.script-${index++}.js`;

    while (path in files) path += ".js";

    files[path] = {
      code: `(() => { const script = document.createElement("script"); script.textContent = ${JSON.stringify(code)}; document.head.appendChild(script); })();`,
    };

    script.setAttribute("src", path);
    script.textContent = "";
  }
  return `<!doctype html>\n${document.documentElement.outerHTML}`;
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

function prepareEntry(
  entry: PreviewEntry,
  files: SandboxFiles,
  blockContextMenu: boolean
): string {
  let main = `/${entry.path}`;

  if (entry.kind === "react") {
    files["/public/index.html"] = {
      code: REACT_HTML
    };

    if (blockContextMenu) {
      files[main] = {
        ...files[main],
        code: `${PREVIEW_CONTEXT_MENU_SCRIPT}\n${files[main].code}`
      };
    }

    return main;
  }

  if (/\.htm$/i.test(main)) {
    do {
      main += ".html";
    } while (main in files);
  }

  files[main] = {
    code: prepareHtml(entry, files)
  }

  return main;
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
  }
}

export function createPreviewSandbox(
  entry: PreviewEntry,
  source: Record<string, string>,
  react: boolean,
  blockContextMenu = false
): SandboxSetup {
  if (!Object.hasOwn(source, entry.path)) throw new Error(`Arquivo não encontrado: ${entry.path}`);

  const files = prepareSandboxFiles(source);
  if (blockContextMenu) blockHtmlContextMenu(files);

  const main = prepareEntry(entry, files, blockContextMenu);

  const dependencies = react ? PREVIEW_DEPENDENCIES : {};

  const devDependencies: SandboxSetup["devDependencies"] = react
    ? { "@babel/core": "7.21.8" }
    : {};

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
    template: entry.kind === "react" ? "create-react-app" : "parcel"
  };
}
