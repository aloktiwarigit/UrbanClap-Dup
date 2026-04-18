# ADR-0004: Azure Functions Consumption plan for API backend (not App Service, not Container Apps)

- **Status:** accepted
- **Date:** 2026-04-17
- **Deciders:** Alok Tiwari, Winston

## Context

The API backend is a Node 22 Fastify application serving REST endpoints (OpenAPI 3.1), webhook handlers (Razorpay, DigiLocker), and background triggers (dispatcher, SLA timers, weekly payouts, quarterly SSC levy remittance). The architecture must stay in free tier at pilot scale (NFR-M-1). The workload has:

- Bursty traffic (booking + dispatch + status churn during peak hours)
- Long idle periods at night (low user activity 1-5 AM IST)
- A mix of HTTP, timer, and Cosmos-change-feed triggers

## Decision

**All API handlers run on Azure Functions Consumption plan.**

- Each endpoint/trigger = one Function in the `api/src/functions/` tree.
- HTTP triggers for REST endpoints.
- Timer triggers for: SLA deadlines, weekly payout run, quarterly SSC levy remittance, DR checks.
- Cosmos change-feed triggers for: dispatcher, live ops feed broadcast, audit log integrity verifier.
- Queue triggers (Azure Storage Queue free tier) for: photo processing, PDF report generation, deferred retries.

## Consequences

**Positive:**
- 1M executions + 400k GB-sec/month free. At pilot scale (~30k execs, ~3k GB-sec) we use < 1% of free tier.
- Zero idle cost. Nights + slow days cost nothing.
- Autoscales automatically; no capacity planning.
- Pay-per-invocation at overflow is ~₹0.20 per million executions — tiny at 50k bookings scale (~₹0.60/mo).
- Multiple trigger types in one compute plane — no need to run cron jobs on a separate VM.
- Managed Identity for accessing Cosmos, Key Vault, Storage — no secret juggling.

**Negative:**
- **Cold starts.** Node Function cold-start latency ~1-2 seconds. This affects low-traffic endpoints (first-hit penalty).
  - Mitigation 1: warmup ping every 4 minutes during Indian business hours (6 AM - midnight IST) via a lightweight timer-trigger.
  - Mitigation 2: dispatcher is always warm during traffic (change-feed-triggered, continuous activity).
  - Mitigation 3: accept 1-2s cold start for non-critical endpoints (service catalogue fetch is cacheable; booking creation tolerates 2s).
- **60-second execution limit (Consumption plan).** Most endpoints finish in < 1 s; background triggers (payouts, quarterly remittance) broken into chunks that fit in the window.
- **Stateless only.** All state in Cosmos / Storage / Key Vault. This is a feature, not a bug, for this use case.

**Neutral:**
- We accept the 60s limit and stateless constraints as enforced good architecture.

## Alternatives considered

- **App Service Plan F1 (Free)** — 60 min CPU/day quota. Unusable for any real workload. Rejected.
- **App Service Plan B1** — always-on ~₹900/mo. Violates ₹0 constraint. Rejected.
- **Azure Container Apps Consumption** — similar free tier (180k vCPU-sec + 360k GiB-sec), but less integration with Cosmos change feed, more container operational overhead. Rejected in favor of Functions.
- **Azure Kubernetes Service free tier** — free control plane but node VMs cost. Serious overkill for a solo-built system. Rejected.
- **Cloudflare Workers** — 100k requests/day free. Would need rewrite from Node+Fastify to Workers runtime. Rejected as unnecessary migration cost.
- **Vercel Serverless Functions** — attractive but Vercel costs kick in at ~100k serverless invocations/mo. Would require vendor lock-in on Vercel's pipeline. Rejected.
- **Self-hosted Node + Nginx on a ₹300/mo VPS** — defeats the ₹0 constraint. Rejected.

## References

- `docs/prd.md` §Performance SLOs (NFR-P-1 to P-8)
- `_bmad-output/planning-artifacts/architecture.md` §3.2 component table, §4.4 ADR summary, §7.2 free-tier budget
- Azure Functions Consumption pricing: 1M execs + 400k GB-sec free/mo (as of Apr 2026)
