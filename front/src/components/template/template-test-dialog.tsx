"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { AxiosError } from "axios";
import { CheckCircle2, FlaskConical, Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTemplateTest } from "@/hooks/use-template-test";
import { WorkerType } from "@/app/interface/scheduler-api/worker";
import { TemplateParamType } from "@/app/interface/scheduler-api/template";
import { WorkerDefaultTemplateMap } from "@/app/admin/assignments/constants";
import { Tooltip } from "../ui/tooltip";
import { getWorkerLanguageConfig } from "@/lib/monaco/worker-language";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type ParamValueState = Record<string, string>;

interface TemplateTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workerType: WorkerType;
  templateContent: string;
  paramNames: string[];
  paramTypesByName: Record<string, TemplateParamType>;
  dependencies: string[];
}

function computeScore(passes: number, failures: number): number {
  const total = passes + failures;
  if (total === 0) return 0;
  return passes / total;
}

export function TemplateTestDialog({
  open,
  onOpenChange,
  workerType,
  templateContent,
  paramNames,
  paramTypesByName,
  dependencies,
}: TemplateTestDialogProps) {
  const [applicationFileContent, setApplicationFileContent] = useState("");
  const [paramValues, setParamValues] = useState<ParamValueState>({});
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const isJavascriptDefault = workerType === WorkerType.JAVASCRIPT_DEFAULT;
  const applicationExtension = isJavascriptDefault ? "js" : "ts";

  const defaultAppContent =
    WorkerDefaultTemplateMap[workerType] ??
    WorkerDefaultTemplateMap[WorkerType.NODE_DEFAULT];

  useEffect(() => {
    if (!open) return;
    setApplicationFileContent(defaultAppContent);
    setParamValues({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, workerType]);

  const { mutate, isPending, data, error, reset } = useTemplateTest();

  const paramEntries = useMemo(
    () =>
      paramNames.map((name) => ({
        name,
        type: paramTypesByName[name] ?? TemplateParamType.STRING,
      })),
    [paramNames, paramTypesByName],
  );

  const handleRun = () => {
    reset();
    mutate({
      workerType,
      templateContent,
      applicationFileContent,
      params: paramValues,
      paramDefs: paramEntries.map(({ name, type }) => ({ name, type })),
      dependencies,
    });
  };

  const hasUnsavedWork =
    isPending ||
    data !== undefined ||
    applicationFileContent !== defaultAppContent ||
    Object.values(paramValues).some((v) => v !== "");

  const requestClose = () => {
    setConfirmCloseOpen(true);
  };

  const handleOpenChange = (next: boolean) => {
    if (next) {
      onOpenChange(true);
      return;
    }
    requestClose();
  };

  const isRunning = isPending;
  const hasResult = data !== undefined;
  const hasError = error !== null;
  const score = data ? computeScore(data.passes, data.failures) : 0;
  const isAcceptable = hasResult && score >= 0.7;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Testar template <Tooltip message="Área específica para realização da validação dos templates de testes. Nada executado aqui será salvo, use a o campo de código de aplicação para testar o template." />
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Label className="text-slate-200">{`app${getWorkerLanguageConfig(workerType).fileExtension} (código de aplicação)`}</Label>
            </div>
            <div className="rounded-md border border-slate-700 overflow-hidden">
              <Editor
                height="320px"
                defaultLanguage={getWorkerLanguageConfig(workerType).editorLanguage}
                theme="vs-dark"
                value={applicationFileContent}
                onChange={(value) => setApplicationFileContent(value ?? "")}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  wrappingIndent: "indent",
                  fontSize: 13,
                  lineNumbers: "on",
                }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              No seu teste, importe o app de{" "}
              <code className="rounded bg-muted px-1">{"../src/app"}</code>{" "}
              (caminho canônico) ou{" "}
              <code className="rounded bg-muted px-1">{"./app"}</code>{" "}
              (legado, mesmo diretório do teste).
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-slate-200">Parâmetros do template</Label>
            </div>
            {paramEntries.length === 0 ? (
              <p className="text-sm text-slate-400 italic">
                Este template não declara parâmetros.
              </p>
            ) : (
              <div className="space-y-3">
                {paramEntries.map(({ name, type }) => (
                  <ParamField
                    key={name}
                    name={name}
                    type={type}
                    value={paramValues[name] ?? ""}
                    onChange={(next) =>
                      setParamValues((prev) => ({ ...prev, [name]: next }))
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
          <div className="text-xs text-slate-400">
            Worker: <span className="font-mono">{workerType}</span>
            {dependencies.length > 0 && (
              <>
                {" "}
                · Deps:{" "}
                <span className="font-mono">{dependencies.join(", ")}</span>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={requestClose}
              disabled={isRunning}
            >
              Fechar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleRun}
              disabled={isRunning}
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Escalando pod…
                </>
              ) : (
                <>
                  <FlaskConical className="h-4 w-4 mr-2" />
                  Executar teste
                </>
              )}
            </Button>
          </div>
        </DialogFooter>

        {hasError && (
          <Card className="border-red-700 bg-red-950/40">
            <CardContent className="p-4 text-sm text-red-200 space-y-2">
              <p className="font-semibold">Falha ao executar o teste.</p>
              <p>
                {error instanceof AxiosError
                  ? error.response?.data?.message ??
                    error.message ??
                    "Erro de rede ao chamar o backend."
                  : error instanceof Error
                    ? error.message
                    : "Erro desconhecido."}
              </p>
              <p className="text-xs text-red-300/80">
                Causas comuns: (1) o pod não conseguiu pullar a imagem do
                worker — verifique{" "}
                <code className="rounded bg-black/30 px-1">
                  {isJavascriptDefault
                    ? "WORKER_IMAGE_JAVASCRIPT_DEFAULT"
                    : "WORKER_IMAGE_NODE_DEFAULT"}
                </code>{" "}
                e{" "}
                <code className="rounded bg-black/30 px-1">
                  WORKER_BOOTSTRAP_IMAGE
                </code>{" "}
                no backend; (2) o teste referencia um módulo que não existe
                no pod (ex.:{" "}
                <code className="rounded bg-black/30 px-1">
                  require(&quot;./isEven&quot;)
                </code>{" "}
                quando o app só está em{" "}
                <code className="rounded bg-black/30 px-1">
                  /app/src/app.{applicationExtension}
                </code>
                ); (3) o pod foi morto antes do Jest terminar (timeout).
                Inspecione o pod com{" "}
                <code className="rounded bg-black/30 px-1">
                  kubectl describe pod
                </code>{" "}
                para detalhes.
              </p>
            </CardContent>
          </Card>
        )}

        {hasResult && data && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <ResultStat label="Passaram" value={data.passes} tone="ok" />
              <ResultStat label="Falharam" value={data.failures} tone="bad" />
              <ResultStat
                label="Score"
                value={`${(score * 100).toFixed(0)}%`}
                tone={isAcceptable ? "ok" : "bad"}
              />
              <Card>
                <CardContent className="p-3 flex items-center justify-center gap-2 text-sm font-medium h-full">
                  {isAcceptable ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Aceitável
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Label className="text-slate-200">Log completo</Label>
              <pre className="mt-1 max-h-72 overflow-auto rounded-md border border-slate-700 bg-slate-950 p-3 text-xs text-slate-200 whitespace-pre-wrap">
                {data.completeTrace || "(sem saída)"}
              </pre>
            </div>
          </div>
        )}
      </DialogContent>

      <AlertDialog open={confirmCloseOpen} onOpenChange={setConfirmCloseOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fechar o teste?</AlertDialogTitle>
            <AlertDialogDescription>
              {isRunning
                ? "Um pod está em execução. Fechar agora descarta a execução em andamento e o resultado do teste."
                : hasUnsavedWork
                  ? "O resultado do último teste, o código de aplicação e os valores de parâmetros serão descartados."
                  : "Nada foi executado ainda, mas o modal será fechado."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar testando</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmCloseOpen(false);
                onOpenChange(false);
              }}
            >
              Fechar mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

function ResultStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: "ok" | "bad";
}) {
  const color = tone === "ok" ? "text-emerald-500" : "text-red-500";
  return (
    <Card>
      <CardContent className="p-3 flex flex-col items-center justify-center text-center">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={`text-2xl font-bold ${color}`}>{value}</span>
      </CardContent>
    </Card>
  );
}

function ParamField({
  name,
  type,
  value,
  onChange,
}: {
  name: string;
  type: TemplateParamType;
  value: string;
  onChange: (next: string) => void;
}) {
  if (type === TemplateParamType.BOOLEAN) {
    const checked = value === "true";
    return (
      <div className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-800 px-3 py-2">
        <div>
          <Label className="text-slate-200">{name}</Label>
          <p className="text-xs text-slate-400">boolean</p>
        </div>
        <Checkbox
          checked={checked}
          onCheckedChange={(c) => onChange(c ? "true" : "false")}
          aria-label={`Valor para ${name}`}
        />
      </div>
    );
  }

  if (type === TemplateParamType.NUMBER) {
    return (
      <div className="space-y-1">
        <Label className="text-slate-200">
          {name} <span className="text-xs text-slate-400">(number)</span>
        </Label>
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-slate-700 border-slate-600 text-white"
        />
      </div>
    );
  }

  if (type === TemplateParamType.OBJECT) {
    return (
      <div className="space-y-1">
        <Label className="text-slate-200">
          {name} <span className="text-xs text-slate-400">(object JSON)</span>
        </Label>
        <Textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder='{"key": "value"}'
          className="bg-slate-700 border-slate-600 text-white font-mono text-xs"
        />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Label className="text-slate-200">
        {name} <span className="text-xs text-slate-400">(string)</span>
      </Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-slate-700 border-slate-600 text-white"
      />
    </div>
  );
}
