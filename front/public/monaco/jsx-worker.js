const ClassificationTypeEnum = Object.freeze({
  JSX_ATTRIBUTE: "jsx attribute",
  JSX_OPEN_TAG_NAME: "jsx open tag name",
  JSX_CLOSE_TAG_NAME: "jsx close tag name",
  JSX_SELF_CLOSING_TAG_NAME: "jsx self closing tag name",
});

self.customTSWorkerFactory = (TypeScriptWorker) => class extends TypeScriptWorker {

  getJsxClosingTag(fileName, offset) {
    return this.getLanguageService().getJsxClosingTagAtPosition(fileName, offset);
  }

  getJsxHighlightSpans(fileName) {
    const service = this.getLanguageService();
    const source = service.getProgram()?.getSourceFile(fileName);
    if (!source) return [];

    const tagTypes = new Set([
      ClassificationTypeEnum.JSX_OPEN_TAG_NAME,
      ClassificationTypeEnum.JSX_CLOSE_TAG_NAME,
      ClassificationTypeEnum.JSX_SELF_CLOSING_TAG_NAME
    ]);

    const spans = [];

    for (const item of service.getSyntacticClassifications(fileName, { start: 0, length: source.text.length })) {
      const attribute = item.classificationType === ClassificationTypeEnum.JSX_ATTRIBUTE;

      if (!attribute && !tagTypes.has(item.classificationType)) continue;

      const { start, length } = item.textSpan;

      const text = source.text.slice(start, start + length);

      const type = attribute ? 2 : /^[a-z]/.test(text) ? 0 : 1;

      for (const part of text.matchAll(/[^\r\n]+/g)) {
        const { line, character } = source.getLineAndCharacterOfPosition(start + part.index);
        spans.push({
          start: start + part.index,
          line,
          character,
          length: part[0].length,
          type
        });
      }
    }
    return spans;
  }
};
