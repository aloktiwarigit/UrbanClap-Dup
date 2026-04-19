# Architecture Decision Records

Every significant decision is recorded as a numbered, immutable ADR. Use `TEMPLATE.md`.

## Rules
- ADRs are immutable once merged. Supersede with a new ADR; do not edit history.
- Number monotonically starting at `0001`.
- File name: `NNNN-kebab-case-title.md`.
- If you're about to make a decision that future-you would want to look up: write an ADR.

## When to write an ADR
- Choosing a framework, library, or pattern with >1 reasonable alternative
- Accepting a known tradeoff (perf, security, compliance)
- Changing a previous decision
- A decision that affects interfaces between components

## Index
- [0001](0001-primary-stack-choice.md) — Primary stack choice (Kotlin+Compose, Next.js, Node)
- [0002](0002-fcm-universal-messaging-spine.md) — FCM as universal messaging spine
- [0003](0003-cosmos-db-serverless-sor.md) — Cosmos DB Serverless as SoR
- [0004](0004-azure-functions-consumption.md) — Azure Functions Consumption
- [0005](0005-auth-strategy-truecaller-firebase.md) — Auth strategy (Truecaller + Firebase)
- [0006](0006-dispatch-algorithm.md) — Dispatch algorithm
- [0007](0007-zero-paid-saas-constraint.md) — Zero paid SaaS constraint
- [0008](0008-storybook-react-vite-framework.md) — Storybook React Vite framework
- [0009](0009-openapi-client-generator.md) — OpenAPI client generator
- [0010](0010-design-system-composite-build.md) — Design-system Gradle module via composite build
