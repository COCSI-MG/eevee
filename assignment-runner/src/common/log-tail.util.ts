/** Truncates multi-line text to its last N lines, for safe stdout logging. */
export function tailLines(text: string, maxLines = 30): string {
  if (!text) {
    return text;
  }

  const lines = text.split("\n");
  if (lines.length <= maxLines) {
    return text;
  }

  const omitted = lines.length - maxLines;
  return `... [${omitted} earlier line(s) omitted] ...\n${lines.slice(-maxLines).join("\n")}`;
}
