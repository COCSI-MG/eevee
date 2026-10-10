"use client";
import { useState } from "react";
import { PracticeConfig } from "@/app/interface/scheduler-api/learning-activity";
import { Button } from "@/components/ui/button";
import { SqlLab } from "./sql-lab";
import { ArchitectureLab } from "./architecture-lab";
export function PracticeSpace({ config }: { config: PracticeConfig }) {
  const [selected, setSelected] = useState(0);
  const task = config.tasks[selected];
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-2 rounded-xl border p-4">
        <h2 className="mb-4 font-semibold">Roteiro de prática</h2>
        {config.tasks.map((t, i) => (
          <Button
            key={t.id}
            variant={selected === i ? "default" : "outline"}
            className="h-auto w-full justify-start whitespace-normal py-3 text-left"
            onClick={() => {
              if (
                i !== selected &&
                window.confirm(
                  "Trocar de tarefa reinicia a prática atual. Continuar?",
                )
              )
                setSelected(i);
            }}
          >
            Tarefa {i + 1}
          </Button>
        ))}
        <Button
          variant={selected === -1 ? "default" : "outline"}
          className="w-full"
          onClick={() => {
            if (
              selected !== -1 &&
              window.confirm(
                "Abrir a prática livre reinicia a prática atual. Continuar?",
              )
            )
              setSelected(-1);
          }}
        >
          Prática livre
        </Button>
        <p className="pt-3 text-xs text-muted-foreground">
          Explore, verifique e recomece. Suas verificações não consomem
          tentativas nem geram notas.
        </p>
      </aside>
      <section className="min-w-0 space-y-5">
        <div className="rounded-xl border bg-muted/20 p-5">
          <h2 className="mb-2 text-xl font-semibold">
            {task ? `Tarefa ${selected + 1}` : "Prática livre"}
          </h2>
          <p className="whitespace-pre-wrap">
            {task?.prompt ||
              "Experimente os conceitos no seu próprio ritmo. Você pode reiniciar e voltar ao roteiro quando quiser."}
          </p>
        </div>
        {config.lab === "sql" ? (
          <SqlLab key={selected} setupSql={config.setupSql} task={task} />
        ) : (
          <ArchitectureLab key={selected} task={task} />
        )}
      </section>
    </div>
  );
}
