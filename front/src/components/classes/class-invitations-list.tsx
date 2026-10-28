"use client";

import { AlertCircle, Copy, Link2, LoaderCircle } from "lucide-react";
import type { ClassInvitation } from "@/app/interface/scheduler-api/class";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface ClassInvitationsListProps {
  invitations?: ClassInvitation[];
  isFetching: boolean;
  isError: boolean;
  onRetry: () => void;
  onCopy: (token: string) => void;
}

export default function ClassInvitationsList(props: ClassInvitationsListProps) {
  return (
    <div className="flex min-h-0 flex-col">
      <InvitationsContent {...props} />
    </div>
  );
}

function InvitationsContent({
  invitations,
  isFetching,
  isError,
  onRetry,
  onCopy
}: ClassInvitationsListProps) {
  if (isFetching) {
    return (
      <div role="status" className="flex min-h-56 items-center justify-center gap-3 text-sm text-muted-foreground">
        <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
        Carregando links...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center gap-4 text-center">
        <AlertCircle aria-hidden="true" className="size-8 text-destructive" />

        <p role="alert" className="text-sm text-destructive">Não foi possível carregar os links.</p>

        <Button type="button" variant="outline" onClick={onRetry}>Tentar novamente</Button>
      </div>
    );
  }

  if (!invitations?.length) {
    return (
      <div className="mt-3 flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-5 py-8 text-center">

        <div aria-hidden="true" className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Link2 className="size-7" />
        </div>

        <h3 className="text-lg font-semibold">Nenhum link por aqui ainda</h3>

        <p className="mb-6 mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Crie um link para convidar alunos para esta turma.
        </p>

      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-md border [&>div]:max-h-[55dvh] [&>div]:min-h-0 [&>div]:overflow-auto">
      <Table className="min-w-[480px] table-fixed">

        <TableHeader className="sticky top-0 z-10 bg-background">
          <TableRow>

            <TableHead className="h-12 px-4 text-xs">Criado em</TableHead>
            <TableHead className="h-12 px-4 text-xs">Expiração</TableHead>
            <TableHead className="h-12 w-32 px-4 text-xs">Ação</TableHead>

          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.map((invitation) => (

            <TableRow key={invitation.id}>

              <TableCell className="px-4 py-5">
                <InvitationDate value={invitation.createdAt} />
              </TableCell>

              <TableCell className="px-4 py-5">
                {invitation.expiresAt ? (
                  <InvitationDate value={invitation.expiresAt} />
                ) : (
                  <span className="inline-flex rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    Sem expiração
                  </span>
                )}
              </TableCell>

              <TableCell className="px-4 py-5">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 gap-2 rounded-lg text-muted-foreground hover:text-foreground"
                  onClick={() => onCopy(invitation.token)}
                  aria-label={`Copiar link do convite ${invitation.id}`}
                >
                  <Copy /> Copiar
                </Button>
              </TableCell>

            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function InvitationDate({ value }: { value: string }) {
  const date = new Date(value);

  return (
    <time dateTime={value} className="flex flex-col gap-1 whitespace-nowrap tabular-nums">

      <span>{date.toLocaleDateString("pt-BR")}</span>

      <span className="text-xs text-muted-foreground">
        {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
      </span>
    </time>
  );
}
