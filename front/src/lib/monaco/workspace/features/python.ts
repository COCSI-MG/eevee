import { applyPythonIntellisense, disposePythonIntellisense } from "../../python/pyodide-client";
import type { EditorFeature, EditorFeatureContext } from "./types";

const contexts = new Set<EditorFeatureContext>();

function refresh(context: EditorFeatureContext) {
  if (!contexts.size) {
    disposePythonIntellisense();

    return;
  }
  const models = new Set(
    Array.from(contexts)
    .flatMap(entry => entry.getModels())
  );

  applyPythonIntellisense(context.monaco, Array.from(models));
}

export const pythonIntellisenseFeature: EditorFeature = {
  register(context) {
    contexts.add(context);

    refresh(context);

    return {
      update: () => refresh(context),
      dispose() {
        if (!contexts.delete(context)) return;

        refresh(context);
      }
    };
  }
};
