import type { WorkspacePreflightResult } from './workspace-preflight.utils'

export const defaultResponseValidateWorker: WorkspacePreflightResult = {
  ok: true,
  message: "Worker validado com sucesso.",
  details: [],
}

export enum FailureTypeWorker {
  TYPESCRIPT_NOT_ALLOWED,
  HAS_NO_PRINCIPAL_ARCHIVE,
  EXPORTS_NOT_FOUND,
  MIN_STRCTURE_NUXT,
  PRINCIPAL_PAGE_NOT_FOUND,
  PRINCIPAL_COMPONENT_NOT_FOUND,
  ENTRY_POINT_NOT_FOUND,
}

export const responses : Record<FailureTypeWorker, WorkspacePreflightResult> = {
  [FailureTypeWorker.TYPESCRIPT_NOT_ALLOWED]: {
    message: "Tipo de arquivo não permitido.",
    details: ["Esperado o arquivo src/app.js para este worker."],
    ok: false
  },
  [FailureTypeWorker.HAS_NO_PRINCIPAL_ARCHIVE]: {
    message: "Arquivo principal não encontrado.",
    details: ["Esperado o arquivo src/app.js para este worker."],
    ok: false
  },
  [FailureTypeWorker.EXPORTS_NOT_FOUND]: {
    message: "Exportações não encontradas.",
    details: ["Use a exportação da função main no arquivo src/app.js."],
    ok: false
  },
  [FailureTypeWorker.MIN_STRCTURE_NUXT]: {
    message: "Estrutura mínima do Nuxt não encontrada.",
    details: ["Inclua pelo menos um arquivo TypeScript dentro de src/."],
    ok: false
  },
  [FailureTypeWorker.PRINCIPAL_PAGE_NOT_FOUND]: {
    message: "Página principal não encontrada.",
    details: ["Esperado arquivo src/page.tsx (ou src/page.jsx)."],
    ok: false
  },
  [FailureTypeWorker.PRINCIPAL_COMPONENT_NOT_FOUND]: {
    message: "Componente principal não encontrado.",
    details: ["Esperado arquivo src/App.tsx (ou src/App.jsx)."],
    ok: false
  },
  [FailureTypeWorker.ENTRY_POINT_NOT_FOUND]: {
    message: "Entry point da aplicação não encontrado.",
    details: ["Esperado arquivo src/main.tsx (ou src/main.jsx)."],
    ok: false
  }
}
