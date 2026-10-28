import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ClassesService } from "@/app/integration/scheduler-api/classes";
import type { ClassInvitation } from "@/app/interface/scheduler-api/class";
import { toast } from "@/hooks/use-toast";

export const classInvitationsQueryKey = (classId: number) =>
  ["class-invitations", classId] as const;

export function useCreateClassInvitation(classId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["class-invitations", "create", classId],

    mutationFn: (expiration: string | null) => ClassesService.createInvitation(classId, expiration),

    onSuccess: (created) => {
      queryClient.setQueryData<ClassInvitation[]>(
        classInvitationsQueryKey(classId),
        (current = []) => [
          created,
          ...current.filter((invitation) => invitation.id !== created.id)
        ]
      );
    },
    onError: (error) => {
      toast({
        title: "Não foi possível criar o link",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive"
      });
    }
  });
}
