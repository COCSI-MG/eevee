import { cn } from '@/lib/utils';
import {
  DialogHeader,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from '../ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, Eye, Code } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { useTemplates } from '@/hooks/use-templates';
import { Badge } from '../ui/badge';
import React, { useEffect, useState } from 'react';
import { Popover, PopoverContent } from '../ui/popover';
import { PopoverTrigger } from '@radix-ui/react-popover';
import { Label } from '../ui/label';
import { toast } from '@/hooks/use-toast';
import { Editor } from '@monaco-editor/react';

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
  setCanSubmit: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function TemplateCard({
  selectedTemplates,
  setSelectedTemplates,
  setCanSubmit,
}: TemplateCardProps) {
  const [activeTemplatePopover, setActiveTemplatePopover] = useState<
    number | null
  >(null);

  useEffect(() => {
    const allTemplatesFilled = selectedTemplates.every((template) =>
      template.params.every((param) => param.value.trim() !== '')
    );
    setCanSubmit(allTemplatesFilled);
  }, [selectedTemplates, setCanSubmit]);

  const {
    data: templates,
    isSuccess: isSuccessTemplates,
    isPending: isPendingTemplates,
  } = useTemplates();

  const handleAddTemplate = (templateId: number) => {
    const currTemplate = selectedTemplates.find(
      (template) => Number(template.templateId) === templateId
    );
    if (currTemplate) {
      console.log('Template já adicionado:', currTemplate);
      const isAllParamsFilled = currTemplate.params.every(
        (param) => param.value && param.value.trim() !== ''
      );
      if (!isAllParamsFilled) {
        toast({
          title: 'Erro',
          description:
            'Por favor, preencha todos os parâmetros do template antes de adicionar.',
          variant: 'destructive',
        });
        return;
      }
    }
  };

  const openPopover = (templateId: number) => {
    setActiveTemplatePopover(templateId);

    const template = templates?.find((t) => Number(t.id) === templateId);
    if (template) {
      const existingTemplate = selectedTemplates.find(
        (templ) => templ.templateId === templateId
      );
      if (!existingTemplate) {
        setSelectedTemplates([
          ...selectedTemplates,
          {
            templateId: templateId,
            params: template.templateParams.map((param) => ({
              templateParamId: Number(param.id),
              value: '',
            })),
          },
        ]);
      }
    }
  };

  const closePopover = () => {
    setActiveTemplatePopover(null);
    setSelectedTemplates((prev) =>
      prev.filter(
        (templ) =>
          !selectedTemplates.some((t) => t.templateId === templ.templateId)
      )
    );
    setCanSubmit(false);
  };

  const handleParamChange = (
    templateId: string,
    paramId: string,
    value: string | undefined
  ) => {
    if (!value) {
      return;
    }
    setSelectedTemplates((prev) => {
      const updatedTemplates = prev.map((templ) => {
        if (templ.templateId === Number(templateId)) {
          return {
            ...templ,
            params: templ.params.map((param) =>
              param.templateParamId === Number(paramId)
                ? { ...param, value }
                : param
            ),
          };
        }
        return templ;
      });
      return updatedTemplates;
    });
  };

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
        <CardTitle className="text-white flex items-center justify-between">
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
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-400 mb-4">
              Selecione o template que será usado para avaliar os alunos
            </p>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {(templates ?? []).map((template) => (
                  <div
                    key={template.id}
                    className={cn(
                      `p-3 rounded-lg border cursor-pointer transition-all relative`,
                      selectedTemplates.some(
                        (templ) =>
                          templ.templateId === Number(template.id) &&
                          templ.params.every(
                            (param) => param.value.trim() !== ''
                          )
                      )
                        ? 'bg-blue-500 bg-blue-500/10'
                        : 'bg-slate-600 bg-slate-700/10 hover:bg-slate-700'
                    )}
                  >
                    <Popover
                      open={activeTemplatePopover === Number(template.id)}
                      onOpenChange={(open) => {
                        if (open) {
                          openPopover(Number(template.id));
                        } else {
                          closePopover();
                        }
                      }}
                    >
                      <PopoverTrigger asChild>
                        <div
                          className="p-3 rounded-lg border border-slate-600 bg-slate-700/50 hover:bg-slate-700 transition-colors cursor-pointer"
                          onClick={() => openPopover(Number(template.id))}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-white">
                                  {template.title}
                                </h4>
                                {selectedTemplates.some(
                                  (templ) =>
                                    templ.templateId === Number(template.id) &&
                                    templ.params.every(
                                      (param) => param.value.trim() !== ''
                                    )
                                ) && (
                                  <Check className="w-4 h-4 text-blue-400" />
                                )}
                              </div>
                              <p className="text-sm text-slate-300">
                                {template.description}
                              </p>
                            </div>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant={'ghost'}
                                  size={'sm'}
                                  className="text-blue-400 hover:text-blue-300 hover:bg-slate-600 ml-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent
                                className="bg-slate-800 border-slate-700 max-w-4xl max-h-[80hv]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <DialogHeader>
                                  <DialogHeader>
                                    <DialogTitle>
                                      <Code className="w-5 h-5" />
                                      {template.title}
                                    </DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <p className="text-slate-300">
                                      {template.description}
                                    </p>
                                    <div className="bg-slate-900 border-slate-600 rounded-md p-4 max-h-[50vh] overflow-y-auto">
                                      <pre className="whitespace-pre-wrap break-words text-green-400">
                                        {template.templateContent}
                                      </pre>
                                    </div>
                                  </div>
                                </DialogHeader>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-[700px] bg-slate-800 border-slate-700"
                        align="end"
                      >
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-white mb-1">
                              {template.title}
                            </h4>
                            <p className="text-sm text-slate-400 mb-3">
                              {template.description}
                            </p>
                          </div>

                          <ScrollArea
                            className={cn(
                              template.templateParams.length > 3
                                ? 'h-[400px]'
                                : 'h-[200px]'
                            )}
                          >
                            <div className="space-y-4">
                              <h5 className="text-sm font-medium text-slate-300">
                                Parametros
                              </h5>
                              {template.templateParams.map((param) => (
                                <div
                                  key={param.id}
                                  className="space-y-2 bg-slate-700/50 p-3 rounded-md"
                                >
                                  <Label className="text-slate-200">
                                    Parametro {param.name}
                                  </Label>
                                  <Editor
                                    onChange={(value) =>
                                      handleParamChange(
                                        template.id,
                                        param.id,
                                        value
                                      )
                                    }
                                    theme="vs-dark"
                                    defaultLanguage="javascript"
                                    className="bg-slate-700 border-slate-600 text-white min-h-[200px] font-mono text-sm"
                                  />
                                </div>
                              ))}
                            </div>
                          </ScrollArea>

                          <div className="flex gap-2">
                            <Button
                              variant={'outline'}
                              size={'sm'}
                              className="border-slate-600 text-slate-200 hover:bg-slate-700"
                              onClick={closePopover}
                            >
                              Cancelar
                            </Button>
                            <Button
                              variant={'outline'}
                              size={'sm'}
                              className=" hover:bg-blue-700"
                              onClick={() =>
                                handleAddTemplate(Number(template.id))
                              }
                            >
                              Adicionar
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
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
