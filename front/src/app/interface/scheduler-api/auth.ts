export interface AuthResponse {
  token: string;
  isAdmin: boolean;
}

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
}