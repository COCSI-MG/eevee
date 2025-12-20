import { Template } from "@/app/interface/scheduler-api/template";
import { Check, Settings, X } from "lucide-react";
import { Button } from "../ui/button";
import { SelectedTemplate } from "@/types/shared";

interface SelectedTemplatesProps {
  templates: Template[] | undefined;
  selectedTemplates: SelectedTemplate[];
  handleRemoveTemplate: (templateId: number) => void;
}

export default function SelectedTemplates({
  selectedTemplates,
  templates,
  handleRemoveTemplate,
}: SelectedTemplatesProps) {
  const getTemplateName = (templateId: number) => {
    return templates?.find((t) => t.id === templateId)?.title || "Template";
  };

  return (
    <div className="space-y-4">
      <h4 className="text-white font-medium text-sm uppercase tracking-wide">
        Templates Selecionados
      </h4>

      {!selectedTemplates.length ? (
        <div className="bg-slate-700/30 border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
          <Settings className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400 mb-2">Nenhum template selecionado</p>
          <p className="text-sm text-slate-500">
            Clique no botão &quot;+&quot; para adicionar templates
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {selectedTemplates.map((selectedTemplate, index) => (
            <div
              key={index}
              className="bg-slate-700/30 border border-slate-600 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <h5 className="text-white font-medium">
                    {getTemplateName(selectedTemplate.templateId)}
                  </h5>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                  onClick={() =>
                    handleRemoveTemplate(selectedTemplate.templateId)
                  }
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-slate-400 mb-2">
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
                      <span className="text-blue-400 font-medium">
                        {paramName}:
                      </span>
                      <span className="text-slate-300 ml-2 truncate">
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
        </div>
      )}
    </div>
  );
}
