export interface JwtPayload {
  email: string;
  userId: number;
  isAdmin: boolean;
  familyId?: string;
  exp?: number;
}
