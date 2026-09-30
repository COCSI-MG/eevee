import { loadEnvConfig } from "@next/env";
import { defineConfig } from "cypress";

loadEnvConfig(process.cwd());

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL ?? "http://localhost:3000",
  },
  allowCypressEnv: false,
  expose: {
    apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3010/v1",
    adminEmail: "admin@example.com",
    studentEmail: "student@example.com",
  },
  env: {
    adminPassword: "admin123",
    studentPassword: "student123",
  },
  video: false,
});
