import { cn } from '@/lib/utils';
import {
  DialogHeader,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from '../ui/dialog';
import { ScrollArea } from '@radix-ui/react-scroll-area';
import { Plus, Check, Eye, Code } from 'lucide-react';
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
import { useRouter } from 'next/navigation';
import { Template } from '@/app/interface/scheduler-api/template';
import { Badge } from '../ui/badge';
import React from 'react';

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

  const onClickTemplate = (
    templateId: number,
    template: Template
  ) => {
    const isSelected = selectedTemplates.some(
      (templ) => templ.templateId === templateId
    );

    if (isSelected) {
      setSelectedTemplates(
        selectedTemplates.filter((templ) => templ.templateId !== templateId)
      );
      return;
    }

    setSelectedTemplates([
      ...selectedTemplates,
      {
        templateId: templateId,
        params: template.templateParams.map((param) => ({
          templateParamId: Number(param.id),
          value: param.name,
        })),
      },
    ]);
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
          <Button
            size={'sm'}
            variant={'outline'}
            onClick={() => push(`${Route.AdminTemplate}/new`)}
            className="hover:bg-slate-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
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
                      `p-3 rounded-lg border cursor-pointer transition-all`,
                      selectedTemplates.some(
                        (templ) => templ.templateId === Number(template.id)
                      )
                        ? 'bg-blue-500 bg-blue-500/10'
                        : 'bg-slate-600 bg-slate-700/10 hover:bg-slate-700'
                    )}
                    onClick={() =>
                      onClickTemplate(Number(template.id), template)
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-white">
                            {template.title}
                          </h4>
                          {selectedTemplates.some(
                            (templ) => templ.templateId === Number(template.id)
                          ) && <Check className="w-4 h-4 text-blue-400" />}
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
