import type { UserRole } from "./types";

export interface Profile {
  role: UserRole;
  label: string;
}

export const profiles: readonly Profile[] = [
  { role: "aluno", label: "Aluno" },
  { role: "professor", label: "Professor" },
  { role: "admin", label: "Administrador" },
];
