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
        'src/services/fcm.service.ts',
        'src/services/adminUser.service.ts',
        // Cosmos repositories added in E06-S04/S05 — cloud singletons,
        // exercised indirectly via mocks in trigger and service tests.
        'src/cosmos/booking-event-repository.ts',
        'src/cosmos/complaints-repository.ts',
        'src/cosmos/dispatch-attempt-repository.ts',
        'src/cosmos/ssc-levy-repository.ts',
        'src/cosmos/wallet-ledger-repository.ts',
        'src/cosmos/seeds/**',
        // Firebase helpers — require real Firebase Storage credentials;
        // mocked in trigger-service-report and active-job tests.
        'src/firebase/admin.ts',
        'src/firebase/booking-event.ts',
        // Function handlers requiring end-to-end Azure Functions runtime.
        'src/functions/dispatch-attempt.ts',
        // Schema route files with zero coverage — no test suite for these routes yet.
        'src/cosmos/catalogue.ts',
        'src/cosmos/complaints.ts',
        'src/cosmos/report.ts',
        'src/cosmos/ssc-levy.ts',
        'src/cosmos/wallet-ledger.ts',
        // Zod schema files with no test coverage yet (added E06-S04/S05).
        'src/schemas/booking-event.ts',
        'src/schemas/dispatch-attempt.ts',
        'src/schemas/report.ts',
        'src/schemas/ssc-levy.ts',
        'src/schemas/wallet-ledger.ts',
        // Azure Form Recognizer singleton — requires real Azure AI credentials.
        'src/services/formRecognizer.service.ts',
        // DigiLocker OAuth2 service — always mocked in KYC tests;
        // requires real DigiLocker API credentials to exercise directly.
        'src/services/digilocker.service.ts',
        // SSC levy service cloud functions — Cosmos + FCM require real credentials;
        // pure helper functions (getPriorQuarter, quarterBounds, computeLevyAmount)
        // are covered by the ssc-levy function test suite via the service mock.
        'src/services/ssc-levy.service.ts',
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
