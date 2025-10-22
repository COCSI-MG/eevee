import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: "http://localhost:3002", // Adjusted to point to the target-app
    supportFile: false, // Added to resolve support file error
  },
});
