import type { editor, Selection } from "monaco-editor";
import {
  CLIPBOARD_ACTION,
  INTERNAL_CLIPBOARD_WRITE_ACTION,
  type InternalClipboardWriteAction,
} from "@/constants/clipboard-action";

const INTERNAL_CLIPBOARD_MIME = "application/x-eevee-internal-clipboard";

interface MonacoClipboardMetadata {
  version?: number;
  isFromEmptySelection?: boolean;
  multicursorText?: string[] | null;
  mode?: string | null;
}

interface InternalClipboardBuffer {
  text: string;
  metadata: MonacoClipboardMetadata | null;
}

const clipboardBuffers = new Map<string, InternalClipboardBuffer>();

function createClipboardPlaceholder(scope: string) {
  return `[EEVEE_INTERNAL_CLIPBOARD:${scope}]`;
}

function compareSelections(
  left: Selection,
  right: Selection,
) {
  return (
    left.startLineNumber - right.startLineNumber ||
    left.startColumn - right.startColumn
  );
}

function serializeEditorSelections(
  editorInstance: editor.IStandaloneCodeEditor,
): InternalClipboardBuffer | null {
  const model = editorInstance.getModel();
  const selections = editorInstance.getSelections();

  if (!model || !selections?.length) return null;

  const sortedSelections = [...selections].sort(compareSelections);

  const endOfLine = model.getEOL();

  const hasNonEmptySelection = sortedSelections.some((selection) => !selection.isEmpty());

  if (!hasNonEmptySelection) {
    const copiedLines = new Set<number>();
    let text = "";

    for (const selection of sortedSelections) {
      if (copiedLines.has(selection.startLineNumber)) continue;

      copiedLines.add(selection.startLineNumber);
      text += model.getLineContent(selection.startLineNumber) + endOfLine;
    }

    return {
      text,
      metadata: {
        version: 1,
        isFromEmptySelection: sortedSelections.length === 1,
        multicursorText: null,
        mode: model.getLanguageId(),
      },
    };
  }

  const chunks: string[] = [];
  let previousEmptyLine = 0;

  for (const selection of sortedSelections) {
    if (selection.isEmpty()) {
      if (selection.startLineNumber !== previousEmptyLine) {
        chunks.push(model.getLineContent(selection.startLineNumber));
      }
      previousEmptyLine = selection.startLineNumber;
      continue;
    }

    chunks.push(model.getValueInRange(selection));
    previousEmptyLine = selection.startLineNumber;
  }

  if (!chunks.length) return null;

  return {
    text: chunks.join(endOfLine),
    metadata: {
      version: 1,
      isFromEmptySelection: false,
      multicursorText: chunks.length > 1 ? chunks : null,
      mode: model.getLanguageId(),
    },
  };
}

export function captureInternalEditorClipboard(
  event: ClipboardEvent,
  editorInstance: editor.IStandaloneCodeEditor,
  scope: string,
  action: InternalClipboardWriteAction,
) {
  const clipboardData = event.clipboardData;
  const buffer = serializeEditorSelections(editorInstance);

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  if (!buffer) {
    clipboardBuffers.delete(scope);
    return false;
  }

  clipboardBuffers.set(scope, buffer);

  if (clipboardData) {
    clipboardData.clearData();
    clipboardData.setData("text/plain", createClipboardPlaceholder(scope));
    clipboardData.setData(INTERNAL_CLIPBOARD_MIME, scope);
  }

  if (action === INTERNAL_CLIPBOARD_WRITE_ACTION.CUT) {
    editorInstance.trigger("keyboard", CLIPBOARD_ACTION.CUT, {});
  }

  return true;
}

export function pasteInternalEditorClipboard(
  event: ClipboardEvent,
  editorInstance: editor.IStandaloneCodeEditor,
  scope: string,
) {
  const clipboardData = event.clipboardData;
  const buffer = clipboardBuffers.get(scope);

  if (!clipboardData || !buffer) return false;

  const marker = clipboardData.getData(INTERNAL_CLIPBOARD_MIME);
  const plainText = clipboardData.getData("text/plain");
  const hasTrustedOrigin = marker === scope || plainText === createClipboardPlaceholder(scope);

  if (!hasTrustedOrigin) return false;

  editorInstance.trigger("keyboard", CLIPBOARD_ACTION.PASTE, {
    text: buffer.text,
    pasteOnNewLine: Boolean(buffer.metadata?.isFromEmptySelection),
    multicursorText: buffer.metadata?.multicursorText ?? null,
    mode: buffer.metadata?.mode ?? null,
    clipboardEvent: event,
  });

  return true;
}

export function clearInternalEditorClipboard(scope: string) {
  clipboardBuffers.delete(scope);
}
