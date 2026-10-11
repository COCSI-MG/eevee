"use client";

import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import {
  AssignmentAlertPolicy,
  AssignmentAlertType,
} from "@/app/interface/scheduler-api/assignment-alert";

const ALERT_RULE_LABELS: Record<AssignmentAlertType, string> = {
  [AssignmentAlertType.WindowFocusLoss]: "Sair da tela da atividade",
  [AssignmentAlertType.DevTools]: "Abrir as ferramentas do desenvolvedor",
  [AssignmentAlertType.Clipboard]: "Copiar, recortar ou colar conteúdo proibido",
  [AssignmentAlertType.TypingRate]: "Exceder o limite de digitação configurado",
  [AssignmentAlertType.LegacySuspension]: "Suspensão legada",
};

export default function WorkspaceAgreement({
  title,
  onAccept,
  assignmentId,
  userId,
  alertPolicy,
}: {
  title: string;
  onAccept: () => void;
  assignmentId: number;
  userId: number;
  alertPolicy: AssignmentAlertPolicy;
}) {
  const [checked, setChecked] = useState(false);
  const [hasAgreed, setHasAgreed] = useState<boolean | null>(null);
  const { back } = useRouter();

  useEffect(() => {
    try {
      const agreedBefore = localStorage.getItem(`agreement-${assignmentId}-user-${userId}-v${alertPolicy.version ?? 1}`) === "true";

      setHasAgreed(agreedBefore);
    } catch {
      setHasAgreed(false);
    }

  }, [alertPolicy.version, assignmentId, userId]);

  // Aceitar automaticamente se já concordou antes
  useEffect(() => {
    if (hasAgreed === true) {
      onAccept();
    }
  }, [hasAgreed, onAccept]);

  const handleAccept = () => {
    try {
      localStorage.setItem(`agreement-${assignmentId}-user-${userId}-v${alertPolicy.version ?? 1}`, "true");

    } catch (error) {
      console.warn("Não foi possível salvar a aceitação do termo:", error);
    }
    onAccept();
  };

  if (hasAgreed === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (hasAgreed) {
    return null;
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="m-auto border border-border bg-card p-6 rounded-lg shadow-lg space-y-6 w-full max-w-2xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-foreground">
            Bem-vindo à tarefa {title}
          </h1>
          <p className="text-sm text-muted-foreground">
            Leia atentamente as regras antes de continuar
          </p>
        </div>

        <div className="border border-border bg-background/50 p-4 rounded-md space-y-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Penalidades
            </Badge>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              O que resulta em penalidades?
            </h3>
            {alertPolicy.punitiveTypes.length > 0 ? (

              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                {alertPolicy.punitiveTypes.map((type) => (
                  <li key={type}>{ALERT_RULE_LABELS[type]}</li>
                ))}
              </ul>

            ) : (

              <p className="text-sm text-muted-foreground">
                Nenhuma ação bloqueada gera alerta punitivo nesta atividade.
              </p>

            )}
            <p className="text-sm text-foreground">
              O acesso será bloqueado ao atingir {alertPolicy.suspensionAlertLimit}{" "}
              alerta(s) ativo(s). O limite de digitação é{" "}
              {alertPolicy.typingCharactersPerSecondLimit} caracteres por segundo.
            </p>

            <p className="text-sm text-warning mt-2">
              ⚠️ As ações protegidas continuam sendo bloqueadas mesmo quando não geram um alerta punitivo.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-background/30 rounded-md">
          <Checkbox
            id="acknowledge"
            checked={checked}
            onCheckedChange={(value) => setChecked(!!value)}
            className="mt-0.5"
          />
          <Label
            htmlFor="acknowledge"
            className="text-sm text-foreground cursor-pointer leading-relaxed"
          >
            Eu li e entendi as regras desta tarefa. Concordo em seguir as
            diretrizes e aceito as penalidades em caso de violação.
          </Label>
        </div>

        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => back()}
            className="w-32 border-border text-foreground hover:bg-primary/20 hover:text-foreground"
          >
            Recusar
          </Button>
          <Button
            onClick={handleAccept}
            disabled={!checked}
            className="w-32 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-primary/20 disabled:text-muted-foreground"
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
}
