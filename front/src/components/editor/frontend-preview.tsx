"use client";

import { useMemo, useState } from "react";
import type { SandboxSetup } from "@codesandbox/sandpack-client";
import {
  AlertCircle,
  Monitor,
  RefreshCw,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PREVIEW_STATUS, PreviewStatus } from "@/constants/frontend-preview";
import { createPreviewSandbox, previewEntries, previewFiles } from "@/lib/frontend-preview/sandbox";
import type { FileNode } from "@/types/shared";
import { EditorPanelHeader } from "./editor-panel-header";
import { PreviewNavigator } from "./preview-navigator";
import { PreviewViewportControls, PreviewViewportStage, usePreviewViewport } from "./preview-viewport";
import { useFrontendPreview } from "./use-frontend-preview";

interface FrontendPreviewProps {
  tree: FileNode;
  react: boolean;
  paused?: boolean;
  onClose?: () => void;
  blockContextMenu?: boolean;
}

interface SandpackFrameProps {
  setup: SandboxSetup;
  startRoute: string;
  onRetry: (path?: string) => void;
  viewport: ReturnType<typeof usePreviewViewport>;
}

function PreviewStatusBar({ status }: { status: PreviewStatus }) {
  const { label, icon: Icon, tone, busy } = PREVIEW_STATUS[status];

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex h-8 shrink-0 items-center gap-2 border-t border-border/20 bg-background/30 px-3 text-[11px] text-muted-foreground"
    >
      <Icon aria-hidden="true" className={cn("h-3.5 w-3.5 shrink-0", tone, busy && "animate-spin motion-reduce:animate-none")} />
      <span className="truncate">{label}</span>
    </div>
  );
}

function PreviewStateView({ status, message, onRetry }: { status: PreviewStatus; message?: string; onRetry?: () => void }) {
  const { title, description, icon: Icon, tone, busy } = PREVIEW_STATUS[status];

  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-4 bg-editor-bg px-6 py-8 text-center">

      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border/20 bg-card/40">
        <Icon aria-hidden="true" className={cn("h-5 w-5", tone, busy && "animate-spin motion-reduce:animate-none")} />
      </div>

      <div className="max-w-xs space-y-2">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{message ?? description}</p>
      </div>

      {onRetry && <Button size="sm" variant="outline" onClick={onRetry}><RefreshCw aria-hidden="true" />Tentar novamente</Button>}
    </div>
  );
}

function PreviewError({ message }: { message: string }) {
  return (
    <div role="alert" className="flex max-h-[min(160px,30%)] shrink-0 gap-2.5 overflow-auto border-b border-destructive/25 bg-destructive/10 px-3 py-3">

      <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />

      <div className="min-w-0 space-y-1">
        <p className="text-xs font-medium text-destructive">Revise o código para continuar</p>
        <p className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-foreground">{message}</p>
      </div>
    </div>
  );
}

function SandpackFrame({ setup, startRoute, onRetry, viewport } : SandpackFrameProps) {
  const { status, error, hasRendered, frameRef, navigation, navigate, back, forward } = useFrontendPreview(setup, startRoute);

  const covered = !hasRendered || status === PreviewStatus.Unavailable;

  const retry = () => onRetry(navigation.path);
  return (
    <>
      <PreviewNavigator
        path={navigation.path}
        canGoBack={navigation.back}
        canGoForward={navigation.forward}
        disabled={!navigation.ready || covered}
        onBack={back}
        onForward={forward}
        onRefresh={retry}
        onNavigate={navigate}
      />

      <PreviewViewportControls viewport={viewport} />

      {status === PreviewStatus.Error && error && (
        <PreviewError message={error} />
      )}

      <PreviewViewportStage
        viewport={viewport}
        overlay={covered && (

          <div className="h-full">
            <PreviewStateView
              status={status}
              onRetry={status === PreviewStatus.Unavailable ? retry : undefined}
            />
          </div>
        )}
      >
        <iframe
          ref={frameRef}
          title="Página do aluno"
          data-eevee-frontend-preview="true"
          sandbox="allow-scripts allow-same-origin"
          referrerPolicy="no-referrer"
          tabIndex={covered ? -1 : 0}
          aria-hidden={covered}
          className={cn("absolute inset-0 h-full w-full border-0 bg-white", covered && "invisible")}
        />
      </PreviewViewportStage>
      <PreviewStatusBar status={status} />
    </>
  );
}

export function FrontendPreview({
  tree,
  react,
  paused = false,
  onClose,
  blockContextMenu = false
}: FrontendPreviewProps ) {
  const viewport = usePreviewViewport();

  const files = useMemo(() => previewFiles(tree), [tree]);
  const entries = useMemo(() => previewEntries(files, react), [files, react]);

  const [selectedPath, setSelectedPath] = useState("");

  const entry = entries.find((item) => item.path === selectedPath) ?? entries[0];

  const entryKey = entry ? `${entry.kind}:${entry.path}` : "";

  const [refresh, setRefresh] = useState({ version: 0, entry: "", path: "/" });

  const retry = (path = "/") => setRefresh((value) => ({ version: value.version + 1, entry: entryKey, path }));

  const selectEntry = (path: string) => {
    setSelectedPath(path);
    setRefresh((value) => ({ ...value, entry: "", path: "/" }));
  };

  const prepared = useMemo(() => {
    if (!entry || paused) return {};

    try {
      return {
        setup: createPreviewSandbox(entry, files, react, blockContextMenu)
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Não foi possível preparar a página."
      };
    }

  }, [entry, files, react, paused, blockContextMenu]);

  const inactiveStatus = paused
  ? PreviewStatus.Paused
  : prepared.error
    ? PreviewStatus.Error
    : PreviewStatus.Empty;

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-editor-bg">

      <EditorPanelHeader>
        <Monitor className="h-4 w-4 shrink-0 text-primary" />

        <span className="shrink-0 text-xs font-medium">Resultado</span>

        <div className="ml-auto min-w-0 flex-1">

          {entries.length > 1 ? (
            <Select value={entry?.path} onValueChange={selectEntry} disabled={paused}>
              <SelectTrigger className="h-7 min-w-0 border-border/25 bg-background/40 px-2 text-xs shadow-none [&>span]:truncate">
                <SelectValue />
              </SelectTrigger>

              <SelectContent align="end" className="max-w-[min(28rem,90vw)]">
                {entries.map((item) => {

                  return <SelectItem
                    key={`${item.kind}:${item.path}`}
                    value={item.path}
                    className="text-xs [&>span:last-child]:truncate"
                  >
                    {item.label}
                  </SelectItem>

                })}
              </SelectContent>
            </Select>
          ) : (
            <p className="truncate text-right text-[11px] text-muted-foreground">{entry?.label ?? "Sem página"}</p>
          )}

        </div>
        {onClose &&
          <Button
            size="icon"
            variant="ghost"
            className="-mr-1 h-8 w-8 shrink-0 text-muted-foreground hover:bg-background/50 hover:text-foreground"
            title="Fechar visualização"
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </Button>

        }
      </EditorPanelHeader>

      {prepared.setup ? (
        <SandpackFrame
          key={`${entryKey}:${refresh.version}:${blockContextMenu}`}
          setup={prepared.setup}
          startRoute={refresh.entry === entryKey ? refresh.path : "/"}
          onRetry={retry}
          viewport={viewport}
        />
      ) : (
        <>
          <PreviewNavigator
            disabled
            refreshDisabled
            onRefresh={() => retry()}
          />

          <PreviewViewportControls viewport={viewport} />

          {prepared.error && <PreviewError message={prepared.error} />}

          <div className="min-h-0 flex-1">
            <PreviewStateView status={inactiveStatus} />
          </div>

          <PreviewStatusBar status={inactiveStatus} />
        </>
      )}
    </section>
  );
}
