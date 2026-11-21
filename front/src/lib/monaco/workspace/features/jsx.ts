import { configureJsxWorker, registerJsxEditing } from "../jsx-editing";
import type { EditorFeature } from "./types";

export const jsxEditingFeature: EditorFeature = {
  options: {
    tabCompletion: "on",
    autoIndent: "full",
    insertSpaces: true,
    autoClosingBrackets: "languageDefined",
    autoClosingQuotes: "languageDefined",
    autoSurround: "languageDefined",
    acceptSuggestionOnEnter: "on",
    suggestOnTriggerCharacters: true,
    snippetSuggestions: "inline",
    "semanticHighlighting.enabled": true
  },
  prepare: configureJsxWorker,
  register({ monaco, editor }) {
    const dispose = registerJsxEditing(monaco, editor);

    return {
      update() {},
      dispose
    };
  }
};
