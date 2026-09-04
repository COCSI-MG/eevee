export const INTERNAL_CLIPBOARD_WRITE_ACTION = {
  COPY: "copy",
  CUT: "cut",
} as const;

export const CLIPBOARD_ACTION = {
  ...INTERNAL_CLIPBOARD_WRITE_ACTION,
  PASTE: "paste",
} as const;

export type InternalClipboardWriteAction = (typeof INTERNAL_CLIPBOARD_WRITE_ACTION)[keyof typeof INTERNAL_CLIPBOARD_WRITE_ACTION];

export type ClipboardAction = (typeof CLIPBOARD_ACTION)[keyof typeof CLIPBOARD_ACTION];
