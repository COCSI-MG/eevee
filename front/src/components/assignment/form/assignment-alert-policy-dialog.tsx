"use client";

import { AssignmentAlertType } from "@/app/interface/scheduler-api/assignment-alert";
import type { AssignmentAlertPolicy } from "@/app/interface/scheduler-api/assignment-alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormik } from "formik";
import { Check } from "lucide-react";
import { useEffect } from "react";
import { assignmentAlertPolicyValidationSchema } from "./assignment-alert-policy-validation";

const ALERT_OPTIONS = [
  {
    type: AssignmentAlertType.WindowFocusLoss,
    label: "Sair da tela da atividade",
    description: "Conta uma ocorrência por perda de foco da janela."
  },
  {
    type: AssignmentAlertType.DevTools,
    label: "Abrir as ferramentas do desenvolvedor",
    description: "Inclui F12, atalhos equivalentes e detecção do DevTools."
  },
  {
    type: AssignmentAlertType.Clipboard,
    label: "Copiar, recortar ou colar conteúdo proibido",
    description: "Cada operação bloqueada conta como uma ocorrência."
  },
  {
    type: AssignmentAlertType.TypingRate,
    label: "Exceder o limite de caracteres por segundo",
    description: "Pausa o editor e pede confirmação antes de continuar."
  },
];

interface AssignmentAlertPolicyDraft {
  suspensionAlertLimit: number | string;
  typingCharactersPerSecondLimit: number | string;
  punitiveTypes: AssignmentAlertType[];
}

interface AssignmentAlertPolicyDialogProps {
  open: boolean;
  value: AssignmentAlertPolicy;
  onOpenChange: (open: boolean) => void;
  onSave: (value: AssignmentAlertPolicy) => void;
}

function toDraft(value: AssignmentAlertPolicy): AssignmentAlertPolicyDraft {
  return {
    suspensionAlertLimit: value.suspensionAlertLimit,
    typingCharactersPerSecondLimit: value.typingCharactersPerSecondLimit,
    punitiveTypes: [...value.punitiveTypes]
  };
}

export function AssignmentAlertPolicyDialog({
  open,
  value,
  onOpenChange,
  onSave
}: AssignmentAlertPolicyDialogProps) {
  const formik = useFormik<AssignmentAlertPolicyDraft>({
    initialValues: toDraft(value),
    validationSchema: assignmentAlertPolicyValidationSchema,
    onSubmit: (values) => {
      onSave({
        suspensionAlertLimit: Number(values.suspensionAlertLimit),
        typingCharactersPerSecondLimit: Number(values.typingCharactersPerSecondLimit),
        punitiveTypes: [...values.punitiveTypes],
        version: value.version
      });
      onOpenChange(false);
    },
  });
  const { resetForm } = formik;

  useEffect(() => {
    if (open) {
      resetForm({ values: toDraft(value) });
    }
  }, [open, resetForm, value]);

  const suspensionError = formik.touched.suspensionAlertLimit && formik.errors.suspensionAlertLimit;
  const typingRateError = formik.touched.typingCharactersPerSecondLimit && formik.errors.typingCharactersPerSecondLimit;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100vw-2rem)] max-w-4xl flex-col gap-0 overflow-hidden border-border bg-card p-0">

        <DialogHeader className="shrink-0 space-y-2 px-6 pb-4 pt-6 pr-12">
          <DialogTitle className="text-foreground">
            Monitoramento e bloqueio
          </DialogTitle>
          <DialogDescription className="text-left">
            As proteções continuam ativas. Apenas os eventos selecionados abaixo
            geram alertas punitivos no histórico do aluno.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          onSubmit={formik.handleSubmit}
        >
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 pb-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dialogSuspensionAlertLimit">
                  Alertas ativos para bloquear
                </Label>
                <Input
                  id="dialogSuspensionAlertLimit"
                  name="suspensionAlertLimit"
                  type="number"
                  min={1}
                  max={100}
                  value={formik.values.suspensionAlertLimit}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  aria-invalid={Boolean(suspensionError)}
                  aria-describedby={suspensionError ? "suspensionAlertLimitError" : undefined }
                  className="bg-primary/20 text-foreground"
                />
                {suspensionError && (
                  <p
                    id="suspensionAlertLimitError"
                    className="text-sm text-destructive"
                  >
                    {suspensionError}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dialogTypingCharactersPerSecondLimit">
                  Caracteres digitados por segundo
                </Label>
                <Input
                  id="dialogTypingCharactersPerSecondLimit"
                  name="typingCharactersPerSecondLimit"
                  type="number"
                  min={1}
                  max={1000}
                  value={formik.values.typingCharactersPerSecondLimit}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  aria-invalid={Boolean(typingRateError)}
                  aria-describedby={
                    typingRateError
                      ? "typingCharactersPerSecondLimitHint typingCharactersPerSecondLimitError"
                      : "typingCharactersPerSecondLimitHint"
                  }
                  className="bg-primary/20 text-foreground"
                />
                <p
                  id="typingCharactersPerSecondLimitHint"
                  className="text-xs text-muted-foreground"
                >
                  Padrão: 20 caracteres por segundo.
                </p>
                {typingRateError && (
                  <p
                    id="typingCharactersPerSecondLimitError"
                    className="text-sm text-destructive"
                  >
                    {typingRateError}
                  </p>
                )}
              </div>
            </div>

            <fieldset className="space-y-3">
              <legend className="mb-3 text-sm font-medium text-foreground">
                Eventos que contam como alerta punitivo
              </legend>
              {ALERT_OPTIONS.map((option) => {
                const isChecked = formik.values.punitiveTypes.includes(option.type);

                return (
                  <label
                    key={option.type}
                    htmlFor={`alertPolicy-${option.type}`}
                    className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 transition-colors hover:bg-primary/10"
                  >
                    <Checkbox
                      id={`alertPolicy-${option.type}`}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        const punitiveTypes = checked
                          ? [...formik.values.punitiveTypes, option.type]
                          : formik.values.punitiveTypes.filter((type) => type !== option.type);

                        formik.setFieldValue("punitiveTypes", punitiveTypes);
                      }}
                      className="mt-1"
                    />
                    <span>
                      <span className="block text-sm font-medium text-foreground">
                        {option.label}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </fieldset>
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-border px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              <Check className="h-4 w-4" />
              Salvar configurações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
