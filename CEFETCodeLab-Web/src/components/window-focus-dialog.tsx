import { useState } from "react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";

export default function WindowFocusDialog({
  onClick,
}: {
  onClick: () => void;
}) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="flex items-center justify-center h-screen opacity-50 bg-black fixed inset-0 z-50">
      <div className="text-center border border-slate-300 p-6 rounded-lg shadow-lg space-y-6">
        <h1 className="text-2xl font-bold mb-4">Atenção!</h1>
        <p className="text-lg mb-4">
          Você está tentando acessar outra aba ou janela do navegador.
        </p>
        <p className="text-sm text-gray-300">
          Se você continuar, será redirecionado para a página inicial.
        </p>
        <div className="flex items-center justify-center mt-4">
          <div className="flex items-start justify-center gap-3">
            <Checkbox
              id="toggle"
              onCheckedChange={() => {
                setChecked(!checked);
              }}
            />
            <Label htmlFor="toggle">
              Eu confirmo que li e estou ciente das minhas ações.
            </Label>
          </div>
        </div>
        <Button
          className="ml-4 justify-center mt-4"
          disabled={!checked}
          onClick={onClick}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
