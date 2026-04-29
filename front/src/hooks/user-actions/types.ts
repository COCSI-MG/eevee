export type ClipboardAction = "copy" | "cut" | "paste";

export type RegisterClipboardAttempt = (action: ClipboardAction) => void;
