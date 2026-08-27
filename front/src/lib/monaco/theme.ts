import type { editor } from "monaco-editor";

type MonacoNamespace = typeof import("monaco-editor");

export const EEVEE_MONACO_THEME = "eevee-theme";

const CSS_COLOR_VARIABLES = {
  first: "--first-color",
  second: "--second-color",
  third: "--third-color",
  fourth: "--fourth-color",
  fifth: "--fifth-color",
  destructive: "--destructive",
  success: "--success",
  warning: "--warning",
  info: "--info",
  syntaxComment: "--syntax-comment",
  syntaxKeyword: "--syntax-keyword",
  syntaxString: "--syntax-string",
  syntaxNumber: "--syntax-number",
  syntaxType: "--syntax-type",
  syntaxFunction: "--syntax-function",
  syntaxVariable: "--syntax-variable",
  syntaxOperator: "--syntax-operator",
} as const;

type MonacoThemeColors = Record<keyof typeof CSS_COLOR_VARIABLES, string>;

function toHexChannel(value: number): string {
  return value.toString(16).padStart(2, "0").toUpperCase();
}

function resolveCssColor(
  styles: CSSStyleDeclaration,
  context: CanvasRenderingContext2D,
  variableName: string,
): string {
  const rawColor = styles.getPropertyValue(variableName).trim();

  if (!rawColor) {
    throw new Error(`A variavel "${variableName}" não foi definida.`);
  }

  const cssColor = `hsl(${rawColor})`;

  if (!CSS.supports("color", cssColor)) {
    throw new Error(`A variavel "${variableName}" tem uma cor inválida: "${rawColor}".`);
  }

  context.clearRect(0, 0, 1, 1);
  context.fillStyle = cssColor;
  context.fillRect(0, 0, 1, 1);

  const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
  return `#${toHexChannel(red)}${toHexChannel(green)}${toHexChannel(blue)}`;
}

function resolveMonacoThemeColors(): MonacoThemeColors {
  if (typeof document === "undefined") {
    throw new Error("Somente registrado no browser");
  }

  const context = document.createElement("canvas").getContext("2d");

  if (!context) {
    throw new Error("Necessário o canvas");
  }

  const styles = getComputedStyle(document.documentElement);

  return Object.fromEntries(
    Object.entries(CSS_COLOR_VARIABLES).map(([name, variableName]) => [
      name,
      resolveCssColor(styles, context, variableName),
    ]),
  ) as MonacoThemeColors;
}

function tokenColor(color: string): string {
  return color.slice(1);
}

function withAlpha(color: string, alpha: string): string {
  return `${color}${alpha}`;
}

function createEeveeMonacoThemeData(): editor.IStandaloneThemeData {
  const colors = resolveMonacoThemeColors();

  return {
    base: "vs-dark",
    inherit: true,
    rules: [
      {
        token: "",
        foreground: tokenColor(colors.syntaxVariable),
        background: tokenColor(colors.first),
      },
      {
        token: "comment",
        foreground: tokenColor(colors.syntaxComment),
        fontStyle: "italic",
      },
      { token: "string", foreground: tokenColor(colors.syntaxString) },
      {
        token: "string.escape",
        foreground: tokenColor(colors.syntaxNumber),
        fontStyle: "bold",
      },
      { token: "number", foreground: tokenColor(colors.syntaxNumber) },
      { token: "constant", foreground: tokenColor(colors.syntaxNumber) },
      {
        token: "keyword",
        foreground: tokenColor(colors.syntaxKeyword),
        fontStyle: "bold",
      },
      {
        token: "keyword.flow",
        foreground: tokenColor(colors.syntaxKeyword),
        fontStyle: "bold",
      },
      {
        token: "keyword.control",
        foreground: tokenColor(colors.syntaxKeyword),
        fontStyle: "bold",
      },
      { token: "storage", foreground: tokenColor(colors.syntaxKeyword) },
      { token: "modifier", foreground: tokenColor(colors.syntaxKeyword) },
      { token: "type", foreground: tokenColor(colors.syntaxType) },
      { token: "type.identifier", foreground: tokenColor(colors.syntaxType) },
      { token: "class", foreground: tokenColor(colors.syntaxType) },
      { token: "interface", foreground: tokenColor(colors.syntaxType) },
      { token: "namespace", foreground: tokenColor(colors.syntaxType) },
      { token: "function", foreground: tokenColor(colors.syntaxFunction) },
      { token: "method", foreground: tokenColor(colors.syntaxFunction) },
      { token: "identifier", foreground: tokenColor(colors.syntaxVariable) },
      { token: "variable", foreground: tokenColor(colors.syntaxVariable) },
      { token: "parameter", foreground: tokenColor(colors.syntaxVariable) },
      { token: "delimiter", foreground: tokenColor(colors.syntaxOperator) },
      { token: "operator", foreground: tokenColor(colors.syntaxOperator) },
      { token: "regexp", foreground: tokenColor(colors.syntaxString) },
      { token: "tag", foreground: tokenColor(colors.syntaxKeyword) },
      { token: "attribute.name", foreground: tokenColor(colors.syntaxType) },
      { token: "attribute.value", foreground: tokenColor(colors.syntaxString) },
    ],
    colors: {
      focusBorder: colors.third,
      foreground: colors.fifth,
      descriptionForeground: colors.fourth,
      errorForeground: colors.destructive,
      "textLink.foreground": colors.fourth,
      "textLink.activeForeground": colors.fifth,
      "input.background": colors.first,
      "input.foreground": colors.fifth,
      "input.border": colors.third,
      "input.placeholderForeground": colors.fourth,
      "dropdown.background": colors.second,
      "dropdown.foreground": colors.fifth,
      "dropdown.border": colors.third,
      "list.activeSelectionBackground": colors.third,
      "list.activeSelectionForeground": colors.first,
      "list.inactiveSelectionBackground": withAlpha(colors.third, "99"),
      "list.inactiveSelectionForeground": colors.first,
      "list.hoverBackground": withAlpha(colors.third, "4D"),
      "list.hoverForeground": colors.fifth,
      "list.focusBackground": colors.third,
      "list.focusForeground": colors.first,
      "scrollbar.shadow": withAlpha(colors.first, "00"),
      "scrollbarSlider.background": withAlpha(colors.third, "55"),
      "scrollbarSlider.hoverBackground": withAlpha(colors.third, "88"),
      "scrollbarSlider.activeBackground": withAlpha(colors.third, "BB"),
      "editor.background": colors.first,
      "editor.foreground": colors.fifth,
      "editorLineNumber.foreground": colors.third,
      "editorLineNumber.activeForeground": colors.fourth,
      "editorCursor.foreground": colors.fourth,
      "editor.selectionBackground": withAlpha(colors.third, "66"),
      "editor.inactiveSelectionBackground": withAlpha(colors.second, "80"),
      "editor.selectionHighlightBackground": withAlpha(colors.third, "33"),
      "editor.lineHighlightBackground": withAlpha(colors.second, "4D"),
      "editor.lineHighlightBorder": withAlpha(colors.first, "00"),
      "editorWhitespace.foreground": colors.second,
      "editorIndentGuide.background1": colors.second,
      "editorIndentGuide.activeBackground1": colors.third,
      "editorGutter.background": colors.first,
      "editorWidget.background": colors.second,
      "editorWidget.foreground": colors.fifth,
      "editorWidget.border": colors.third,
      "editorHoverWidget.background": colors.second,
      "editorHoverWidget.foreground": colors.fifth,
      "editorHoverWidget.border": colors.third,
      "editorSuggestWidget.background": colors.second,
      "editorSuggestWidget.foreground": colors.fifth,
      "editorSuggestWidget.border": colors.third,
      "editorSuggestWidget.highlightForeground": colors.fourth,
      "editorSuggestWidget.selectedBackground": colors.third,
      "editorSuggestWidget.selectedForeground": colors.first,
      "editorBracketMatch.background": withAlpha(colors.third, "33"),
      "editorBracketMatch.border": colors.third,
      "editorError.foreground": colors.destructive,
      "editorWarning.foreground": colors.warning,
      "editorInfo.foreground": colors.info,
      "editorHint.foreground": colors.success,
      "editorOverviewRuler.errorForeground": colors.destructive,
      "editorOverviewRuler.warningForeground": colors.warning,
      "editorOverviewRuler.infoForeground": colors.info,
      "minimap.background": colors.first,
      "peekView.border": colors.third,
      "peekViewEditor.background": colors.first,
      "peekViewResult.background": colors.second,
      "peekViewTitle.background": colors.second,
    },
  };
}

export function registerEeveeMonacoTheme(monaco: MonacoNamespace): void {
  monaco.editor.defineTheme(
    EEVEE_MONACO_THEME,
    createEeveeMonacoThemeData(),
  );
}
