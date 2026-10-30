import { PREVIEW_CONTEXT_MENU_SCRIPT } from "@/constants/frontend-preview";
import { htmlPreviewStrategy } from "./html.strategy";
import type { PreviewStrategy } from "../types";

const REACT_HTML = `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

export const reactPreviewStrategy: PreviewStrategy = {
  dependencies: {
    react: "19.2.0",
    "react-dom": "19.2.0",
    "react-router": "7.18.4"
  },
  devDependencies: { "@babel/core": "7.21.8" },
  getEntries(source) {
    const candidates = ["src/main.tsx", "src/main.jsx", "src/main.ts", "src/main.js"];

    return [
      {
        kind: "react",
        path: candidates.find((path) => path in source) ?? candidates[0],
        label: "Aplicação React"
      },
      ...htmlPreviewStrategy.getEntries(source)
    ];
  },
  prepareEntry(entry, files, blockContextMenu) {
    if (entry.kind === "html") {
      return htmlPreviewStrategy.prepareEntry(entry, files, blockContextMenu);
    }

    const main = `/${entry.path}`;
    files["/public/index.html"] = { code: REACT_HTML };

    if (blockContextMenu) {
      files[main] = {
        ...files[main],
        code: `${PREVIEW_CONTEXT_MENU_SCRIPT}\n${files[main].code}`
      };
    }

    return { main, template: "create-react-app" };
  }
};
