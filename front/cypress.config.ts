import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
  },
  allowCypressEnv: false,
  expose: {
    apiUrl: "http://localhost:3010/v1",
    adminEmail: "admin@example.com",
    studentEmail: "student@example.com",
  },
  env: {
    adminPassword: "admin123",
    studentPassword: "student123",
  },
  video: false,
});
