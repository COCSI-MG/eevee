import { Badge } from "../ui/badge";
import { useState } from "react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";

export default function WorkspaceAgreement({
  title,
  onAccept,
}: {
  title: string;
  onAccept: () => void;
}) {
  const [checked, setChecked] = useState(false);
  const { back } = useRouter();

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="m-auto border border-gray-700 p-4 rounded-lg shadow-lg space-y-6 w-full max-w-2xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            Bem-vindo a tarefa {title}
          </h1>
        </div>

        <div className="flex-1 border p-4 space-y-2">
          <Badge className="bg-red-600 text-white">Penalidades</Badge>
          <h3 className="text-sm text-gray-300">
            O que resulta em penalidades?
          </h3>
          <p className="text-sm text-gray-500">
            Perder o foco da janela por mais de 5 segundos, abrir o console do
            navegador, ou tentar acessar outra aba/janela do navegador.
          </p>
          <p className="text-sm text-gray-500">
            Compartilhar seu código com outras pessoas, também não é legal.
            Estaremos de olho!
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Checkbox
            id="acknowledge"
            onCheckedChange={(checked) => {
              setChecked(!!checked);
            }}
          />
          <Label htmlFor="acknowledge">
            Eu li e entendi as regras desta tarefa.
          </Label>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              back();
            }}
            className="w-32"
          >
            Recusar
          </Button>
          <Button
            onClick={() => onAccept()}
            disabled={!checked}
            className="w-32 bg-blue-600 text-white hover:bg-blue-700"
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
}
