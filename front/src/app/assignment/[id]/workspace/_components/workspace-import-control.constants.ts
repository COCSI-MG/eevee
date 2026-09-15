import type { ConfirmationAlertDialogMessage } from "@/components/shared/confirmation-alert-dialog";

export const WORKSPACE_IMPORT_TEXT = {
  missingSourceError: "Selecione uma atividade para importar.",
  successToastTitle: "Projeto importado",
  successToastDescription:
    "Confira o workspace e clique em Salvar antes de continuar.",
  errorToastTitle: "Falha ao importar projeto",
  errorToastFallbackDescription:
    "Não foi possível importar o projeto selecionado.",
  sectionTitle: "Importar projeto",
  sourcesError: "Não foi possível carregar os projetos enviados.",
  retryButton: "Tentar novamente",
  sourceSelectAriaLabel: "Atividade com projeto enviado",
  loadingPlaceholder: "Carregando...",
  emptyPlaceholder: "Nenhum projeto compatível",
  selectPlaceholder: "Selecione uma atividade",
  importButton: "Importar",
  dialogTitle: "Importar projeto enviado?",
  dialogConfirmLabel: "Confirmar importação",
  dialogPendingLabel: "Importando...",
  dialogWorkspaceReplacement: (sourceTitle?: string) =>
    `O workspace atual será substituído pelos arquivos e pastas do último envio para correção de “${sourceTitle ?? ""}”.`,
  dialogIrrecoverableContent:
    "O conteúdo atual não poderá ser recuperado por este fluxo e o histórico de tentativas da atividade de origem não será transferido.",
  dialogSaveReminder:
    "Depois da importação, clique em Salvar antes de continuar.",
} as const;

export const getWorkspaceImportConfirmationMessages = (
  sourceTitle?: string,
): readonly ConfirmationAlertDialogMessage[] => [
  {
    content: WORKSPACE_IMPORT_TEXT.dialogWorkspaceReplacement(sourceTitle),
  },
  {
    content: WORKSPACE_IMPORT_TEXT.dialogIrrecoverableContent,
  },
  {
    content: WORKSPACE_IMPORT_TEXT.dialogSaveReminder,
    emphasis: true,
  },
];
