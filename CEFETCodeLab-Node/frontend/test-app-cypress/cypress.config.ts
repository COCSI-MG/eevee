import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: process.env.TARGET_APP_URL,
    supportFile: false, // Added to resolve support file error
    reporter: "json",
    excludeSpecPattern: [
      "**/examples/**",
    ]
  },
});
