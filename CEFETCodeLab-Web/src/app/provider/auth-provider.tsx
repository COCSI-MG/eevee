'use client'

import { usePathname, useRouter } from "next/navigation";
import { AuthContext as AuthContextClass } from "../context/auth-context";
import { User } from "../interface/scheduler-api/user";
import React, { useEffect } from "react";
import { Route } from '../routes';

export const AuthContext = React.createContext<
  | {
    user: Pick<User, 'id' | 'email' | 'isAdmin'> | null;
    isAuthenticated: boolean;
    checkTokenExpired: () => void;
    logout: () => void;
  }
  | undefined
>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { push, back } = useRouter();
  const pathName = usePathname();
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [user, setUser] = React.useState<Pick<
    User,
    'id' | 'email' | 'isAdmin'
  > | null>(null);

  const checkTokenExpired = React.useCallback(() => {
    const token = AuthContextClass.getAccessToken();
    if (!token) {
      AuthContextClass.clear();
      push('/login');
      setIsAuthenticated(false);
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      if (currentTime > expirationTime) {
        AuthContextClass.clear();
        push('/login');
        setIsAuthenticated(false);
        return;
      }
      console.log(payload);
      setIsAuthenticated(true);
      setUser({
        id: payload.userId,
        email: payload.email,
        isAdmin: payload.isAdmin,
      });
    } catch (error) {
      console.error('Error decoding token:', error);
      AuthContextClass.clear();
      push('/login');
      setIsAuthenticated(false);
    }
  }, [push]);

  const isAuthPathName = (pathName: string) => {
    return pathName === Route.Login || pathName === '/register';
  }

  useEffect(() => {
    if (isAuthenticated && isAuthPathName(pathName)) {
      back();
    }
  }, [back, isAuthenticated, pathName]);

  React.useEffect(() => {
    if (pathName === '/login' || pathName === '/register') {
      return;
    }
    checkTokenExpired();
  }, [checkTokenExpired, pathName]);

  const logout = () => {
    try {
      AuthContextClass.clear();
      push(`/${Route.Login}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: isAuthenticated,
        checkTokenExpired,
        logout,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
