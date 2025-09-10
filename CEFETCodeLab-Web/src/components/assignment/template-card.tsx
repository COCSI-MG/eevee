import { cn } from "@/lib/utils";
import {
  DialogHeader,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Plus, Eye, Code, X, Check, Settings, FileCode } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Route } from '@/app/routes';
import { useTemplates } from '@/hooks/use-templates';
import { Template } from '@/app/interface/scheduler-api/template';
import { Badge } from '../ui/badge';
import React from 'react';
import { toast } from '@/hooks/use-toast';
import { Label } from '../ui/label';
import { Editor } from '@monaco-editor/react';
import Link from 'next/link';
import { Separator } from '../ui/separator';

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
  const {
    data: templates,
    isSuccess: isSuccessTemplates,
    isPending: isPendingTemplates,
  } = useTemplates();

  // Dialog states
  const [previewTemplateDialog, setPreviewTemplateDialog] = React.useState<
    string | null
  >(null);
  const [configTemplateDialog, setConfigTemplateDialog] =
    React.useState<Template | null>(null);

  // Parameter values for the template being configured
  const [paramsValues, setParamsValues] = React.useState<
    Record<number, string>
  >({});

  const isTemplateSelected = (templateId: string) => {
    return selectedTemplates.some(
      (template) => template.templateId === Number(templateId)
    );
  };

  const isAllParamsFilled = (template: Template) => {
    return template.templateParams.every((param) => {
      const value = paramsValues[Number(param.id)];
      return value && value.trim() !== '';
    });
  };

  const handleOpenConfigDialog = (template: Template) => {
    // Initialize parameter values
    const newParamsValues: Record<number, string> = {};
    template.templateParams.forEach((param) => {
      newParamsValues[Number(param.id)] = '';
    });
    setParamsValues(newParamsValues);
    setConfigTemplateDialog(template);
  };

  const handleCloseConfigDialog = () => {
    setConfigTemplateDialog(null);
    setParamsValues({});
  };

  const handleConfirmTemplate = () => {
    if (!configTemplateDialog) return;

    if (!isAllParamsFilled(configTemplateDialog)) {
      toast({
        title: 'Preencha todos os parâmetros',
        description:
          'Certifique-se de que todos os parâmetros estão preenchidos antes de adicionar o template.',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    setSelectedTemplates((prev) => [
      ...prev,
      {
        templateId: Number(configTemplateDialog.id),
        params: configTemplateDialog.templateParams.map((param) => ({
          templateParamId: Number(param.id),
          value: paramsValues[Number(param.id)] || '',
        })),
      },
    ]);

    handleCloseConfigDialog();
    toast({
      title: 'Template adicionado',
      description: `Template "${configTemplateDialog.title}" foi adicionado com sucesso.`,
      duration: 3000,
    });
  };

  const handleRemoveTemplate = (templateId: number) => {
    setSelectedTemplates((prev) =>
      prev.filter((template) => template.templateId !== templateId)
    );
  };

  const getTemplateName = (templateId: number) => {
    return (
      templates?.find((t) => Number(t.id) === templateId)?.title || 'Template'
    );
  };

  if (isPendingTemplates) {
    return (
      <Card className="bg-slate-800 border-slate-700 min-h-[600px] max-h-[calc(100vh-8rem)] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="text-white">Carregando templates...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-700 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-slate-800 border-slate-700 min-h-[600px] max-h-[calc(100vh-8rem)] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="text-white flex items-center gap-2">
            <FileCode className="w-5 h-5" />
            Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-y-auto flex-1">
          {isSuccessTemplates && templates.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Code className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">
                Nenhum template encontrado
              </h3>
              <p className="text-sm mb-6">
                Clique em &quot;Adicionar&quot; para criar seu primeiro template
              </p>
              <Link href={`${Route.AdminTemplate}/new`}>
                <Button
                  variant="outline"
                  className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Template
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
              {/* Available Templates */}
              <div className="space-y-4">
                <h4 className="text-white font-medium text-sm uppercase tracking-wide">
                  Templates Disponíveis
                </h4>
                <div className="space-y-3">
                  {(templates ?? []).map((template) => (
                    <div
                      key={template.id}
                      className={cn(
                        'group p-4 rounded-lg border transition-all cursor-pointer',
                        isTemplateSelected(template.id)
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-slate-600 bg-slate-700/30 hover:bg-slate-700/50 hover:border-slate-500'
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="text-white font-medium truncate">
                              {template.title}
                            </h5>
                            {isTemplateSelected(template.id) && (
                              <Badge
                                variant="secondary"
                                className="bg-green-500/20 text-green-400 border-green-500/30"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Selecionado
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-300 mb-3 line-clamp-2">
                            {template.description}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-slate-400">
                              {template.templateParams.length} parâmetro(s)
                            </span>
                            {template.templateParams
                              .slice(0, 3)
                              .map((param) => (
                                <Badge
                                  key={param.id}
                                  variant="outline"
                                  className="text-xs border-slate-600 text-slate-300"
                                >
                                  {param.name}
                                </Badge>
                              ))}
                            {template.templateParams.length > 3 && (
                              <Badge
                                variant="outline"
                                className="text-xs border-slate-600 text-slate-400"
                              >
                                +{template.templateParams.length - 3} mais
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 ml-3">
                          {/* Preview Button */}
                          <Dialog
                            open={previewTemplateDialog === template.id}
                            onOpenChange={(open) => {
                              setPreviewTemplateDialog(
                                open ? template.id : null
                              );
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-slate-400 hover:text-blue-400 hover:bg-slate-600"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-800 border-slate-700 w-[90vw] max-w-3xl max-h-[80vh] overflow-y-auto mx-4">
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
                                <Separator className="bg-slate-600" />
                                <div>
                                  <h4 className="text-sm font-medium text-slate-300 mb-2">
                                    Conteúdo do Template
                                  </h4>
                                  <div className="bg-slate-900 border border-slate-600 rounded-md overflow-hidden">
                                    <Editor
                                      value={template.templateContent}
                                      language="typescript"
                                      theme="vs-dark"
                                      height="300px"
                                      className="sm:h-[400px]"
                                      options={{
                                        readOnly: true,
                                        minimap: { enabled: false },
                                        scrollBeyondLastLine: false,
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          {/* Add/Remove Button */}
                          {isTemplateSelected(template.id) ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              type="button"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveTemplate(Number(template.id));
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenConfigDialog(template);
                              }}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Templates */}
              <div className="space-y-4">
                <h4 className="text-white font-medium text-sm uppercase tracking-wide">
                  Templates Selecionados
                </h4>
                {selectedTemplates.length === 0 ? (
                  <div className="bg-slate-700/30 border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
                    <Settings className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400 mb-2">
                      Nenhum template selecionado
                    </p>
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
                            {selectedTemplate.params.length} parâmetro(s)
                            configurado(s)
                          </p>
                          {selectedTemplate.params.map((param) => {
                            const paramName = templates
                              ?.find(
                                (t) =>
                                  t.id ===
                                  selectedTemplate.templateId.toString()
                              )
                              ?.templateParams.find(
                                (p) => p.id === param.templateParamId.toString()
                              )?.name;

                            return (
                              <div
                                key={param.templateParamId}
                                className="text-xs"
                              >
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
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-shrink-0">
          <Badge className="bg-blue-600 hover:bg-blue-700">
            {selectedTemplates.length} Template(s) Selecionado(s)
          </Badge>
        </CardFooter>
      </Card>

      {/* Template Configuration Dialog */}
      <Dialog
        open={!!configTemplateDialog}
        onOpenChange={handleCloseConfigDialog}
      >
        <DialogContent className="bg-slate-800 border-slate-700 max-w-4xl max-h-[85vh] overflow-hidden flex flex-col mx-4">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configurar Template: {configTemplateDialog?.title}
            </DialogTitle>
          </DialogHeader>

          {configTemplateDialog && (
            <div className="flex-1 overflow-y-auto px-1">
              <div className="space-y-6 pb-6">
                <p className="text-slate-300">
                  {configTemplateDialog.description}
                </p>
                <Separator className="bg-slate-600" />

                <div className="space-y-6">
                  <h4 className="text-white font-medium">
                    Parâmetros do Template
                  </h4>
                  {configTemplateDialog.templateParams.map((param) => (
                    <div key={param.id} className="space-y-3">
                      <Label className="text-blue-300 font-medium text-sm">
                        {param.name}
                        <span className="text-red-400 ml-1">*</span>
                      </Label>
                      <div className="relative">
                        <div className="border border-slate-600 rounded-md overflow-hidden">
                          <Editor
                            value={paramsValues[Number(param.id)] || ''}
                            onChange={(value) => {
                              setParamsValues((prev) => ({
                                ...prev,
                                [param.id]: value || '',
                              }));
                            }}
                            theme="vs-dark"
                            defaultLanguage="typescript"
                            height="100px"
                            className="sm:h-[120px] lg:h-[140px]"
                            options={{
                              minimap: { enabled: false },
                              scrollBeyondLastLine: false,
                              fontSize: 12,
                              lineHeight: 16,
                              wordWrap: 'on',
                            }}
                          />
                        </div>
                        <div className="absolute top-2 right-2">
                          {paramsValues[Number(param.id)]?.trim() ? (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                              <Check className="w-3 h-3" />
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-slate-500 text-slate-400 text-xs"
                            >
                              Vazio
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleCloseConfigDialog}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmTemplate}
              disabled={
                !configTemplateDialog ||
                !isAllParamsFilled(configTemplateDialog)
              }
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <Check className="w-4 h-4 mr-2" />
              Confirmar Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
