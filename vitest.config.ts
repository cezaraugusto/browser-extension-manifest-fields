import { defineConfig } from "vitest/config.js";

export default defineConfig({
  test: {
    environment: "node",
    include: ["__spec__/**/*.spec.ts"],
  },
});
