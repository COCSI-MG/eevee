"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ViewportSize {
  width: number;
  height: number;
}

interface PreviewViewportStageProps {
  viewport: PreviewViewport;
  children: ReactNode;
  overlay?: ReactNode
}

const PRESETS = {
  phone: {
    label: "Celular",
    width: 390,
    height: 844
  },
  tablet: {
    label: "Tablet",
    width: 768,
    height: 1024
  },
  desktop: {
    label: "Desktop",
    width: 1440,
    height: 900
  }
};

type ViewportMode = "auto" | keyof typeof PRESETS | "custom";

function validDimension(value: string) {
  return /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

export function usePreviewViewport() {
  const [mode, setMode] = useState<ViewportMode>("auto");
  const [submitted, setSubmitted] = useState(false);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [custom, setCustom] = useState<ViewportSize>({
    width: 1440,
    height: 900
  });
  const [draft, setDraft] = useState({
    width: "1440",
    height: "900"
  });
  const [available, setAvailable] = useState<ViewportSize>({
    width: 0,
    height: 0
  });

  useEffect(() => {
    if (!container) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;

      const validHeightWidth = (previous: { width: number; height: number }) => previous.width === width && previous.height === height

      setAvailable((previous) => validHeightWidth(previous) ? previous : { width, height })
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [container]);

  const dimensionsByMode = {
    ...PRESETS,
    auto: null,
    custom,
  };

  const dimensions = dimensionsByMode[mode];

  const scale = dimensions
    ? Math.min(
        1,
        available.width / dimensions.width,
        available.height / dimensions.height,
      )
    : 1;

  const errors = {
    width: submitted && !validDimension(draft.width),
    height: submitted && !validDimension(draft.height),
  };

  const apply = () => {
    setSubmitted(true);

    if (validDimension(draft.width) && validDimension(draft.height)) {
      setCustom({
        width: Number(draft.width),
        height: Number(draft.height)
      });
    }
  };

  return {
    mode,
    setMode,
    dimensions,
    draft,
    setDraft,
    errors,
    apply,
    scale,
    containerRef: setContainer
  };
}

type PreviewViewport = ReturnType<typeof usePreviewViewport>;

export function PreviewViewportControls({ viewport }: { viewport: PreviewViewport }) {
  const id = useId();

  const { mode, setMode, dimensions, draft, setDraft, errors, apply } = viewport;

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-border/20 bg-background/20 px-3 py-2">

      <Select value={mode} onValueChange={(value) => setMode(value as ViewportMode)}>
        <SelectTrigger aria-label="Tamanho da prévia" className="h-7 w-36 max-w-full border-border/25 bg-background/40 px-2 text-xs shadow-none">
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="auto">Automático</SelectItem>
            {Object.entries(PRESETS).map(([value, preset]) => (
              <SelectItem key={value} value={value}>{preset.label}</SelectItem>
            ))}

          <SelectItem value="custom">Personalizado</SelectItem>
        </SelectContent>
      </Select>

      {dimensions && (
        <p aria-label="Dimensões e escala da prévia" className="text-[11px] tabular-nums text-muted-foreground">
          {dimensions.width} × {dimensions.height} px
        </p>
      )}
      {mode === "custom" && (

        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            apply();
          }}
          className="flex w-full flex-wrap items-start gap-2"
        >
          {(["width", "height"] as const).map((dimension) => (
            <div key={dimension} className="min-w-0 flex-1 basis-24">
              <label
                htmlFor={`${id}-${dimension}`}
                className="mb-1 block text-[11px] text-muted-foreground"
              >
                {dimension === "width" ? "Largura (px)" : "Altura (px)"}
              </label>

              <Input
                id={`${id}-${dimension}`}
                type="number"
                min={1}
                step={1}
                required
                value={draft[dimension]}
                onChange={(event) => {
                  setDraft((previous) => ({
                    ...previous,
                    [dimension]: event.target.value
                  }))
                }}
                className="h-7 px-2 text-xs md:text-xs"
              />
              {errors[dimension] &&
                <p id={`${id}-${dimension}-error`} role="alert" className="mt-1 text-[11px] text-destructive">
                  Informe um inteiro maior que zero.
                </p>
              }
            </div>
          ))}
          <Button
            type="submit"
            size="sm"
            variant="outline"
            className="mt-5 h-7 text-xs"
          >
            Aplicar
            </Button>
        </form>
      )}
    </div>
  );
}

export function PreviewViewportStage({ viewport, children, overlay } : PreviewViewportStageProps) {
  const { dimensions, scale, containerRef } = viewport;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 p-2 lg:p-3">
      <div ref={containerRef} className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
        <div
          className="relative mx-auto overflow-hidden rounded-md bg-white ring-1 ring-inset ring-border/20"
          style={
            dimensions
              ?
                { width: dimensions.width * scale, height: dimensions.height * scale }
              :
                { width: "100%", height: "100%" }
          }
        >
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={
              dimensions
                ?
                  { width: dimensions.width, height: dimensions.height, transform: `scale(${scale})` }
                :
                  { width: "100%", height: "100%" }
            }
          >
            {children}
          </div>
        </div>

        {overlay && <div className="absolute inset-0">{overlay}</div>}
      </div>
    </div>
  );
}
