import type { UserRole } from "./user";

export interface AuthSession {
  userId: number;
  email: string;
  role: UserRole;
  expiresIn: number;
}

export type AuthResponse = AuthSession;

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
}
