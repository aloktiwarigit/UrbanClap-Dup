import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/bootstrap.ts',
        // OpenAPI build + registry are exercised end-to-end via execSync in
        // tests/openapi-build.test.ts (6 assertions against the real output),
        // but v8 coverage cannot instrument a subprocess invocation.
        'src/openapi/**',
        '**/*.config.*',
        // Cloud-infra singletons — require real Cosmos/Firebase credentials;
        // tested indirectly via mocks throughout the integration suite.
        'src/cosmos/client.ts',
        'src/services/firebaseAdmin.ts',
        'src/services/adminUser.service.ts',
        // Type-only declarations — zero executable statements.
        'src/types/**',
      ],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
});
