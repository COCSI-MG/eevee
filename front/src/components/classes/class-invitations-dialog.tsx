"use client";

import { useEffect, useRef, useState } from "react";
import { Link2, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ClassesService } from "@/app/integration/scheduler-api/classes";
import { Route } from "@/app/routes";
import {
  classInvitationsQueryKey,
  useCreateClassInvitation,
} from "@/hooks/use-create-class-invitation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import ClassInvitationForm from "./class-invitation-form";
import ClassInvitationsList from "./class-invitations-list";

const invitationUrl = (token: string) => `${window.location.origin}${Route.ClassInvitation}#token=${token}`;

export default function ClassInvitationsDialog({ classId }: { classId: number }) {
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const submitting = useRef(false);
  const create = useCreateClassInvitation(classId);

  useEffect(() => {
    if (open && !createOpen) {
      createButtonRef.current?.focus();
    }
  }, [open, createOpen]);

  const invitations = useQuery({
    queryKey: classInvitationsQueryKey(classId),
    queryFn: () => ClassesService.listInvitations(classId),
    enabled: open,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });

  const copy = async (token: string) => {
    try {
      await navigator.clipboard.writeText(invitationUrl(token));
      toast({
        title: "Link copiado",
        description: "O link de entrada foi copiado."
      });
    } catch {
      toast({
        title: "Falha ao copiar",
        description: "Não foi possível acessar a área de transferência.",
        variant: "destructive"
      });
    }
  };

  const handleInvitationCreated = (created: { token: string }) => {
    setCreateOpen(false);
    toast({ title: "Link criado", description: "O link já está disponível na lista." });
    void copy(created.token);
  };

  const handleCreate = (expiration: string | null) => {
    if (submitting.current) return;
    submitting.current = true;

    create.mutate(expiration, {
      onSuccess: handleInvitationCreated,
      onSettled: () => {
        submitting.current = false
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) setCreateOpen(false)
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <Link2 /> Link de convite
        </Button>

      </DialogTrigger>

      <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-6xl flex-col gap-0 overflow-hidden rounded-xl p-0">

        <div className="flex shrink-0 items-start gap-4 px-5 pb-8 pt-8 sm:px-8">
          <div aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Link2 className="size-5" />
          </div>

          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="text-xl sm:text-2xl focus:outline-none">
              Links de entrada na turma
            </DialogTitle>

            <DialogDescription className="max-w-2xl leading-relaxed">
              Compartilhe um link ativo para permitir que alunos entrem nesta turma.
            </DialogDescription>

          </DialogHeader>
        </div>

        <div className="flex min-h-0 flex-col gap-6 px-5 pb-6 sm:px-8 sm:pb-8">
          <div className="flex shrink-0 items-center justify-end gap-4">
            {!createOpen && (
              <Button
                ref={createButtonRef}
                type="button"
                className="h-10 gap-2 rounded-lg"
                aria-expanded={createOpen}
                aria-controls="new-class-invitation"
                onClick={() => setCreateOpen(true)}
              >
                <Plus /> Criar link
              </Button>
            )}
          </div>

          {createOpen && (
            <ClassInvitationForm
              isPending={create.isPending}
              onCancel={() => setCreateOpen(false)}
              onCreate={handleCreate}
            />
          )}

          <ClassInvitationsList
            invitations={invitations.data}
            isFetching={invitations.isFetching}
            isError={invitations.isError}
            onRetry={() => invitations.refetch()}
            onCopy={(token) => copy(token)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
