import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

export const AUTH_COOKIE_NAME = 'eevee_auth';
export const REFRESH_COOKIE_NAME = 'eevee_refresh';
export const REFRESH_COOKIE_PATH = '/v1/auth/refresh';
export const DEFAULT_AUTH_SESSION_TTL_SECONDS = 15 * 60;
export function getAuthSessionTtlSeconds(configService: ConfigService) {
  return (
    Number(configService.get<string>('AUTH_SESSION_TTL_SECONDS')) ||
    DEFAULT_AUTH_SESSION_TTL_SECONDS
  );
}

export const DEFAULT_AUTH_REFRESH_TTL_SECONDS = 14 * 24 * 60 * 60;
export function getRefreshTtlSeconds(configService: ConfigService) {
  return (
    Number(configService.get<string>('AUTH_REFRESH_TTL_SECONDS')) ||
    DEFAULT_AUTH_REFRESH_TTL_SECONDS
  );
}

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
    maxAge: getAuthSessionTtlSeconds(configService) * 1000,
  };
}

export function getRefreshCookieOptions(configService: ConfigService) {
  return {
    ...getAuthCookieOptions(configService),
    path: REFRESH_COOKIE_PATH,
    maxAge: getRefreshTtlSeconds(configService) * 1000,
  };
}

export function setRefreshCookie(
  response: Response,
  token: string,
  configService: ConfigService,
) {
  response.cookie(
    REFRESH_COOKIE_NAME,
    token,
    getRefreshCookieOptions(configService),
  );
}

export function clearRefreshCookie(
  response: Response,
  configService: ConfigService,
) {
  response.clearCookie(
    REFRESH_COOKIE_NAME,
    getRefreshCookieOptions(configService),
  );
}

export function getRefreshTokenFromCookieHeader(cookieHeader?: string) {
  const cookies = parseCookieHeader(cookieHeader);
  return cookies[REFRESH_COOKIE_NAME] || null;
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
