import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "lcov"],
      include: [
        "lib/pipeline/**/*.ts",
        "lib/validator.ts",
        "lib/gemini/**/*.ts",
        "lib/utils/**/*.ts",
        "constants/**/*.ts",
      ],
      exclude: ["node_modules", ".next"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
