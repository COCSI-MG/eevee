"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FlaskConical, Loader2Icon, Save } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CreateTemplateRequest as UpsertTemplateRequest,
  TemplateParamType,
} from "@/app/interface/scheduler-api/template";
import { TemplatesService } from "@/app/integration/scheduler-api/templates";
import { toast } from "@/hooks/use-toast";
import { useParams, useRouter } from "next/navigation";
import { WorkerType } from "@/app/interface/scheduler-api/worker";
import dynamic from "next/dynamic";
import { useFormik } from "formik";
import * as Yup from "yup";
import { AxiosError } from "axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ExpandableDialog,
  ExpandableTrigger,
  useExpandable,
} from "@/components/ui/expandable";
import { WorkerDefaultTemplateContentMap } from "@/app/admin/assignments/constants";
import {
  TEMPLATE_FORM_TEXT,
  TEMPLATE_FORM_TOAST_MESSAGES,
  TEMPLATE_FORM_VALIDATION_MESSAGES,
  TemplateParamTypeLabelMap,
  WorkerTypeLabelMap,
} from "@/app/admin/templates/constants";
import { Tooltip } from "../ui/tooltip";
import { TemplateTestDialog } from "./template-test-dialog";
import QueryErrorState from "@/components/shared/query-error-state";
import { getWorkerLanguageConfig } from "@/lib/monaco/worker-language";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

const upsertTemplateSchema = Yup.object().shape({
  title: Yup.string()
    .trim()
    .required(TEMPLATE_FORM_VALIDATION_MESSAGES.titleRequired),
  description: Yup.string()
    .trim()
    .required(TEMPLATE_FORM_VALIDATION_MESSAGES.descriptionRequired),
  workerType: Yup.string().required(
    TEMPLATE_FORM_VALIDATION_MESSAGES.workerTypeRequired,
  ),
  content: Yup.string().required(
    TEMPLATE_FORM_VALIDATION_MESSAGES.templateContentRequired,
  ),
  params: Yup.array().of(Yup.string()).optional(),
  dependencies: Yup.array()
    .of(
      Yup.string().required(
        TEMPLATE_FORM_VALIDATION_MESSAGES.dependencyNameRequired,
      ),
    )
    .notRequired(),
});

const parseParamsInput = (value: string) =>
  value
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

const parseDependenciesInput = (value: string) =>
  value
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

export default function TemplateForm() {
  const { id } = useParams<{
    id: string;
  }>();
  const { back } = useRouter();

  const isNewTemplate = id === "new";

  const [paramsInput, setParamsInput] = useState("");
  const [paramTypesByName, setParamTypesByName] = useState<
    Record<string, TemplateParamType>
  >({});
  const [dependenciesInput, setDependenciesInput] = useState("");
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const codeExpandable = useExpandable();
  const descriptionExpandable = useExpandable();

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
        title: TEMPLATE_FORM_TOAST_MESSAGES.saveSuccessTitle,
        description: TEMPLATE_FORM_TOAST_MESSAGES.saveSuccessDescription,
      });
      back();
    },
    onError: (err: AxiosError) => {
      const res = err.response?.data as { message: string };
      toast({
        title: TEMPLATE_FORM_TOAST_MESSAGES.saveErrorTitle,
        description:
          res?.message ||
          TEMPLATE_FORM_TOAST_MESSAGES.saveErrorFallbackDescription,
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const formik = useFormik({
    initialValues: {
      id: isNewTemplate ? undefined : Number(id),
      title: "",
      description: "",
      workerType: WorkerType.NODE_DEFAULT,
      content: WorkerDefaultTemplateContentMap[WorkerType.NODE_DEFAULT],
      params: [] as string[],
      dependencies: [] as string[],
    },
    validationSchema: upsertTemplateSchema,
    onSubmit: (values) => {
      const params = values.params?.length
        ? values.params
        : parseParamsInput(paramsInput);

      const dependencies = values.dependencies?.length
        ? values.dependencies
        : parseDependenciesInput(dependenciesInput);

      const typedParams = params.map((name) => ({
        name,
        type: paramTypesByName[name] ?? TemplateParamType.STRING,
      }));

      upsertTemplate({
        ...values,
        params,
        typedParams,
        dependencies,
      });
    },
  });

  const {
    isFetching: isFetchingTemplate,
    isError: isTemplateError,
    refetch: refetchTemplate,
  } = useQuery({
    queryKey: ["currentTemplate", id],
    enabled: id !== "new",
    queryFn: async () => {
      const template = await TemplatesService.getTemplate(id);
      if (!template) {
        throw new Error("Não foi possível carregar o template.");
      }

      const templateParamsInputAsArray = template.templateParams.map(
        (t) => t.name,
      );

      const typesMap: Record<string, TemplateParamType> = {};
      template.templateParams.forEach((p) => {
        typesMap[p.name] = p.type ?? TemplateParamType.STRING;
      });
      setParamTypesByName(typesMap);

      formik.setValues({
        id: template.id,
        title: template.title,
        description: template.description,
        workerType: template.workerType ?? WorkerType.NODE_DEFAULT,
        content: template.content,
        params: templateParamsInputAsArray,
        dependencies: template.dependencies ?? [],
      });

      setParamsInput(templateParamsInputAsArray.join(", "));
      setDependenciesInput((template.dependencies ?? []).join(", "));

      return template;
    },
  });

  // Keep default template content in sync with workerType while the user hasn't edited it.
  const [lastWorkerTypeForDefault, setLastWorkerTypeForDefault] =
    useState<WorkerType>(WorkerType.NODE_DEFAULT);

  useEffect(() => {
    if (!isNewTemplate) return;

    const currentWorkerType = formik.values.workerType as WorkerType;
    const previousDefault =
      WorkerDefaultTemplateContentMap[lastWorkerTypeForDefault] ??
      WorkerDefaultTemplateContentMap[WorkerType.NODE_DEFAULT];
    const nextDefault =
      WorkerDefaultTemplateContentMap[currentWorkerType] ??
      WorkerDefaultTemplateContentMap[WorkerType.NODE_DEFAULT];

    if (formik.values.content === previousDefault) {
      formik.setFieldValue("content", nextDefault);
    }

    setLastWorkerTypeForDefault(currentWorkerType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.workerType, isNewTemplate]);

  const editorLanguage = getWorkerLanguageConfig(
    formik.values.workerType,
  ).editorLanguage;

  const handleParamsBlur = (value: string) => {
    const paramsArray = parseParamsInput(value);
    formik.setFieldValue("params", paramsArray);

    setParamTypesByName((prev) => {
      const next: Record<string, TemplateParamType> = {};
      for (const name of paramsArray) {
        next[name] = prev[name] ?? TemplateParamType.STRING;
      }
      return next;
    });
  };

  const handleParamsChange = (value: string) => {
    setParamsInput(value);
    const paramsArray = parseParamsInput(value);
    formik.setFieldValue("params", paramsArray, false);

    setParamTypesByName((prev) => {
      const next: Record<string, TemplateParamType> = {};
      for (const name of paramsArray) {
        next[name] = prev[name] ?? TemplateParamType.STRING;
      }
      return next;
    });
  };

  const handleDependenciesBlur = (value: string) => {
    const dependenciesArray = parseDependenciesInput(value);
    formik.setFieldValue("dependencies", dependenciesArray);
  };

  const handleDependenciesChange = (value: string) => {
    setDependenciesInput(value);
    const dependenciesArray = parseDependenciesInput(value);
    formik.setFieldValue("dependencies", dependenciesArray, false);
  };

  const handleParamTypeChange = (name: string, type: TemplateParamType) => {
    setParamTypesByName((prev) => ({
      ...prev,
      [name]: type,
    }));
  };

  if (!isNewTemplate && isFetchingTemplate) {
    return <div className="p-6">{TEMPLATE_FORM_TEXT.loading}</div>;
  }

  if (!isNewTemplate && isTemplateError) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <QueryErrorState
            title={TEMPLATE_FORM_TOAST_MESSAGES.fetchErrorTitle}
            description={TEMPLATE_FORM_TOAST_MESSAGES.fetchErrorDescription}
            onRetry={() => {
              void refetchTemplate();
            }}
            retryLabel="Tentar novamente"
            isRetrying={isFetchingTemplate}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <form onSubmit={formik.handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">
                    {TEMPLATE_FORM_TEXT.infoCardTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-slate-200">
                      {TEMPLATE_FORM_TEXT.titleLabel}
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      value={formik.values.title}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder={TEMPLATE_FORM_TEXT.titlePlaceholder}
                    />
                    {(formik.touched.title || formik.submitCount > 0) &&
                      formik.errors.title && (
                        <div className="text-red-500">
                          {formik.errors.title}
                        </div>
                      )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="description" className="text-slate-200">
                        {TEMPLATE_FORM_TEXT.descriptionLabel}
                      </Label>
                      <ExpandableTrigger
                        onClick={descriptionExpandable.open}
                        label="Expandir"
                      />
                    </div>
                    <Textarea
                      id="description"
                      name="description"
                      value={formik.values.description}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="bg-slate-700 border-slate-600 text-white max-h-[120px]"
                      placeholder={TEMPLATE_FORM_TEXT.descriptionPlaceholder}
                    />
                    {(formik.touched.description || formik.submitCount > 0) &&
                      formik.errors.description && (
                        <div className="text-red-500">
                          {formik.errors.description}
                        </div>
                      )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="workerType" className="text-slate-200">
                      {TEMPLATE_FORM_TEXT.workerTypeLabel}{" "}
                      <Tooltip message="Escolha o tipo de ambiente de execução que será utilizado no template" />
                    </Label>
                    <Select
                      value={formik.values.workerType as string}
                      onValueChange={(value) =>
                        formik.setFieldValue("workerType", value)
                      }
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue
                          placeholder={TEMPLATE_FORM_TEXT.workerTypePlaceholder}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(WorkerType).map((t) => (
                          <SelectItem key={t} value={t}>
                            {WorkerTypeLabelMap[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {(formik.touched.workerType || formik.submitCount > 0) &&
                      formik.errors.workerType && (
                        <div className="text-red-500">
                          {formik.errors.workerType as string}
                        </div>
                      )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="params" className="text-slate-200">
                      {TEMPLATE_FORM_TEXT.paramsLabel} <br />
                      {TEMPLATE_FORM_TEXT.paramsHelper}{" "}
                      <Tooltip message="Parâmetros que serão passados para o template" />
                    </Label>
                    <Input
                      id="params"
                      value={paramsInput}
                      onChange={(e) => handleParamsChange(e.target.value)}
                      onBlur={(e) => handleParamsBlur(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder={TEMPLATE_FORM_TEXT.paramsPlaceholder}
                    />
                    {(formik.touched.params || formik.submitCount > 0) &&
                      formik.errors.params && (
                        <div className="text-red-500">
                          {formik.errors.params}
                        </div>
                      )}
                  </div>

                  {!!formik.values.params.length && (
                    <div className="space-y-3">
                      <Label className="text-slate-200">
                        {TEMPLATE_FORM_TEXT.paramTypesTitle}
                      </Label>

                      <div className="space-y-2">
                        {formik.values.params.map((name) => (
                          <div key={name} className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <span className="text-slate-200 text-sm truncate block">
                                {name}
                              </span>
                              <span className="text-slate-400 text-xs">
                                {TEMPLATE_FORM_TEXT.paramTypesHelp}
                              </span>
                            </div>

                            <div className="w-[180px]">
                              <Select
                                value={
                                  (paramTypesByName[name] ??
                                    TemplateParamType.STRING) as string
                                }
                                onValueChange={(value) =>
                                  handleParamTypeChange(
                                    name,
                                    value as TemplateParamType,
                                  )
                                }
                              >
                                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                  <SelectValue
                                    placeholder={
                                      TEMPLATE_FORM_TEXT.paramTypePlaceholder
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.values(TemplateParamType).map((t) => (
                                    <SelectItem key={t} value={t}>
                                      {TemplateParamTypeLabelMap[t]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="dependencies" className="text-slate-200">
                      {TEMPLATE_FORM_TEXT.dependenciesLabel} <br />
                      {TEMPLATE_FORM_TEXT.dependenciesHelper}
                    </Label>
                    <Input
                      id="dependencies"
                      value={dependenciesInput}
                      onChange={(e) => handleDependenciesChange(e.target.value)}
                      onBlur={(e) => handleDependenciesBlur(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder={TEMPLATE_FORM_TEXT.dependenciesPlaceholder}
                    />
                    {formik.errors.dependencies && (
                      <div className="text-red-500">
                        {formik.errors.dependencies}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-slate-600 text-slate-200 hover:bg-slate-700"
                      onClick={() => {
                        formik.resetForm();
                        setParamsInput("");
                        setDependenciesInput("");
                        setParamTypesByName({});
                      }}
                    >
                      {TEMPLATE_FORM_TEXT.clearButton}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-slate-600 text-slate-200 hover:bg-slate-700"
                      onClick={() => setTestDialogOpen(true)}
                      title="Testar o conteúdo do template contra uma aplicação de exemplo em um pod efêmero. Nada é persistido."
                    >
                      <FlaskConical className="w-4 h-4 mr-2" />
                      Testar
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
                      {TEMPLATE_FORM_TEXT.saveButton}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-white">
                    {TEMPLATE_FORM_TEXT.codeCardTitle}
                  </CardTitle>
                  <ExpandableTrigger
                    onClick={codeExpandable.open}
                    label={TEMPLATE_FORM_TEXT.codeExpandButton}
                  />
                </CardHeader>
                <CardContent className="pb-6">
                  <div style={{ height: "600px" }}>
                    <Editor
                      height="600px"
                      defaultLanguage={editorLanguage}
                      value={formik.values.content}
                      onChange={(value) =>
                        formik.setFieldValue("content", value || "")
                      }
                      theme="vs-dark"
                      className="bg-slate-700 border-slate-600 text-white"
                      options={{
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        wordWrap: "on",
                        wrappingIndent: "indent",
                        fontSize: 14,
                        lineNumbers: "on",
                        quickSuggestions: false,
                        suggest: {
                          showWords: false,
                          showSnippets: false,
                        },
                        "semanticHighlighting.enabled": false,
                      }}
                      beforeMount={(monaco) => {
                        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions(
                          {
                            noSemanticValidation: true,
                            noSyntaxValidation: true,
                            noSuggestionDiagnostics: true,
                          },
                        );
                        monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions(
                          {
                            noSemanticValidation: true,
                            noSyntaxValidation: true,
                            noSuggestionDiagnostics: true,
                          },
                        );
                      }}
                    />
                  </div>
                  {(formik.touched.content || formik.submitCount > 0) &&
                    formik.errors.content && (
                      <div className="text-red-500">
                        {formik.errors.content}
                      </div>
                    )}
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>

      <TemplateTestDialog
        open={testDialogOpen}
        onOpenChange={setTestDialogOpen}
        workerType={formik.values.workerType as WorkerType}
        templateContent={formik.values.content}
        paramNames={formik.values.params}
        paramTypesByName={paramTypesByName}
        dependencies={formik.values.dependencies}
      />

      <ExpandableDialog
        open={descriptionExpandable.isOpen}
        onOpenChange={descriptionExpandable.setIsOpen}
        title={TEMPLATE_FORM_TEXT.descriptionLabel}
        minimizeLabel="Minimizar"
        contentClassName="flex flex-col"
      >
        <Textarea
          id="expanded-description"
          name="description"
          autoFocus
          value={formik.values.description}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className="flex-1 w-full bg-slate-700 border-slate-600 text-white resize-none"
          placeholder={TEMPLATE_FORM_TEXT.descriptionPlaceholder}
        />
        {(formik.touched.description || formik.submitCount > 0) &&
          formik.errors.description && (
            <div className="text-red-500 mt-2">
              {formik.errors.description}
            </div>
          )}
      </ExpandableDialog>

      <ExpandableDialog
        open={codeExpandable.isOpen}
        onOpenChange={codeExpandable.setIsOpen}
        title={TEMPLATE_FORM_TEXT.codeCardTitle}
        minimizeLabel="Minimizar"
        contentClassName="flex flex-col"
      >
        <Editor
          height="100%"
          defaultLanguage={editorLanguage}
          value={formik.values.content}
          onChange={(value) => formik.setFieldValue("content", value || "")}
          theme="vs-dark"
          className="flex-1 min-h-0 bg-slate-700 border-slate-600 text-white"
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            wrappingIndent: "indent",
            fontSize: 14,
            lineNumbers: "on",
            quickSuggestions: false,
            suggest: {
              showWords: false,
              showSnippets: false,
            },
            "semanticHighlighting.enabled": false,
          }}
          beforeMount={(monaco) => {
            const diagnosticsOptions = {
              noSemanticValidation: true,
              noSyntaxValidation: true,
              noSuggestionDiagnostics: true,
            };

            monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions(diagnosticsOptions);
            monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions(diagnosticsOptions);
          }}
        />
        {(formik.touched.content || formik.submitCount > 0) &&
          formik.errors.content && (
            <div className="text-red-500 mt-2">{formik.errors.content}</div>
          )}
      </ExpandableDialog>
    </div>
  );
}
