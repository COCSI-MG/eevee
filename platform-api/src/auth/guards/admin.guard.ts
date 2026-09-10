import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AdminGuard extends AuthGuard('jwt') implements CanActivate {
  /**
   * Optionally override canActivate to do anything
   * *before* the JWT is validated, if needed.
   * Otherwise, you can let super.canActivate() handle
   * the token validation first, then override handleRequest.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First, let JwtAuthGuard validate the token and attach user to request
    const can = (await super.canActivate(context)) as boolean;
    if (!can) return false;

    // The user is now attached to the request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if the user exists and is an admin
    if (!user?.isAdmin) {
      throw new ForbiddenException('Only admins can access this route.');
    }

    return true;
  }
}
