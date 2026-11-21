import { findWorkerEditorConfig } from "../../worker-editor-config";
import { jsxEditingFeature } from "./jsx";
import { pythonIntellisenseFeature } from "./python";
import type { EditorFeature, EditorFeatureContext, EditorFeatureId, EditorFeatureRegistration, Monaco, WorkspaceRuntimeConfig } from "./types";

const registry: Record<EditorFeatureId, EditorFeature> = {
  "jsx-editing": jsxEditingFeature,
  "python-intellisense": pythonIntellisenseFeature
};

function selected(workerType: WorkspaceRuntimeConfig["workerType"]) {
  return findWorkerEditorConfig(workerType)?.editorFeatures ?? [];
}

export function prepareWorkspaceEditor(monaco: Monaco, workerType: WorkspaceRuntimeConfig["workerType"]) {

  const workerTypeSelected = selected(workerType);

  for (const id of workerTypeSelected) {
    registry[id].prepare?.(monaco);
  }
}

export function workspaceEditorOptions(
  workerType: WorkspaceRuntimeConfig["workerType"]
): import("monaco-editor").editor.IStandaloneEditorConstructionOptions {

  const options = selected(workerType).map(id => {
    return registry[id].options
  })

  return Object.assign({}, ...options);
}

export function createEditorFeatures(context: EditorFeatureContext) {
  const active = new Map<EditorFeatureId, EditorFeatureRegistration>();
  let disposed = false;

  return {
    update() {
      if (disposed) return;

      const desired = new Set(selected(context.getConfig().workerType));

      for (const [id, registration] of active) {
        if (!desired.has(id)) {
          registration.dispose();

          active.delete(id);
        }
      }

      for (const id of desired) {
        const registration = active.get(id);

        if (registration) {
          registration.update();
        } else {
          active.set(id, registry[id].register(context));
        }
      }
    },
    dispose() {
      if (disposed) return;

      disposed = true;

      for (const registration of active.values()) registration.dispose();

      active.clear();
    }
  };
}
