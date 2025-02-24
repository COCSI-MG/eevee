"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { LoginService } from "../integration/scheduler-api/login-service";
import { AuthContext } from "../context/auth-context";
import { Route } from "../routes";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const { push } = useRouter();

  const {
    mutate: login,
    isSuccess,
    isError,
    error,
    data,
  } = useMutation({
    mutationFn: () => LoginService.login(email, password),
  });

  useEffect(() => {
    if (isError) {
      console.error("Error logging in:", error);
    }

    if (data && isSuccess) {
      AuthContext.setAccessToken(data.token);
      AuthContext.setIsAdmin(data.isAdmin);

      if (data.isAdmin) {
        push(Route.Admin);
        return;
      }
      push(Route.Assignment);
    }
  }, [isError, error, data, isSuccess, push]);

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();

    setEmailError(!email);
    setPasswordError(!password);

    if (!email || !password) return;

    login();
  };

  return (
    <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
      <div>
        <h1 className="text-4xl font-bold text-center">Welcome to Code Lab</h1>
        <p className="text-center text-[#666] dark:text-[#999]">
          Get started by authenticating with your email and password
        </p>
      </div>

      <form className="flex flex-col gap-8 w-full" onClick={handleLogin}>
        <div className="flex flex-col gap-4 w-full">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="
            Enter your email"
            className={`input rounded-lg pl-2 h-8 text-black ${
              emailError ? "border-2 border-red-500" : ""
            }`}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-4 w-full">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Enter your password"
            className={`input rounded-lg pl-2 h-8 text-black ${
              passwordError ? "border-2 border-red-500" : ""
            }`}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <input
            type="submit"
            className="rounded-full cursor-pointer border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            value="Login"
          />
        </div>
      </form>
    </main>
  );
}
