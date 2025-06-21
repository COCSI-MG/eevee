import { cn } from "@/lib/utils";
import {
  DialogHeader,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "../ui/dialog";
import { Plus, Eye, Code, X, Check, Settings } from "lucide-react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Route } from "@/app/routes";
import { useTemplates } from "@/hooks/use-templates";
import { useRouter } from "next/navigation";
import { Template } from "@/app/interface/scheduler-api/template";
import { Badge } from "../ui/badge";
import React from "react";
import { toast } from "@/hooks/use-toast";
import { Label } from "../ui/label";
import { Editor } from "@monaco-editor/react";

interface TemplateCardProps {
  selectedTemplates: {
    templateId: number;
    params: {
      templateParamId: number;
      value: string;
    }[];
  }[];
  setSelectedTemplates: React.Dispatch<
    React.SetStateAction<
      {
        templateId: number;
        params: {
          templateParamId: number;
          value: string;
        }[];
      }[]
    >
  >;
}

export default function TemplateCard({
  selectedTemplates,
  setSelectedTemplates,
}: TemplateCardProps) {
  const { push } = useRouter();
  const {
    data: templates,
    isSuccess: isSuccessTemplates,
    isPending: isPendingTemplates,
  } = useTemplates();
  const [activeTemplateDialog, setActiveDialog] = React.useState<string | null>(
    null
  );
  const [paramsValues, setParamsValues] = React.useState<Record<number, string>>({});
  const [activeTemplatePopover, setActivePopover] = React.useState<Template | null>(null);

  const isAllParamsFilled = (templateId: string) => {
    const allParamsFilled = templates?.find(
      (template) => template.id === templateId
    )?.templateParams.every((param) => {
      const number = Number(param.id);
      const value = paramsValues[number];
      return value && value.trim() !== "";
    });
    return allParamsFilled ?? false;
  }

  const handleAddTemplate = (template: Template) => {
    if (!isAllParamsFilled(template.id)) {
      toast({
        title: "Preencha todos os parâmetros",
        description: "Certifique-se de que todos os parâmetros estão preenchidos antes de adicionar o template.",
        variant: "destructive",
        duration: 3000,
      })
      return;
    }


    setSelectedTemplates((prev) => [
      ...prev,
      {
        templateId: Number(template.id),
        params: template.templateParams.map((param) => {
          const newParam = paramsValues[Number(param.id)];
          return {
            templateParamId: Number(param.id),
            value: newParam || ""
          };
        })
      }
    ]);
    setActivePopover(null);
    setParamsValues({});
  }

  const isTemplateSelected = (id: string) => {
    return selectedTemplates.some(
      (template) => template.templateId === Number(id)
    );
  };

  const handleSelectedTemplate = (templateId: number, checked: boolean) => {
    const template = templates?.find((t) => Number(t.id) === templateId);
    if (!template) return;

    if (checked) {
      const newParamsValues: Record<number, string> = {};
      template.templateParams.forEach((param) => {
        newParamsValues[Number(param.id)] = ""; // Initialize with the param name
      });
      setParamsValues(newParamsValues);
      setActivePopover(template);
      console.log(activeTemplatePopover);
    } else {
      setActivePopover(null);
      setSelectedTemplates((prev) =>
        prev.filter((templ) => templ.templateId !== templateId)
      );
      setParamsValues({});
    }
  }

  if (isPendingTemplates) {
    return (
      <Card className="bg-slate-800 border-slate-700 max-h-[700px]">
        <CardHeader>
          <CardTitle className="text-white">Carregando templates...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700 max-h-[700px]">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          Templates
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isSuccessTemplates && templates.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            Nenhum template encontrado
            <p className="text-sm mt-2">
              Clique em &quot;Adicionar&quot; para criar um template
            </p>

            <Button
              size={"lg"}
              variant={"outline"}
              onClick={() => push(`${Route.AdminTemplate}/new`)}
              className="hover:bg-slate-600 mt-3">
              <Plus className="h-4 wr4 mr-2" />
              Adicionar
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-white font-medium mb-4">
                Templates disponiveis
              </h4>
              <div className="space-y-3">
                {(templates ?? [])?.map((template) => (
                  <div key={template.id} className="relative">
                    <div
                      className={cn(
                        'p-4 rounded-lg border cursor-pointer transition-all',
                        isTemplateSelected(template.id) ? "border-blue-500 bg-blue-500/10" : "border-slate-600 bg-slate-700/30 hover:bg-slate700/50"
                      )}
                      onClick={() => {
                        if (!isTemplateSelected(template.id.toString())) {
                          handleSelectedTemplate(Number(template.id), true);
                        }
                      }}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="text-white font-medium">
                              {template.title}
                            </h5>
                            {isTemplateSelected(template.id) && (
                              <div className="flex items-center gap-1">
                                <Check className="w-4 h-4 text-green-400" />
                                <span className="text-xs text-green-400">Configurado</span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-slate-300 mb-3">
                            {template.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">
                              {template.templateParams.length} parametro(s)
                            </span>
                            <div className="flex gap-1">
                              {template.templateParams.map((param) => (
                                <span
                                  key={param.id}
                                  className="text-xs bg-slate-600 text-slate-300 px-2 py-1 rounded"
                                >
                                  {param.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Dialog
                            open={activeTemplateDialog === template.id}
                            onOpenChange={(open) => {
                              if (open) {
                                setActiveDialog(template.id);
                              } else {
                                setActiveDialog(null);
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-400 hover:text-blue-300 hover:bg-slate-600"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-800 border-slate-700 max-w-4xl max-h-[80vh]">
                              <DialogHeader>
                                <DialogTitle className="text-white flex items-center gap-2">
                                  <Code className="w-5 h-5" />
                                  {template.title}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <p className="text-slate-300">
                                  {template.description}
                                </p>
                                <div className="bg-slate-900 border border-slate-600 rounded-md p-4 max-h-[50vh] overflow-y-auto">
                                  <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                                    {template.templateContent}
                                  </pre>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          {isTemplateSelected(template.id) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300 hover:bg-slate-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectedTemplate(Number(template.id), false);
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-white font-medium mb-4">
                Configuração dos parametros
              </h4>
              {selectedTemplates.length === 0 ? (
                <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-8 text-center">
                  <Code className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400 mb-2">
                    Nenhum template selecionado
                  </p>
                  <p className="text-sm text-slate-500">
                    Clique em um template à esquerda para começar
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedTemplates.map(
                    (selectedTemplate, index) => (
                      <div
                        key={index}
                        className="bg-slate-700/30 border border-slate-600 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="text-white font-medium flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-400" />
                          </h5>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-red-400"
                            onClick={() => {
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="space-y-4">
                          {selectedTemplate.params.map((param) => (
                            <div
                              key={param.templateParamId}
                              className="bg-slate-800 rounded-lg p-4"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
                                  Parametro
                                  {templates?.find((t) => t.id === selectedTemplate.templateId.toString())?.templateParams.find((tmplParam) => tmplParam.id === param.templateParamId.toString())?.name}
                                </span>
                              </div>
                              <div className="bg-slate-900 rounded p-3 max-h-[200px] overflow-y-auto">
                                <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                                  {param.value}
                                </pre>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              {activeTemplatePopover && (
                <div className="mt-4 bg-blue-900/20 border border-blue-600 rounded-lg p-4">
                  <h5 className="text-blue-400 font-medium mb-4 flex items-center gap-2">
                    <Settings className="w-4 h-4 mr-2" />
                    Configurando: {activeTemplatePopover.title}
                  </h5>

                  <div className="space-y-6">
                    {activeTemplatePopover.templateParams.map((param) => (
                      <div key={param.id} className="space-y-4">
                        <div className="flex items-center">
                          <Label className="text-blue-200 font-medium">{param.name}</Label>
                        </div>

                        <div className="relative">
                          <Editor
                            value={paramsValues[Number(param.id)] || ''}
                            onChange={(value) => {
                              if (!value) return;
                              setParamsValues(prev => ({
                                ...prev,
                                [param.id]: value
                              }))
                            }}
                            theme="vs-dark"
                            defaultLanguage="typescript"
                            height={"150px"}
                            className="bg-slate-800 border-blue-600 font-mono text-sm"
                          />
                        </div>
                        <div className="absolute top-2 right-2">
                          {paramsValues[Number(param.id)] && paramsValues[Number(param.id)].trim() !== "" ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <div className="w-4 h-4 border border-slate-500 rounded-full" />
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-600 text-blue-200 hover:bg-blue-800"
                        onClick={() => setActivePopover(null)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                          const template = activeTemplatePopover;
                          if (template) handleAddTemplate(template)
                        }}
                        disabled={!activeTemplatePopover || !isAllParamsFilled(activeTemplatePopover.id)}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Confirmar Template
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Badge className="bg-blue-600 text-white">
          {selectedTemplates.length} Template(s) Selecionado(s)
        </Badge>
      </CardFooter>
    </Card>
  );
}
