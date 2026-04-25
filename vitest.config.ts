import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["src/**/*.ts"],
      // src/index.ts is the bin entrypoint — its only job is to call buildCli().parse(argv).
      // Excluded from coverage; cli.ts (which it delegates to) is fully tested.
      exclude: ["src/**/*.d.ts", "src/types/**", "src/index.ts"],
      thresholds: {
        lines: 90,
        branches: 90,
        functions: 90,
        statements: 90,
      },
    },
    globals: false,
    reporters: ["default"],
  },
});
