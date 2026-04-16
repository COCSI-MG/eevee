export interface AuthSession {
  userId: number;
  email: string;
  isAdmin: boolean;
}

export type AuthResponse = AuthSession;

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
}
