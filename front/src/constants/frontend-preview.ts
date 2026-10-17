import {
  AlertCircle,
  CircleCheck,
  FileCode2,
  Loader2,
  Pause,
  WifiOff,
  type LucideIcon
} from "lucide-react";

export const PREVIEW_CONTEXT_MENU_SCRIPT = `(() => {
  const key = Symbol.for("eevee.preview.context-menu");
  if (window[key]) return;
  window[key] = true;
  const devToolsKeys = new Set(["c", "i", "j", "k"]);
  window.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
  window.addEventListener("keydown", (event) => {
    const isF12 = event.key === "F12";

    const isCtrlShift = event.ctrlKey && event.shiftKey;
    const isCmdShift = event.metaKey && event.shiftKey;
    const isCmdOption = event.metaKey && event.altKey;

    const hasDevToolsKey = devToolsKeys.has(event.key.toLowerCase());

    const isDevToolsShortcut = isF12 || ((isCtrlShift || isCmdShift || isCmdOption) && hasDevToolsKey);

    if (!isDevToolsShortcut) return;

    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
})();`;

export enum PreviewStatus {
  Loading = "loading",
  Dependencies = "dependencies",
  Compiling = "compiling",
  Ready = "ready",
  Error = "error",
  Unavailable = "unavailable",
  Paused = "paused",
  Empty = "empty"
}

interface PreviewStatusInfo {
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: string;
  busy?: boolean;
}

export const PREVIEW_STATUS: Record<PreviewStatus, PreviewStatusInfo> = {
  [PreviewStatus.Loading]: {
    label: "Preparando visualização…",
    title: "Preparando sua página",
    description: "Carregando o ambiente de visualização.",
    icon: Loader2,
    tone: "text-muted-foreground",
    busy: true
  },
  [PreviewStatus.Dependencies]: {
    label: "Carregando dependências…",
    title: "Preparando sua aplicação",
    description: "Carregando os recursos necessários para abrir a página.",
    icon: Loader2,
    tone: "text-muted-foreground",
    busy: true
  },
  [PreviewStatus.Compiling]: {
    label: "Atualizando página…",
    title: "Preparando sua página",
    description: "Aplicando as alterações do código.",
    icon: Loader2,
    tone: "text-muted-foreground",
    busy: true
  },
  [PreviewStatus.Ready]: {
    label: "Atualização automática",
    title: "Página atualizada",
    description: "",
    icon: CircleCheck,
    tone: "text-success"
  },
  [PreviewStatus.Error]: {
    label: "Revise o código para continuar",
    title: "Revise o código",
    description: "Corrija o erro indicado. A prévia atualiza após a edição.",
    icon: AlertCircle,
    tone: "text-destructive"
  },
  [PreviewStatus.Unavailable]: {
    label: "Visualização indisponível",
    title: "Não foi possível abrir a prévia",
    description: "Verifique a conexão e tente novamente.",
    icon: WifiOff,
    tone: "text-warning"
  },
  [PreviewStatus.Paused]: {
    label: "Visualização pausada",
    title: "Visualização pausada",
    description: "Retome a atividade para continuar a visualização.",
    icon: Pause,
    tone: "text-warning"
  },
  [PreviewStatus.Empty]: {
    label: "Nenhuma página selecionada",
    title: "Sua página aparece aqui",
    description: "Crie um arquivo HTML para começar a visualizar.",
    icon: FileCode2,
    tone: "text-muted-foreground"
  }
};
