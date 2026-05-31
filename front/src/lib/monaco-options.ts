export const readOnlyMonacoOptions = {
  readOnly: true,
  minimap: { enabled: false },
  wordWrap: "off",
  scrollBeyondLastLine: false,
  automaticLayout: true,
  scrollbar: {
    horizontal: "visible",
    vertical: "visible",
  },
} as const;
