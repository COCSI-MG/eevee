import type { PreviewEntry, PreviewStrategy, SandboxFiles } from "../types";

function prepareHtml(
  entry: PreviewEntry,
  files: SandboxFiles
): string {
  const urlPreview = 'https://preview.invalid';

  const code = files[`/${entry.path}`].code
  const document = new DOMParser().parseFromString(code, "text/html");

  let index = 0;

  for (const script of document.querySelectorAll("script")) {
    const type = script.type.trim().toLowerCase();

    const allowedTypes = ["text/javascript", "application/javascript"];

    if (type && !allowedTypes.includes(type)) continue;

    const src = script.getAttribute("src");

    let code = script.textContent ?? "";

    if (src) {
      const url = new URL(src, `${urlPreview}/${entry.path}`);

      if (url.origin !== urlPreview) continue;

      const path = decodeURIComponent(url.pathname);

      if (!(path in files)) throw new Error(`Arquivo não encontrado: ${path}`);

      code = files[path].code;
    }

    let path = `/${entry.path}.script-${index++}.js`;

    while (path in files) path += ".js";

    files[path] = {
      code: `(() => { 
        const script = document.createElement("script"); 
        script.textContent = ${JSON.stringify(code)}; 
        document.head.appendChild(script); 
      })();`
    };

    script.setAttribute("src", path);
    script.textContent = "";
  }
  return `<!doctype html>\n${document.documentElement.outerHTML}`;
}

export const htmlPreviewStrategy: PreviewStrategy = {
  dependencies: {},
  devDependencies: {},
  getEntries(source) {
    return Object.keys(source)
      .filter((path) => /\.html?$/i.test(path))
      .sort()
      .map((path) => ({ kind: "html", path, label: path }));
  },
  prepareEntry(entry, files) {
    let main = `/${entry.path}`;

    if (/\.htm$/i.test(main)) {
      do {
        main += ".html";
      } while (main in files);
    }

    files[main] = { code: prepareHtml(entry, files) };

    return { main, template: "parcel" };
  }
};
