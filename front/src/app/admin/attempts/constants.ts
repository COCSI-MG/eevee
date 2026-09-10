export const ADMIN_ATTEMPTS_DEFAULT_PAGE_SIZE = 5;
export const ADMIN_ATTEMPTS_INITIAL_PAGE = 1;

export const ADMIN_ATTEMPTS_ALL_CLASSES_VALUE = "all-classes";
export const ADMIN_ATTEMPTS_ALL_ASSIGNMENTS_VALUE = "all-assignments";

export const ADMIN_ATTEMPTS_SEARCH_DEBOUNCE_MS = 300;
export const ADMIN_ATTEMPTS_LOADING_INDICATOR_DELAY_MS = 300;

export const ADMIN_ATTEMPTS_QUERY_PARAMS = {
  assignmentId: "assignmentId",
  classId: "classId",
  userSearch: "userSearch",
  openLatest: "openLatest",
} as const;

export const ADMIN_ATTEMPTS_OPEN_LATEST_VALUE = "1";

export const ADMIN_ATTEMPTS_TEXT = {
  title: "Tentativas de testes",
  description:
    "Selecione uma turma ou atividade para listar as tentativas, analisar detalhes e reexecutar testes.",
  filters: {
    classLabel: "Filtrar por turma",
    allClasses: "Todas as turmas",
    assignmentLabel: "Filtrar por atividade",
    allAssignments: "Todas as atividades",
    userLabel: "Buscar usuário",
    userPlaceholder: "Buscar por e-mail ou ID",
  },
  actions: {
    refresh: "Atualizar",
  },
  selection: {
    classPrefix: "Turma selecionada:",
    assignmentPrefix: "Atividade selecionada:",
    separator: " · ",
  },
  status: {
    refreshing: "Atualizando tentativas...",
    initialPrompt: "Selecione uma turma ou atividade para carregar as tentativas.",
    filterOptionsError: "Não foi possível carregar as opções dos filtros.",
    attemptsError:
      "Não foi possível carregar as tentativas para os filtros selecionados.",
  },
  retry: {
    successTitle: "Reexecução enviada",
    successDescription:
      "A tentativa foi enviada novamente para fila de execução.",
    errorTitle: "Erro ao reexecutar",
    errorFallbackDescription:
      "Não foi possível reexecutar a tentativa.",
  },
} as const;
