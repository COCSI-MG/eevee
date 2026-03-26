import { TemplateParamType } from "@/app/interface/scheduler-api/template";
import { WorkerType } from "@/app/interface/scheduler-api/worker";

export const TEMPLATE_FORM_VALIDATION_TITLE_REQUIRED = "O título é obrigatório";
export const TEMPLATE_FORM_VALIDATION_DESCRIPTION_REQUIRED =
  "A descrição é obrigatória";
export const TEMPLATE_FORM_VALIDATION_WORKER_TYPE_REQUIRED =
  "O worker type é obrigatório";
export const TEMPLATE_FORM_VALIDATION_TEMPLATE_CONTENT_REQUIRED =
  "O conteúdo do template é obrigatório";
export const TEMPLATE_FORM_VALIDATION_PARAM_NAME_REQUIRED =
  "O nome do parâmetro é obrigatório";
export const TEMPLATE_FORM_VALIDATION_DEPENDENCY_NAME_REQUIRED =
  "O nome da dependência é obrigatório";

export const TEMPLATE_FORM_VALIDATION_MESSAGES = {
  titleRequired: TEMPLATE_FORM_VALIDATION_TITLE_REQUIRED,
  descriptionRequired: TEMPLATE_FORM_VALIDATION_DESCRIPTION_REQUIRED,
  workerTypeRequired: TEMPLATE_FORM_VALIDATION_WORKER_TYPE_REQUIRED,
  templateContentRequired: TEMPLATE_FORM_VALIDATION_TEMPLATE_CONTENT_REQUIRED,
  paramNameRequired: TEMPLATE_FORM_VALIDATION_PARAM_NAME_REQUIRED,
  dependencyNameRequired: TEMPLATE_FORM_VALIDATION_DEPENDENCY_NAME_REQUIRED,
} as const;

export const TEMPLATE_TOAST_SAVE_SUCCESS_TITLE = "Template salvo com sucesso";
export const TEMPLATE_TOAST_SAVE_SUCCESS_DESCRIPTION =
  "O template foi salvo com sucesso.";
export const TEMPLATE_TOAST_SAVE_ERROR_TITLE = "Erro ao salvar template";
export const TEMPLATE_TOAST_SAVE_ERROR_FALLBACK_DESCRIPTION =
  "Ocorreu um erro ao salvar o template.";
export const TEMPLATE_TOAST_FETCH_ERROR_TITLE = "Erro ao buscar template";
export const TEMPLATE_TOAST_FETCH_ERROR_DESCRIPTION =
  "Não foi possível carregar o template";

export const TEMPLATE_FORM_TOAST_MESSAGES = {
  saveSuccessTitle: TEMPLATE_TOAST_SAVE_SUCCESS_TITLE,
  saveSuccessDescription: TEMPLATE_TOAST_SAVE_SUCCESS_DESCRIPTION,
  saveErrorTitle: TEMPLATE_TOAST_SAVE_ERROR_TITLE,
  saveErrorFallbackDescription: TEMPLATE_TOAST_SAVE_ERROR_FALLBACK_DESCRIPTION,
  fetchErrorTitle: TEMPLATE_TOAST_FETCH_ERROR_TITLE,
  fetchErrorDescription: TEMPLATE_TOAST_FETCH_ERROR_DESCRIPTION,
} as const;

export const TEMPLATE_FORM_LOADING_TEXT = "Loading...";
export const TEMPLATE_FORM_INFO_CARD_TITLE = "Informações do Template";
export const TEMPLATE_FORM_TITLE_LABEL = "Título *";
export const TEMPLATE_FORM_TITLE_PLACEHOLDER = "Ex: Algoritmo de Ordenação";
export const TEMPLATE_FORM_DESCRIPTION_LABEL = "Descrição *";
export const TEMPLATE_FORM_DESCRIPTION_PLACEHOLDER =
  "Descreva o propósito e funcionamento deste template...";
export const TEMPLATE_FORM_WORKER_TYPE_LABEL = "Worker Type *";
export const TEMPLATE_FORM_WORKER_TYPE_PLACEHOLDER = "Selecione o worker";
export const TEMPLATE_FORM_PARAMS_LABEL = "Parâmetros";
export const TEMPLATE_FORM_PARAMS_HELPER =
  "Use vírgula para separar os parâmetros Exemplo: param1, param2, param3";
export const TEMPLATE_FORM_PARAMS_PLACEHOLDER = "Ex: param1, param2, param3";
export const TEMPLATE_FORM_PARAM_TYPES_TITLE = "Tipos dos parâmetros";
export const TEMPLATE_FORM_PARAM_TYPES_HELP =
  "Define como o valor será convertido no módulo de variáveis.";
export const TEMPLATE_FORM_PARAM_TYPE_PLACEHOLDER = "Tipo";
export const TEMPLATE_FORM_DEPENDENCIES_LABEL = "Dependências";
export const TEMPLATE_FORM_DEPENDENCIES_HELPER =
  "Use vírgula para separar as dependências Exemplo: dep1, dep2, dep3";
export const TEMPLATE_FORM_DEPENDENCIES_PLACEHOLDER = "Ex: dep1, dep2, dep3";
export const TEMPLATE_FORM_CLEAR_BUTTON = "Limpar";
export const TEMPLATE_FORM_SAVE_BUTTON = "Salvar Template";
export const TEMPLATE_FORM_CODE_CARD_TITLE = "Código do Template *";

export const TEMPLATE_FORM_TEXT = {
  loading: TEMPLATE_FORM_LOADING_TEXT,
  infoCardTitle: TEMPLATE_FORM_INFO_CARD_TITLE,
  titleLabel: TEMPLATE_FORM_TITLE_LABEL,
  titlePlaceholder: TEMPLATE_FORM_TITLE_PLACEHOLDER,
  descriptionLabel: TEMPLATE_FORM_DESCRIPTION_LABEL,
  descriptionPlaceholder: TEMPLATE_FORM_DESCRIPTION_PLACEHOLDER,
  workerTypeLabel: TEMPLATE_FORM_WORKER_TYPE_LABEL,
  workerTypePlaceholder: TEMPLATE_FORM_WORKER_TYPE_PLACEHOLDER,
  paramsLabel: TEMPLATE_FORM_PARAMS_LABEL,
  paramsHelper: TEMPLATE_FORM_PARAMS_HELPER,
  paramsPlaceholder: TEMPLATE_FORM_PARAMS_PLACEHOLDER,
  paramTypesTitle: TEMPLATE_FORM_PARAM_TYPES_TITLE,
  paramTypesHelp: TEMPLATE_FORM_PARAM_TYPES_HELP,
  paramTypePlaceholder: TEMPLATE_FORM_PARAM_TYPE_PLACEHOLDER,
  dependenciesLabel: TEMPLATE_FORM_DEPENDENCIES_LABEL,
  dependenciesHelper: TEMPLATE_FORM_DEPENDENCIES_HELPER,
  dependenciesPlaceholder: TEMPLATE_FORM_DEPENDENCIES_PLACEHOLDER,
  clearButton: TEMPLATE_FORM_CLEAR_BUTTON,
  saveButton: TEMPLATE_FORM_SAVE_BUTTON,
  codeCardTitle: TEMPLATE_FORM_CODE_CARD_TITLE,
} as const;

export const TEMPLATE_PAGE_BACK_BUTTON = "Back";
export const TEMPLATE_PAGE_TITLE = "Template";

export const TEMPLATE_PAGE_TEXT = {
  backButton: TEMPLATE_PAGE_BACK_BUTTON,
  title: TEMPLATE_PAGE_TITLE,
} as const;

export const TEMPLATE_LIST_TITLE = "Templates";
export const TEMPLATE_LIST_ADD_BUTTON = "Add Template";

export const TEMPLATE_LIST_TEXT = {
  title: TEMPLATE_LIST_TITLE,
  addButton: TEMPLATE_LIST_ADD_BUTTON,
} as const;

export const TEMPLATE_TOAST_DELETE_SUCCESS_TITLE = "Template deleted";
export const TEMPLATE_TOAST_DELETE_SUCCESS_DESCRIPTION =
  "The template has been successfully deleted.";
export const TEMPLATE_TOAST_ERROR_TITLE = "Error";
export const TEMPLATE_TOAST_DELETE_ERROR_FALLBACK_DESCRIPTION =
  "Failed to delete template.";

export const TEMPLATE_LIST_TOAST_MESSAGES = {
  deleteSuccessTitle: TEMPLATE_TOAST_DELETE_SUCCESS_TITLE,
  deleteSuccessDescription: TEMPLATE_TOAST_DELETE_SUCCESS_DESCRIPTION,
  errorTitle: TEMPLATE_TOAST_ERROR_TITLE,
  deleteErrorFallbackDescription:
    TEMPLATE_TOAST_DELETE_ERROR_FALLBACK_DESCRIPTION,
} as const;

export const TEMPLATE_TABLE_TITLE_HEADER = "Title";
export const TEMPLATE_TABLE_DESCRIPTION_HEADER = "Description";
export const TEMPLATE_TABLE_CONTENT_HEADER = "Conteúdo";
export const TEMPLATE_TABLE_ACTIONS_HEADER = "Actions";
export const TEMPLATE_TABLE_EMPTY_TEXT = "No templates found.";
export const TEMPLATE_TABLE_VIEW_BUTTON = "Visualizar";

export const TEMPLATE_TABLE_TEXT = {
  titleHeader: TEMPLATE_TABLE_TITLE_HEADER,
  descriptionHeader: TEMPLATE_TABLE_DESCRIPTION_HEADER,
  contentHeader: TEMPLATE_TABLE_CONTENT_HEADER,
  actionsHeader: TEMPLATE_TABLE_ACTIONS_HEADER,
  empty: TEMPLATE_TABLE_EMPTY_TEXT,
  viewButton: TEMPLATE_TABLE_VIEW_BUTTON,
} as const;

// Keeping labels equal to enum values for now (no UX change),
// but centralized so future renames/translations are one-liners.
export const WorkerTypeLabelMap: Record<WorkerType, string> = {
  [WorkerType.NODE_DEFAULT]: WorkerType.NODE_DEFAULT,
  [WorkerType.NODE_NESTJS]: WorkerType.NODE_NESTJS,
  [WorkerType.NODE_GRPCJS]: WorkerType.NODE_GRPCJS,
  [WorkerType.NODE_NEXTJS_CYPRESS]: WorkerType.NODE_NEXTJS_CYPRESS,
  [WorkerType.NODE_REACTJS_CYPRESS]: WorkerType.NODE_REACTJS_CYPRESS,
};

export const TemplateParamTypeLabelMap: Record<TemplateParamType, string> = {
  [TemplateParamType.STRING]: TemplateParamType.STRING,
  [TemplateParamType.NUMBER]: TemplateParamType.NUMBER,
  [TemplateParamType.BOOLEAN]: TemplateParamType.BOOLEAN,
  [TemplateParamType.OBJECT]: TemplateParamType.OBJECT,
};
