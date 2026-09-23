"use client";
import { useState } from "react";
import { PracticeTask } from "@/app/interface/scheduler-api/learning-activity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  matchesExpected,
  parseBase,
  STORAGE_UNITS,
  toBytes,
} from "@/lib/practice/architecture";
export function ArchitectureLab({ task }: { task?: PracticeTask }) {
  const [tool, setTool] = useState<"base" | "storage">(task?.tool || "base");
  const [base, setBase] = useState(task?.inputBase || 2);
  const [value, setValue] = useState(task?.starter || "00000000");
  const [unit, setUnit] = useState("B");
  const [feedback, setFeedback] = useState("");
  let decimal = 0;
  let error = "";
  try {
    decimal = tool === "base" ? parseBase(value, base) : toBytes(value, unit);
  } catch (e) {
    error = (e as Error).message;
  }
  const update = (next: string) => {
    setValue(next);
    setFeedback("");
  };
  return (
    <div className="space-y-5">
      {!task && (
        <div className="flex gap-2">
          <Button
            variant={tool === "base" ? "default" : "outline"}
            onClick={() => {
              setTool("base");
              update("0");
            }}
          >
            Bases numéricas
          </Button>
          <Button
            variant={tool === "storage" ? "default" : "outline"}
            onClick={() => {
              setTool("storage");
              update("0");
            }}
          >
            Unidades de armazenamento
          </Button>
        </div>
      )}
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex-1 space-y-2">
          {tool === "base" ? "Sua representação" : "Sua quantidade"}
          <Input
            aria-label="Valor"
            value={value}
            maxLength={32}
            onChange={(e) => update(e.target.value)}
          />
        </label>
        {tool === "base" ? (
          <label>
            Base
            <select
              aria-label="Base"
              className="block rounded border bg-background p-2"
              value={base}
              disabled={!!task}
              onChange={(e) => {
                setBase(Number(e.target.value));
                update("0");
              }}
            >
              {[2, 10, 16].map((b) => (
                <option key={b} value={b}>
                  {b === 2 ? "Binária" : b === 10 ? "Decimal" : "Hexadecimal"}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label>
            Unidade
            <select
              aria-label="Unidade"
              className="block rounded border bg-background p-2"
              value={unit}
              disabled={!!task}
              onChange={(e) => {
                setUnit(e.target.value);
                setFeedback("");
              }}
            >
              {Object.keys(STORAGE_UNITS).map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </label>
        )}
      </div>
      {tool === "base" && base === 2 && /^[01]{1,8}$/.test(value) && (
        <div className="flex flex-wrap gap-2" aria-label="Bits de um byte">
          {value
            .padStart(8, "0")
            .split("")
            .map((bit, index) => (
              <Button
                key={index}
                variant={bit === "1" ? "default" : "outline"}
                aria-label={`Bit ${7 - index}, valor ${2 ** (7 - index)}`}
                aria-pressed={bit === "1"}
                className="h-16 flex-col"
                onClick={() => {
                  const bits = value.padStart(8, "0").split("");
                  bits[index] = bit === "1" ? "0" : "1";
                  update(bits.join(""));
                }}
              >
                <span>{bit}</span>
                <small>{2 ** (7 - index)}</small>
              </Button>
            ))}
        </div>
      )}
      {error ? (
        <p role="alert">{error}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {(tool === "base"
            ? [
                ["Decimal", String(decimal)],
                ["Binário", decimal.toString(2)],
                ["Hexadecimal", decimal.toString(16).toUpperCase()],
              ]
            : [
                ["Bytes", String(decimal)],
                ["MB (1.000.000 B)", String(decimal / STORAGE_UNITS.MB)],
                ["MiB (1.048.576 B)", String(decimal / STORAGE_UNITS.MiB)],
              ]
          ).map(([label, result]) => (
            <div key={label} className="rounded-xl border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="break-all font-mono text-xl">{result}</p>
            </div>
          ))}
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        {tool === "base"
          ? "Cada posição representa uma potência da base. Frações podem ter representações aproximadas; use ponto como separador."
          : "Prefixos decimais usam potências de 1000; prefixos binários usam potências de 1024. Um byte tem oito bits."}
      </p>
      <div className="flex gap-2">
        {task && (
          <Button
            disabled={!!error}
            onClick={() =>
              setFeedback(
                matchesExpected(decimal, task.expectedValue!)
                  ? "Objetivo alcançado! Observe as representações equivalentes."
                  : "Ainda não. Compare o valor obtido com o objetivo e experimente novamente.",
              )
            }
          >
            Verificar objetivo
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => {
            update(task?.starter || "0");
            setUnit("B");
          }}
        >
          Recomeçar
        </Button>
      </div>
      <p role="status" aria-live="polite">
        {feedback}
      </p>
    </div>
  );
}
