'use client'

import { useRouter } from "next/navigation";
import { Button } from "../../../../../components/ui/button";

export function WorkspaceSuspension() {
  const { back } = useRouter();

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="text-center">
        <p className="text-lg text-red-500">
          Você está suspenso desta atividade. Entre em contato com o professor
          para mais informações.
        </p>
      </div>

      <Button
        onClick={() => back()}
        className="mt-4 justify-center w-64"
        variant={"outline"}
      >
        Voltar
      </Button>
    </div>
  );
}
