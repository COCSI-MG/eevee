import { UserRole } from 'src/user/user-role';

export interface JwtPayload {
  email: string;
  userId: number;
  role: UserRole;
  familyId?: string;
  exp?: number;
}
