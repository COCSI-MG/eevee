"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Route } from "@/app/routes";
import { ClassesService } from "@/app/integration/scheduler-api/classes";
import { UserRole } from "@/app/interface/scheduler-api/user";
import { useAuthContext } from "@/hooks/use-auth-context";
import Loader from "@/components/loader";
import {
  clearPendingClassInvitation,
  getPendingClassInvitation
} from "@/utils/pending-class-invitation";

export default function ClassInvitationPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const [error, setError] = useState("");
  const regexValidationLink = /^[a-f0-9]{64}$/

  useEffect(() => {
    if (!user) return;

    const fragmentToken = new URLSearchParams(window.location.hash.slice(1)).get("token");

    const token = fragmentToken || getPendingClassInvitation() || "";

    if (!regexValidationLink.test(token)) {
      setError("Link de convite inválido. Solicite um novo link ao professor.");
      return;
    }

    if (user.role !== UserRole.STUDENT) {
      clearPendingClassInvitation();
      setError("Este link de entrada é destinado a alunos.");
      return;
    }

    let active = true;

    ClassesService.acceptInvitation(token)
      .then(({ classId }) => {
        if (!active) return;
        clearPendingClassInvitation();
        window.history.replaceState(null, "", Route.ClassInvitation);
        router.replace(`/${Route.Classes}/${classId}`);
      })

      .catch(() => {
        if (!active) return;
        clearPendingClassInvitation();
        window.history.replaceState(null, "", Route.ClassInvitation);
        setError("Link de convite inválido. Solicite um novo link ao professor.");
      });

    return () => { active = false; };
  }, [router, user]);

  return (
    <div className="mx-auto max-w-xl space-y-4 p-8 text-center">
      {error
        ?
          <p role="alert" className="text-destructive">{error}</p>
        :
          <>
            <Loader fullScreen={false} />
            <p>Validando o convite e adicionando você à turma...</p>
          </>
      }
    </div>
  );
}
