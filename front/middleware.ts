import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const redirectToLogin = (request: NextRequest) =>
  NextResponse.redirect(new URL('/login', request.url));

const redirectToClasses = (request: NextRequest) =>
  NextResponse.redirect(new URL('/classes', request.url));

const fetchSession = (cookieHeader: string) =>
  fetch(new URL('/auth/me', API_URL), {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  });

const renewSession = (cookieHeader: string) =>
  fetch(new URL('/auth/refresh', API_URL), {
    method: 'POST',
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  });

const withRenewedCookies = (response: NextResponse, cookies: string[]) => {
  cookies.forEach((cookie) => response.headers.append('set-cookie', cookie));
  return response;
};

export async function middleware(request: NextRequest) {
  if (!API_URL) {
    return redirectToLogin(request);
  }

  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) {
    return redirectToLogin(request);
  }

  try {
    let response = await fetchSession(cookieHeader);
    let renewedCookies: string[] = [];

    // O token de acesso vence enquanto a aba está fechada, então navegação
    // direta em /admin costuma chegar aqui sem sessão válida.
    if (response.status === 401) {
      response = await renewSession(cookieHeader);
      renewedCookies = response.headers.getSetCookie();
    }

    if (!response.ok) {
      return redirectToLogin(request);
    }

    const session = (await response.json()) as {
      userId: number;
      email: string;
      isAdmin: boolean;
    };

    if (!session.isAdmin) {
      return withRenewedCookies(redirectToClasses(request), renewedCookies);
    }

    return withRenewedCookies(NextResponse.next(), renewedCookies);
  } catch (error) {
    console.error('Failed to validate admin session:', error);
    return redirectToLogin(request);
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};
