'use client'

import { AuthContext } from "@/app/provider/auth-provider"
import { useContext } from "react";

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthUser must be used within an AuthProvider");
  }
  return context;
} 
