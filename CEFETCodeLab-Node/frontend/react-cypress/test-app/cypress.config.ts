import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: "http://localhost:5173", // Adjusted to point to the target-app running vite server
    supportFile: false, // Added to resolve support file error
  },
});
