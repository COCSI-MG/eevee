"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PreviewNavigatorProps {
  path?: string;
  canGoBack?: boolean;
  canGoForward?: boolean;
  disabled?: boolean;
  refreshDisabled?: boolean;
  onBack?: () => void;
  onForward?: () => void;
  onRefresh: () => void;
  onNavigate?: (path: string) => boolean;
}

export function PreviewNavigator({
  path = "/",
  canGoBack = false,
  canGoForward = false,
  disabled = false,
  refreshDisabled = false,
  onBack,
  onForward,
  onRefresh,
  onNavigate
}: PreviewNavigatorProps ) {
  const [draft, setDraft] = useState(path);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    setDraft(path);
    setInvalid(false);
  }, [path]);

  const actions = [
    {
      label: "Voltar na prévia",
      title: "Voltar",
      icon: ArrowLeft,
      disabled: disabled || !canGoBack,
      onClick: onBack
    },
    {
      label: "Avançar na prévia",
      title: "Avançar",
      icon: ArrowRight,
      disabled: disabled || !canGoForward,
      onClick: onForward
    },
    {
      label: "Atualizar prévia",
      title: "Atualizar prévia",
      icon: RefreshCw,
      disabled: refreshDisabled,
      onClick: onRefresh
    }
  ];

  return (
    <div className="shrink-0 border-b border-border/20 bg-background/30 px-2 py-1.5 lg:px-3">
      <form
        aria-label="Navegação da prévia"
        className="flex min-w-0 items-center gap-1"
        onSubmit={(event) => {
          event.preventDefault();
          if (!disabled) setInvalid(!onNavigate?.(draft));

        }}
      >
        {actions.map(({ label, title, icon: Icon, disabled: actionDisabled, onClick }) => (

          <Button
            key={label} type="button" variant="ghost" size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground"
            aria-label={label} title={title} disabled={actionDisabled} onClick={onClick}
          >
            <Icon aria-hidden="true" className="h-3.5 w-3.5" />
          </Button>

        ))}

        <Input
          disabled={disabled}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setInvalid(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setDraft(path);
              setInvalid(false);
            }
          }}
          placeholder="/"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          className="ml-1 h-7 min-w-0 flex-1 border-border/25 bg-background/40 px-2 font-mono text-xs shadow-none md:text-xs"
        />
      </form>

      {invalid &&
        <p role="alert" className="mt-1 text-xs text-destructive">
          Informe um caminho da aplicação, como /login.
        </p>
      }
    </div>
  );
}
