import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const redirectToLogin = (request: NextRequest) =>
  NextResponse.redirect(new URL('/login', request.url));

const redirectToClasses = (request: NextRequest) =>
  NextResponse.redirect(new URL('/classes', request.url));

export async function middleware(request: NextRequest) {
  if (!API_URL) {
    return redirectToLogin(request);
  }

  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) {
    return redirectToLogin(request);
  }

  try {
    const response = await fetch(new URL('/auth/me', API_URL), {
      headers: {
        cookie: cookieHeader,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return redirectToLogin(request);
    }

    const session = (await response.json()) as {
      userId: number;
      email: string;
      isAdmin: boolean;
    };

    if (!session.isAdmin) {
      return redirectToClasses(request);
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Failed to validate admin session:', error);
    return redirectToLogin(request);
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};
