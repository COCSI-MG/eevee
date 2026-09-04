import { cn } from "@/lib/utils";
import { Plus, Code, X, Check, FileCode } from "lucide-react";
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
import { Template } from "@/app/interface/scheduler-api/template";
import { Badge } from "../ui/badge";
import React from "react";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import TemplatePreviewDialog from "./template-preview-dialog";
import SelectedTemplates from "./selected-templates";
import TemplateConfigDialog from "./template-config-dialog";
import { SelectedTemplate } from "@/types/shared";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { WorkerType } from "@/app/interface/scheduler-api/worker";
import { Tooltip } from "../ui/tooltip";
import QueryErrorState from "@/components/shared/query-error-state";

interface TemplateCardProps {
  selectedTemplates: SelectedTemplate[] | null;
  setSelectedTemplates: React.Dispatch<
    React.SetStateAction<SelectedTemplate[] | null>
  >;
  workerType: WorkerType;
  onWeightChange: (templateId: number, weight: number | undefined) => void;
  weightError: string | null;
}

interface State {
  previewTemplateDialog: string | null;
  selectedTemplates: SelectedTemplate[];
  configTemplateDialog: Template | null;
  paramsValues: Record<number, string>;
}

type Action =
  | { type: "OPEN_PREVIEW_DIALOG"; payload: string }
  | { type: "CLOSE_PREVIEW_DIALOG" }
  | {
    type: "ADD_SELECTED_TEMPLATE";
    payload: {
      templateId: number;
      params: { templateParamId: number; value: string }[];
    };
  }
  | { type: "REMOVE_SELECTED_TEMPLATE"; payload: number }
  | { type: "OPEN_CONFIG_DIALOG"; payload: Template }
  | { type: "CLOSE_CONFIG_DIALOG" }
  | { type: "SET_PARAM_VALUE"; payload: Record<number, string> };

function reducer(state: State, action: Action) {
  switch (action.type) {
    case "OPEN_PREVIEW_DIALOG":
      return { ...state, previewTemplateDialog: action.payload };
    case "CLOSE_PREVIEW_DIALOG":
      return { ...state, previewTemplateDialog: null };
    case "OPEN_CONFIG_DIALOG":
      return { ...state, configTemplateDialog: action.payload };
    case "CLOSE_CONFIG_DIALOG":
      return { ...state, configTemplateDialog: null, paramsValues: {} };
    case "SET_PARAM_VALUE":
      return {
        ...state,
        paramsValues: {
          ...state.paramsValues,
          ...action.payload,
        },
      };
    default:
      return state;
  }
}

export default function TemplateCard({
  selectedTemplates,
  setSelectedTemplates,
  workerType,
  onWeightChange,
  weightError,
}: TemplateCardProps) {
  const normalizedWorkerType = React.useMemo<WorkerType>(() => {
    if (
      typeof workerType === "string" &&
      Object.values(WorkerType).includes(workerType as WorkerType)
    ) {
      return workerType as WorkerType;
    }

    const maybeValue = (workerType as unknown as { value?: unknown })?.value;
    if (
      typeof maybeValue === "string" &&
      Object.values(WorkerType).includes(maybeValue as WorkerType)
    ) {
      return maybeValue as WorkerType;
    }

    return WorkerType.NODE_DEFAULT;
  }, [workerType]);

  const {
    data: templates,
    isSuccess: isSuccessTemplates,
    isFetching: isFetchingTemplates,
    isError: isTemplatesError,
    refetch: refetchTemplates,
  } = useTemplates(normalizedWorkerType);

  // why are we using reducer again?

  const visibleTemplates = React.useMemo(() => {
    const list = templates ?? [];
    return list.filter((t) => !t.workerType || t.workerType === normalizedWorkerType);
  }, [templates, normalizedWorkerType]);

  const [state, dispatch] = React.useReducer(reducer, {
    previewTemplateDialog: null,
    selectedTemplates: selectedTemplates || [],
    configTemplateDialog: null,
    paramsValues: {},
  });

  const isTemplateSelected = React.useMemo(
    () => (templateId: number) => {
      return selectedTemplates?.some(
        (template) => template.templateId === Number(templateId)
      );
    },
    [selectedTemplates]
  );

  const areAllParamsFilled = (template: Template) => {
    return template.templateParams.every((param) => {
      const value = state.paramsValues[param.id];
      return value && value.trim() !== "";
    });
  };

  const handleOpenConfigDialog = (template: Template) => {
    // Initialize parameter values
    const newParamsValues: Record<number, string> = {};
    template.templateParams.forEach((param) => {
      newParamsValues[param.id] = "";
    });

    dispatch({
      type: "SET_PARAM_VALUE",
      payload: newParamsValues,
    });

    dispatch({ type: "OPEN_CONFIG_DIALOG", payload: template });
  };

  const handleCloseConfigDialog = () => {
    dispatch({ type: "CLOSE_CONFIG_DIALOG" });
    dispatch({ type: "SET_PARAM_VALUE", payload: {} });
  };

  const handleConfirmTemplate = () => {
    const templateDialog = state.configTemplateDialog;
    if (!templateDialog) return;

    if (!areAllParamsFilled(templateDialog)) {
      toast({
        title: "Preencha todos os parâmetros",
        description:
          "Certifique-se de que todos os parâmetros estão preenchidos antes de adicionar o template.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    const params = templateDialog.templateParams.map((param) => ({
      templateParamId: param.id,
      value: state.paramsValues[param.id],
    }));

    setSelectedTemplates((prev) => [
      ...(prev || []),
      {
        templateId: templateDialog.id,
        name: templateDialog.title,
        params,
      },
    ]);

    handleCloseConfigDialog();

    toast({
      title: "Template adicionado",
      description: `Template "${templateDialog.title}" foi adicionado com sucesso.`,
      duration: 3000,
    });
  };

  const handleRemoveTemplate = (templateId: number) => {
    setSelectedTemplates((prev) =>
      (prev || []).filter((template) => template.templateId !== templateId)
    );
  };

  const handleSetParamsValues = (paramId: number, value: string) => {
    dispatch({
      type: "SET_PARAM_VALUE",
      payload: {
        [paramId]: value,
      },
    });
  };

  if (isFetchingTemplates) {
    return (
      <Card className="bg-card border-border flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="text-foreground">Carregando templates...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-primary/20 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isTemplatesError) {
    return (
      <QueryErrorState
        title="Não foi possível carregar os templates"
        description="Os templates desta atividade não puderam ser carregados. Tente novamente."
        onRetry={() => {
          void refetchTemplates();
        }}
        retryLabel="Tentar novamente"
        isRetrying={isFetchingTemplates}
      />
    );
  }

  return (
    <Card className="bg-card border-border flex flex-col max-h-[500px]">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="text-foreground flex items-center gap-2">
          <FileCode className="w-5 h-5" />
          Templates
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-y-auto flex-1">
        {isSuccessTemplates && visibleTemplates.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Code className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhum template encontrado
            </h3>
            <p className="text-sm mb-6">
              Clique em &quot;Adicionar&quot; para criar seu primeiro template
            </p>
            <Link href={`${Route.AdminTemplate}/new`}>
              <Button
                type="button"
                variant="outline"
                className="border-primary text-primary hover:bg-primary/20"
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
              <h4 className="text-foreground font-medium text-sm uppercase tracking-wide">
                Templates Disponíveis <Tooltip message="Template de teste usado para corrigir as provas, selecione e adicione seus parâmetros" />
              </h4>
              <ScrollArea className="h-[300px] space-y-3">
                {visibleTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={cn(
                      "group p-4 rounded-lg border transition-all cursor-pointer",
                      isTemplateSelected(template.id)
                        ? "border-success bg-success/10"
                        : "border-border bg-primary/10 hover:bg-primary/20 hover:border-border"
                    )}
                    onClick={() => {
                      if (!isTemplateSelected(template.id)) {
                        handleOpenConfigDialog(template);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h5 className="text-foreground font-medium truncate">
                            {template.title}
                          </h5>
                          {isTemplateSelected(template.id) && (
                            <Badge
                              variant="secondary"
                              className="bg-success/10 text-success border-success"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Selecionado
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-foreground mb-3 line-clamp-2">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            {template.templateParams.length} parâmetro(s)
                          </span>
                          {template.templateParams.slice(0, 3).map((param) => (
                            <Badge
                              key={param.id}
                              variant="outline"
                              className="text-xs border-border text-foreground"
                            >
                              {param.name}
                            </Badge>
                          ))}
                          {template.templateParams.length > 3 && (
                            <Badge
                              variant="outline"
                              className="text-xs border-border text-muted-foreground"
                            >
                              +{template.templateParams.length - 3} mais
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 ml-3">
                        {/* Preview Button */}
                        <TemplatePreviewDialog
                          template={
                            templates?.find(
                              (t) =>
                                t.id.toString() === state.previewTemplateDialog
                            ) || null
                          }
                          open={!!state.previewTemplateDialog}
                          onOpenChange={(open) =>
                            dispatch({
                              type: open
                                ? "OPEN_PREVIEW_DIALOG"
                                : "CLOSE_PREVIEW_DIALOG",
                              payload: open ? template.id.toString() : "",
                            })
                          }
                        />

                        {/* Add/Remove Button */}
                        {isTemplateSelected(template.id) ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveTemplate(template.id);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-success hover:text-success hover:bg-success/10"
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
              </ScrollArea>
            </div>

            {selectedTemplates && (
              <SelectedTemplates
                templates={templates || []}
                selectedTemplates={selectedTemplates}
                handleRemoveTemplate={handleRemoveTemplate}
                onWeightChange={onWeightChange}
                weightError={weightError}
              />
            )}

            <TemplateConfigDialog
              configTemplateDialog={state.configTemplateDialog}
              handleCloseConfigDialog={handleCloseConfigDialog}
              handleConfirmTemplate={handleConfirmTemplate}
              paramsValues={state.paramsValues}
              handleSetParamsValues={handleSetParamsValues}
              isAllParamsFilled={areAllParamsFilled}
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-shrink-0">
        <Badge className="bg-primary hover:bg-primary/90 mt-4">
          {(selectedTemplates || []).length} Template(s) Selecionado(s)
        </Badge>
      </CardFooter>
    </Card>
  );
}
