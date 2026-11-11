"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CalendarClock, LoaderCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface ClassInvitationFormProps {
  isPending: boolean;
  onCancel: () => void;
  onCreate: (expiration: string | null) => void;
}

export default function ClassInvitationForm({ isPending, onCancel, onCreate }: ClassInvitationFormProps) {
  const [hasExpiration, setHasExpiration] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [expirationError, setExpirationError] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isPending) return;

    const expiration = hasExpiration ? new Date(expiresAt) : null;
    const isFiniteExpiration = expiration ? !Number.isFinite(expiration.getTime()) : false

    if (expiration && (!expiresAt || isFiniteExpiration)) {
      setExpirationError("Informe uma data e hora válidas.");
      return;
    }

    if (expiration && expiration.getTime() <= Date.now()) {
      setExpirationError("Escolha uma data e hora no futuro.");
      return;
    }

    setExpirationError("");
    onCreate(expiration?.toISOString() ?? null);
  };

  return (
    <form
      aria-labelledby="new-class-invitation-title"
      id="new-class-invitation"
      className="max-h-[45dvh] shrink-0 overflow-y-auto rounded-xl bg-muted/20 p-5 sm:p-6"
      onSubmit={submit}
      noValidate
    >
      <div>
        <div>
          <div className="flex items-center gap-4">

            <div className="min-w-0 flex-1 space-y-1.5">
              <Label htmlFor="invitation-has-expiration" className="cursor-pointer text-base font-medium">Definir expiração</Label>

              <p id="invitation-expiration-description" className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Escolha uma data limite para a entrada de novos alunos.
              </p>
            </div>

            <Switch
              id="invitation-has-expiration"
              aria-describedby="invitation-expiration-description"
              checked={hasExpiration}
              disabled={isPending}
              onCheckedChange={(checked) => {
                setHasExpiration(checked);
                setExpirationError("");
              }}
            />
          </div>

          {hasExpiration ? (
            <div className="mt-6 max-w-md space-y-3">

              <Label htmlFor="invitation-expires-at">Data e hora de expiração</Label>

              <Input
                id="invitation-expires-at"
                type="datetime-local"
                className="h-12"
                value={expiresAt}
                disabled={isPending}
                aria-invalid={Boolean(expirationError)}
                aria-describedby={expirationError ? "invitation-expiration-error" : "invitation-timezone"}
                onChange={(event) => {
                  setExpiresAt(event.target.value);
                  setExpirationError("");
                }}
              />

              {expirationError
                ? (
                  <p id="invitation-expiration-error" role="alert" className="text-sm text-destructive">{expirationError}</p>
                ) : (
                  <p id="invitation-timezone" className="text-xs text-muted-foreground">O horário segue o fuso do seu dispositivo.</p>
                )
              }
            </div>
          ) : (
            <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarClock aria-hidden="true" className="size-4 shrink-0" />
              Sem expiração. O link pode ser usado a qualquer momento.
            </p>
          )}
        </div>
      </div>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

        <Button
          type="button"
          variant="outline"
          className="h-11"
          disabled={isPending}
          onClick={onCancel}
        >
          Cancelar
        </Button>

        <Button type="submit" className="h-11" disabled={isPending}>
          {isPending ? <LoaderCircle className="animate-spin" /> : <Plus />}

          {isPending ? "Criando..." : "Criar link"}
        </Button>

      </div>
    </form>
  );
}
