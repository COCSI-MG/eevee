"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthService } from "../integration/scheduler-api/auth-service";
import { renewSession } from "../integration/scheduler-api/client";
import { AuthSession } from "../interface/scheduler-api/auth";

const AUTH_ROUTES = new Set(["/login", "/register"]);
const RENEWAL_RATIO = 0.8;
const MIN_RENEWAL_DELAY_MS = 5_000;

const isAuthRoute = (pathname: string) => AUTH_ROUTES.has(pathname);
const isProtectedRoute = (pathname: string) =>
  pathname.startsWith("/classes") || pathname.startsWith("/assignment");

export const AuthContext = React.createContext<
  | {
      user: AuthSession | null;
      isAuthenticated: boolean;
      refreshSession: () => Promise<void>;
      setSession: (session: AuthSession | null) => void;
      logout: () => Promise<void>;
    }
  | undefined
>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthSession | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);
  const refreshRequestIdRef = useRef(0);

  const setSession = useCallback((session: AuthSession | null) => {
    refreshRequestIdRef.current += 1;
    setUser(session);
    setIsHydrating(false);
  }, []);

  const refreshSession = useCallback(async () => {
    const requestId = ++refreshRequestIdRef.current;

    try {
      const session = await AuthService.me();

      if (requestId !== refreshRequestIdRef.current) {
        return;
      }

      setSession(session);
    } catch (error) {
      if (requestId !== refreshRequestIdRef.current) {
        return;
      }

      const status = (error as { response?: { status?: number } }).response?.status;

      if (status !== 401) {
        console.error("Error loading auth session:", error);
        setSession(null);
        return;
      }

      const renewed = await renewSession();

      if (requestId !== refreshRequestIdRef.current) {
        return;
      }

      setSession(renewed);
    }
  }, [setSession]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (!user) {
      return;
    }

    // Reagenda sozinho: setSession troca o objeto user e o efeito roda de novo.
    // Renovação que falha não desloga, o interceptor cuida disso no 401.
    const timer = setTimeout(
      async () => {
        const session = await renewSession();

        if (session) {
          setSession(session);
        }
      },
      Math.max(user.expiresIn * RENEWAL_RATIO * 1000, MIN_RENEWAL_DELAY_MS),
    );

    return () => clearTimeout(timer);
  }, [user, setSession]);

  useEffect(() => {
    if (isHydrating) {
      return;
    }

    if (isAuthRoute(pathname) && user) {
      router.replace(user.isAdmin ? "/admin" : "/classes");
      return;
    }

    if (!user && (isProtectedRoute(pathname) || pathname.startsWith("/admin"))) {
      router.replace("/login");
      return;
    }

    if (pathname.startsWith("/admin") && user && !user.isAdmin) {
      router.replace("/classes");
    }
  }, [isHydrating, pathname, router, user]);

  const logout = useCallback(async () => {
    try {
      await AuthService.logout();
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      setSession(null);
      router.replace("/login");
    }
  }, [router, setSession]);

  const shouldHideContent =
    (isHydrating &&
      (isAuthRoute(pathname) ||
        isProtectedRoute(pathname) ||
        pathname.startsWith("/admin"))) ||
    (isAuthRoute(pathname) && user) ||
    (pathname.startsWith("/admin") && user && !user.isAdmin) ||
    (!user && (isProtectedRoute(pathname) || pathname.startsWith("/admin")));

  if (shouldHideContent) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: Boolean(user),
        refreshSession,
        logout,
        setSession,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
