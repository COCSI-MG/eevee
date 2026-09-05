import type { AdminAttemptDetail } from "@/app/interface/scheduler-api/admin-attempt";

interface AdminAttemptDetailsProps {
  attempt: AdminAttemptDetail;
}

export function AdminAttemptDetails({ attempt }: AdminAttemptDetailsProps) {
  const fileEntries = Object.entries(attempt.receivedWork ?? {});

  return (
    <div className="space-y-4 py-2">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Relatório
        </p>
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-background p-3 text-xs text-foreground">
          {attempt.report || "Sem report para esta tentativa."}
        </pre>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Arquivos enviados
        </p>
        {fileEntries.length === 0 ? (
          <div className="rounded-md border border-border bg-background p-3 text-xs text-muted-foreground">
            Esta tentativa não possui arquivos armazenados.
          </div>
        ) : (
          <div className="space-y-3">
            {fileEntries.map(([filePath, content]) => (
              <div
                key={`${attempt.id}-${filePath}`}
                className="rounded-md border border-border bg-background"
              >
                <div className="border-b border-border px-3 py-2 text-xs font-medium text-foreground">
                  {filePath}
                </div>
                <pre className="max-h-56 overflow-auto whitespace-pre-wrap p-3 text-xs text-foreground">
                  {content}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
