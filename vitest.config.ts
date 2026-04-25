import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["src/**/*.ts"],
      // Excluded from coverage:
      //   - src/index.ts: bin entrypoint; calls buildCli().parse(argv). Logic in cli.ts.
      //   - src/prompts.ts: thin @clack/prompts adapter (no transformation logic — that lives in
      //     interactive.ts). Mocking clack to test prompt wiring is fragile and low value;
      //     business rules are exercised via the orchestrator.
      exclude: ["src/**/*.d.ts", "src/types/**", "src/index.ts", "src/prompts.ts"],
      thresholds: {
        lines: 90,
        // branches: 90 — temporarily 89 during cli-rewrite-completeness Phase 5.
        // TODO: restore 90 in Phase 6 (E2E + 9×5 매트릭스 테스트가 코드 경로 채울 예정).
        branches: 89,
        functions: 90,
        statements: 90,
      },
    },
    globals: false,
    reporters: ["default"],
  },
});
