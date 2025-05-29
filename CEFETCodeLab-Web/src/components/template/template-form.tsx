'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CreateTemplateRequest } from '@/app/interface/scheduler-api/template';
import { TemplatesService } from '@/app/integration/scheduler-api/templates';
import { toast } from '@/hooks/use-toast';
import { useParams, useRouter } from 'next/navigation';
import { Editor } from '@monaco-editor/react';
import { WorkerDefaultValidationScriptMap } from '@/app/admin/assignments/constants';
import { WorkerType } from '@/app/interface/scheduler-api/worker';

export default function TemplateForm() {
  const { id } = useParams<{
    id: string;
  }>();
  const [formData, setFormData] = useState<CreateTemplateRequest>({
    title: '',
    description: '',
    templateContent: WorkerDefaultValidationScriptMap[WorkerType.NODE_DEFAULT],
    params: [],
  });
  const { back } = useRouter();

  const {
    data: templateData,
    isLoading: isTemplateLoading,
    isError: isTemplateError,
    error: templateError,
  } = useQuery({
    queryKey: ['currentTemplate', id],
    enabled: id !== 'new',
    queryFn: () => TemplatesService.getTemplate(id),
  });

  useEffect(() => {
    if (templateData && !isTemplateLoading && !isTemplateError) {
      setFormData({
        title: templateData.title,
        description: templateData.description,
        templateContent: templateData.templateContent,
        params: templateData.templateParams.map((param) => param.name) || [],
      });
    }
  }, [templateData, isTemplateLoading, isTemplateError]);

  const {
    mutate: upsertTemplate,
    data,
    isSuccess,
    isError,
    error,
  } = useMutation({
    mutationKey: ['upsertTemplate', id],
    mutationFn: (data: CreateTemplateRequest) => {
      if (data?.id) {
        // Update existing template logic here
        // For now, we assume this is a new template
        throw new Error('Updating templates is not implemented yet.');
      }
      return TemplatesService.create(data);
    },
  });

  useEffect(() => {
    if (isTemplateError && templateError) {
      toast({
        title: 'Erro ao buscar template',
        description: 'Não foi possível carregar o template',
        variant: 'destructive',
      });
    }
  }, [isTemplateError, templateError]);

  useEffect(() => {
    if (isError && error) {
      toast({
        title: 'Erro ao salvar template',
        description: 'Não foi possível salvar o template',
        variant: 'destructive',
      });
    }
    if (isSuccess) {
      toast({
        title: 'Template salvo com sucesso',
        description: 'O template foi salvo com sucesso.',
      });
      back();
    }
  }, [isError, error, isSuccess, data, back]);

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    if (!formData.title || !formData.description || !formData.templateContent) {
      toast({
        title: 'Erro ao salvar',
        description: 'Todos os campos são obrigatórios.',
        variant: 'destructive',
      });
      return;
    }
    upsertTemplate(formData);
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">
              Informações do Template
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-slate-200">
                Título *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Ex: Algoritmo de Ordenação"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-200">
                Descrição *
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange('description', e.target.value)
                }
                className="bg-slate-700 border-slate-600 text-white max-h-[100px]"
                placeholder="Descreva o propósito e funcionamento deste template..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateContent" className="text-slate-200">
                Código do Template *
              </Label>
              <Editor
                height="500px"
                defaultLanguage="typescript"
                value={formData.templateContent}
                theme="vs-dark"
                onChange={(value) =>
                  handleInputChange('templateContent', value || '')
                }
                className="bg-slate-700 border-slate-600 text-white"
                options={
                  {
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    wrappingIndent: 'indent',
                    fontSize: 14,
                    lineNumbers: 'on',
                  }
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="params" className="text-slate-200">
                Parâmetros (opcional) <br/>
                Use vírgula para separar os parâmetros
                Exemplo: param1, param2, param3
              </Label>
              <Input
                id="params"
                value={formData.params.join(',')}
                onChange={(e) => {
                  const params = e.target.value.split(',');
                  handleInputChange('params', params);
                }}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Ex: param1, param2, param3"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="border-slate-600 text-slate-200 hover:bg-slate-700"
                onClick={() => {
                  setFormData({
                    title: '',
                    description: '',
                    templateContent: '',
                    params: [],
                  });
                }}
              >
                Limpar
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 hover:bg-slate-700"
                variant={'outline'}
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar Template
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
