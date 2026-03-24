import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://0.0.0.0:5173",
    supportFile: false,
    reporter: "json",
    excludeSpecPattern: [
      "**/examples/**",
    ]
  },
  video: false,
  screenshotOnRunFailure: false, 
});
