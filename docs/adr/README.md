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
