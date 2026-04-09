import { defineConfig } from "vite";

export default defineConfig({
  base: "/games/raiden-ii/",
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    }
  }
});
