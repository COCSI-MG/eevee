import { Template } from "@/app/interface/scheduler-api/template";
import { Check, Settings, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { SelectedTemplate } from "@/types/shared";
import { useMemo } from "react";

interface SelectedTemplatesProps {
  templates: Template[] | undefined;
  selectedTemplates: SelectedTemplate[];
  handleRemoveTemplate: (templateId: number) => void;
  onWeightChange: (templateId: number, weight: number | undefined) => void;
  weightError: string | null;
}

export default function SelectedTemplates({
  selectedTemplates,
  templates,
  handleRemoveTemplate,
  onWeightChange,
  weightError,
}: SelectedTemplatesProps) {
  const getTemplateName = (templateId: number) => {
    return templates?.find((t) => t.id === templateId)?.title || "Template";
  };

  const { filledCount, sum } = useMemo(() => {
    let filled = 0;
    let s = 0;
    for (const t of selectedTemplates) {
      if (t.weight !== undefined) {
        filled++;
        s += t.weight;
      }
    }
    return { filledCount: filled, sum: Math.round(s * 100) / 100 };
  }, [selectedTemplates]);

  const total = selectedTemplates.length;
  const allFilled = filledCount === total && total > 0;
  const showHint = !allFilled && filledCount > 0 && total > filledCount;

  return (
    <div className="space-y-4">
      <h4 className="text-foreground font-medium text-sm uppercase tracking-wide">
        Templates Selecionados
      </h4>

      {!selectedTemplates.length ? (
        <div className="bg-primary/10 border-2 border-dashed border-border rounded-lg p-8 text-center">
          <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">Nenhum template selecionado</p>
          <p className="text-sm text-muted-foreground">
            Clique no botão &quot;+&quot; para adicionar templates
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {selectedTemplates.map((selectedTemplate, index) => (
            <div
              key={index}
              className="bg-primary/10 border border-border rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <h5 className="text-foreground font-medium">
                    {getTemplateName(selectedTemplate.templateId)}
                  </h5>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      placeholder="%"
                      value={selectedTemplate.weight ?? ""}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "") {
                          onWeightChange(selectedTemplate.templateId, undefined);
                          return;
                        }
                        const num = parseFloat(raw);
                        if (!isNaN(num)) {
                          onWeightChange(selectedTemplate.templateId, num);
                        }
                      }}
                      className="w-20 h-8 text-sm tabular-nums text-right"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() =>
                      handleRemoveTemplate(selectedTemplate.templateId)
                    }
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-2">
                  {selectedTemplate.params?.length ?? 0} parâmetro(s)
                  configurado(s)
                </p>
                {selectedTemplate.params?.map((param) => {
                  const paramName = templates
                    ?.find((t) => t.id === selectedTemplate.templateId)
                    ?.templateParams.find(
                      (p) => p.id === param.templateParamId
                    )?.name;

                  return (
                    <div key={param.templateParamId} className="text-xs">
                      <span className="text-primary font-medium">
                        {paramName}:
                      </span>
                      <span className="text-foreground ml-2 truncate">
                        {param.value.length > 50
                          ? `${param.value.substring(0, 50)}...`
                          : param.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {total > 0 && (
            <div className="pt-2 border-t border-border space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Distribuição de peso</span>
                <span className={`text-sm font-medium tabular-nums ${
                  allFilled && sum !== 100
                    ? "text-destructive"
                    : filledCount > 0
                    ? "text-success"
                    : "text-muted-foreground"
                }`}>
                  Total: {sum.toFixed(2)}% / 100%
                </span>
              </div>

              {showHint && (
                <p className="text-xs text-muted-foreground">
                  Os templates sem peso serão distribuídos igualmente entre o percentual restante.
                </p>
              )}

              {weightError && (
                <p className="text-xs text-destructive">{weightError}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
