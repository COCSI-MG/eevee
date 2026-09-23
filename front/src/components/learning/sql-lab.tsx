"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { PracticeTask } from "@/app/interface/scheduler-api/learning-activity";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Result {
  rows: Record<string, unknown>[];
  fields: { name: string }[];
  affectedRows?: number;
  truncated?: boolean;
}
export function SqlLab({
  setupSql,
  task,
}: {
  setupSql: string;
  task?: PracticeTask;
}) {
  const worker = useRef<Worker | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sql, setSql] = useState(
    task?.starter || "SELECT * FROM funcionarios;",
  );
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const stop = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    worker.current?.terminate();
    worker.current = null;
    setBusy(false);
    setReady(false);
  }, []);
  const armTimeout = useCallback(
    (milliseconds: number) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        stop();
        setMessage("Tempo limite atingido. Reinicie o banco para continuar.");
      }, milliseconds);
    },
    [stop],
  );
  const reset = useCallback(() => {
    stop();
    setBusy(true);
    setMessage("Preparando seu banco de prática…");
    setResults([]);
    const next = new Worker("/practice-sql/worker.mjs", { type: "module" });
    worker.current = next;
    next.onmessage = ({ data }) => {
      if (worker.current !== next) return;
      if (timer.current) clearTimeout(timer.current);
      setBusy(false);
      if (!data.ok) {
        setMessage(data.error);
        return;
      }
      setReady(true);
      if (typeof data.correct === "boolean")
        setMessage(
          data.correct
            ? "Objetivo alcançado! Experimente outra solução ou avance."
            : "O resultado ainda não corresponde ao objetivo. Inspecione as linhas e tente novamente.",
        );
      else {
        setResults(data.results);
        setMessage(
          data.results.length
            ? "Comando executado."
            : "Banco pronto. Você pode experimentar.",
        );
      }
    };
    next.onerror = () => {
      stop();
      setMessage("Não foi possível iniciar o banco. Tente reiniciar.");
    };
    next.postMessage({ action: "init", sql: setupSql });
    armTimeout(60000);
  }, [setupSql, stop, armTimeout]);
  useEffect(() => {
    reset();
    return stop;
  }, [reset, stop]);
  const send = (action: "run" | "check") => {
    if (!ready || busy || !worker.current) return;
    setBusy(true);
    setMessage(action === "check" ? "Verificando o objetivo…" : "Executando…");
    worker.current.postMessage({
      action,
      sql: action === "run" ? sql : task?.checkSql,
      expectedRows: task?.expectedRows,
    });
    armTimeout(10000);
  };
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
        Seu banco é individual e temporário. Alterações permanecem nesta sessão;
        reiniciar, trocar de tarefa ou sair descarta os dados. A prática não
        gera nota.
      </div>
      <label className="block space-y-2 font-medium">
        Editor SQL
        <Textarea
          aria-label="Editor SQL"
          className="min-h-56 font-mono"
          value={sql}
          maxLength={20000}
          onChange={(e) => setSql(e.target.value)}
          spellCheck={false}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={!ready || busy || !sql.trim()}
          onClick={() => send("run")}
        >
          Executar SQL
        </Button>
        {task && (
          <Button
            variant="outline"
            disabled={!ready || busy}
            onClick={() => send("check")}
          >
            Verificar objetivo
          </Button>
        )}
        {busy && (
          <Button
            variant="outline"
            onClick={() => {
              stop();
              setMessage(
                "Execução interrompida. Reinicie o banco para continuar.",
              );
            }}
          >
            Interromper
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => {
            if (
              window.confirm(
                "Reiniciar o banco e descartar todas as alterações desta sessão?",
              )
            )
              reset();
          }}
        >
          Reiniciar banco
        </Button>
      </div>
      <p role="status" className="text-sm" aria-live="polite">
        {message}
      </p>
      {results.map((result, i) => (
        <section key={i} className="overflow-auto rounded-lg border p-3">
          <p className="mb-2 text-sm text-muted-foreground">
            Resultado {i + 1} · {result.affectedRows ?? result.rows.length}{" "}
            linha(s)
            {result.truncated && " · exibição limitada a 200 linhas / 64 KB"}
          </p>
          {!!result.fields.length && (
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  {result.fields.map((f, index) => (
                    <th key={index} className="border-b p-2">
                      {f.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, r) => (
                  <tr key={r}>
                    {result.fields.map((f, c) => (
                      <td key={c} className="max-w-80 break-words border-b p-2">
                        {row[f.name] === null
                          ? "NULL"
                          : String(row[f.name] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ))}
    </div>
  );
}
