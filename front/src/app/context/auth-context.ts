"use client";

export class AuthContext {
  static getIsAdmin() {
    if (typeof window !== "undefined") {
      return localStorage.getItem("is_admin");
    }
    return null;
  }

  static setIsAdmin(isAdmin: boolean) {
    if (typeof window !== "undefined") {
      return localStorage.setItem("is_admin", isAdmin.toString());
    }
    return null;
  }

  static getAccessToken() {
    if (typeof window !== "undefined") {
      return localStorage.getItem("access_token");
    }
    return null;
  }

  static setAccessToken(token: string) {
    if (typeof window !== "undefined") {
      return localStorage.setItem("access_token", token);
    }
    return null;
  }

  static clear() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("is_admin");
    }
  }
}
