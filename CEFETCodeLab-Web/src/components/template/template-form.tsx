"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2Icon, Save } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CreateTemplateRequest as UpsertTemplateRequest } from "@/app/interface/scheduler-api/template";
import { TemplatesService } from "@/app/integration/scheduler-api/templates";
import { toast } from "@/hooks/use-toast";
import { useParams, useRouter } from "next/navigation";
import { WorkerDefaultValidationScriptMap } from "@/app/admin/assignments/constants";
import { WorkerType } from "@/app/interface/scheduler-api/worker";
import dynamic from "next/dynamic";
import { useFormik } from "formik";
import * as Yup from "yup";
import { AxiosError } from "axios";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

const upsertTemplateSchema = Yup.object().shape({
  title: Yup.string().required("O título é obrigatório"),
  description: Yup.string().required("A descrição é obrigatória"),
  templateContent: Yup.string().required(
    "O conteúdo do template é obrigatório"
  ),
  params: Yup.array()
    .of(Yup.string().required("O nome do parâmetro é obrigatório"))
    .min(1, "Pelo menos um parâmetro é obrigatório"),
});

export default function TemplateForm() {
  const { id } = useParams<{
    id: string;
  }>();
  const { back } = useRouter();

  const isNewTemplate = id === "new";

  const [paramsInput, setParamsInput] = useState("");

  const { mutate: upsertTemplate, status: mutationStatus } = useMutation({
    mutationKey: ["upsertTemplate", id],
    mutationFn: (data: UpsertTemplateRequest) => {
      if (data?.id) {
        return TemplatesService.update(data.id.toString(), data);
      }
      return TemplatesService.create(data);
    },
    onSuccess: () => {
      toast({
        title: "Template salvo com sucesso",
        description: "O template foi salvo com sucesso.",
      });
      back();
    },
    onError: (err: AxiosError) => {
      const res = err.response?.data as { message: string };
      toast({
        title: "Erro ao salvar template",
        description: res?.message || "Ocorreu um erro ao salvar o template.",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const formik = useFormik({
    initialValues: {
      id: isNewTemplate ? undefined : id,
      title: "",
      description: "",
      templateContent:
        WorkerDefaultValidationScriptMap[WorkerType.NODE_DEFAULT],
      params: [] as string[],
    },
    validationSchema: upsertTemplateSchema,
    onSubmit: (values) => {
      upsertTemplate(values);
    },
  });

  const { isFetching: isFetchingTemplate, isError: isTemplateError } = useQuery(
    {
      queryKey: ["currentTemplate", id],
      enabled: id !== "new",
      queryFn: async () => {
        const template = await TemplatesService.getTemplate(id);
        if (!template) {
          return;
        }

        const templateParamsInputAsArray = template.templateParams.map(
          (t) => t.name
        );

        formik.setValues({
          id: template.id,
          title: template.title,
          description: template.description,
          templateContent: template.templateContent,
          params: templateParamsInputAsArray,
        });

        setParamsInput(templateParamsInputAsArray.join(", "));

        return template;
      },
    }
  );

  const handleParamsBlur = (value: string) => {
    console.debug("Params input blur:", value);
    const paramsArray = value
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    formik.setFieldValue("params", paramsArray);
  };

  useEffect(() => {
    if (isTemplateError) {
      toast({
        title: "Erro ao buscar template",
        description: "Não foi possível carregar o template",
        variant: "destructive",
      });
    }
  }, [isTemplateError]);

  if (!isNewTemplate && isFetchingTemplate) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <form onSubmit={formik.handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Grid - Form Inputs */}
            <div className="space-y-6">
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
                      name="title"
                      value={formik.values.title}
                      onChange={formik.handleChange}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Ex: Algoritmo de Ordenação"
                    />
                    {formik.errors.title && (
                      <div className="text-red-500">{formik.errors.title}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-slate-200">
                      Descrição *
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formik.values.description}
                      onChange={formik.handleChange}
                      className="bg-slate-700 border-slate-600 text-white max-h-[120px]"
                      placeholder="Descreva o propósito e funcionamento deste template..."
                    />
                    {formik.errors.description && (
                      <div className="text-red-500">
                        {formik.errors.description}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="params" className="text-slate-200">
                      Parâmetros <br />
                      Use vírgula para separar os parâmetros Exemplo: param1,
                      param2, param3
                    </Label>
                    <Input
                      id="params"
                      value={paramsInput}
                      onChange={(e) => setParamsInput(e.target.value)}
                      onBlur={(e) => handleParamsBlur(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Ex: param1, param2, param3"
                    />
                    {formik.errors.params && (
                      <div className="text-red-500">{formik.errors.params}</div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-slate-600 text-slate-200 hover:bg-slate-700"
                      onClick={() => formik.resetForm()}
                    >
                      Limpar
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 hover:bg-slate-700"
                      variant={"outline"}
                      disabled={mutationStatus === "pending"}
                    >
                      {mutationStatus === "pending" ? (
                        <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Salvar Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">
                    Código do Template *
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-6">
                  <div style={{ height: "600px" }}>
                    <Editor
                      height="600px"
                      defaultLanguage="typescript"
                      value={formik.values.templateContent}
                      theme="vs-dark"
                      onChange={(value) =>
                        formik.setFieldValue("templateContent", value || "")
                      }
                      className="bg-slate-700 border-slate-600 text-white"
                      options={{
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        wordWrap: "on",
                        wrappingIndent: "indent",
                        fontSize: 14,
                        lineNumbers: "on",
                      }}
                    />
                  </div>
                  {formik.errors.templateContent && (
                    <div className="text-red-500">
                      {formik.errors.templateContent}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
