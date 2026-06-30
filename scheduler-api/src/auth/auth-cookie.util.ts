import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

export const AUTH_COOKIE_NAME = 'eevee_auth';

export function parseCookieHeader(cookieHeader?: string) {
  return (cookieHeader ?? '')
    .split(';')
    .reduce<Record<string, string>>((cookies, cookie) => {
      const [name, ...valueParts] = cookie.trim().split('=');

      if (!name) {
        return cookies;
      }

      cookies[name] =
        valueParts.length > 0 ? decodeURIComponent(valueParts.join('=')) : '';
      return cookies;
    }, {});
}

export function getAuthCookieOptions(configService: ConfigService) {
  const environment = configService.get<string>('ENV');
  const isProduction = environment === 'production';
  const configuredDomain = configService.get<string>('AUTH_COOKIE_DOMAIN');
  const cookieDomain = configuredDomain?.trim() || undefined;

  return {
    httpOnly: true,
    path: '/',
    sameSite: 'lax' as const,
    secure: isProduction,
    domain: cookieDomain,
    maxAge: 60 * 60 * 1000,
  };
}

export function setAuthCookie(
  response: Response,
  token: string,
  configService: ConfigService,
) {
  response.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions(configService));
}

export function clearAuthCookie(
  response: Response,
  configService: ConfigService,
) {
  response.clearCookie(AUTH_COOKIE_NAME, getAuthCookieOptions(configService));
}

export function getTokenFromCookieHeader(cookieHeader?: string) {
  const cookies = parseCookieHeader(cookieHeader);
  const token = cookies[AUTH_COOKIE_NAME];
  return token || null;
}
