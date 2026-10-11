"use client";

export function getItem(key: string): string | null {
  if (typeof window === "undefined") return null

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setItem(key: string, value: string): void {
  if (typeof window === "undefined") return

  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    console.warn("Não foi possível persistir dados do workspace:", error);
  }
}

export function removeItem(key: string): void {
  if (typeof window === "undefined") return

  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn("Não foi possível remover dados do workspace:", error);
  }
}
