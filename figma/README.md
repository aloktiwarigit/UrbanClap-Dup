# Figma Design Library — homeservices-mvp

## Overview

This directory contains the Figma integration artifacts for the homeservices design system. The Kotlin design-system module (`design-system/`) is the **source of truth**; this directory mirrors it for Figma consumption.

```
figma/
├── variables.json        ← W3C DTCG token export (import via Token Studio)
├── code-connect/         ← figma-code-connect stubs (active when Dev Mode paid)
│   └── HomeservicesTheme.figma.kts
└── README.md             ← this file
```

See `TOKEN-SYNC.md` at the repo root for the cross-check rule and CI enforcement details.

---

## Free-tier summary (ADR-0007 compliance)

| Feature | Figma plan required | Our approach |
|---|---|---|
| Create + share Figma file | Starter (free) | ✅ Manual |
| Variables import via Token Studio plugin | Starter (free) | ✅ `variables.json` |
| Figma Variables REST API (write) | Professional ($15/editor/mo) | ❌ Not used |
| Dev Mode (Code Connect view in Figma) | Professional ($15/editor/mo) | ❌ Not active; stubs committed for future |
| figma-code-connect CLI annotations | Free (OSS MIT) | ✅ Stubs in `code-connect/` |

Zero recurring cost. When the team upgrades to a paid Figma plan, Dev Mode activates automatically and Code Connect stubs become live.

---

## Part 1 — Importing design tokens into Figma

### Prerequisites
- Figma account (free Starter plan is sufficient)
- **Token Studio** Figma plugin (free tier; search "Token Studio" in the Figma Community)

### Steps

1. **Install Token Studio** — open Figma → Plugins → search "Token Studio for Figma" → Install.

2. **Create (or open) your Figma design file** — this becomes the shared library.

3. **Import `figma/variables.json`**:
   - Open Token Studio panel (Plugins → Token Studio)
   - Click **Import** → choose **JSON** → upload `figma/variables.json`
   - Token Studio parses the W3C DTCG `$value`/`$type` fields automatically

4. **Apply modes** — Token Studio maps light/dark variants. In the panel:
   - Select the `color` group
   - Enable **Themes** → create theme `light` (uses `*.light` tokens) and `dark` (uses `*.dark` tokens)

5. **Publish as shared library** — File → Publish Styles and Variables → enable for your Figma team or personal workspace.

### Token naming convention (matches `figma/variables.json` hierarchy)

| Category | Figma variable path | Kotlin constant |
|---|---|---|
| `color/brand/primary/light` | `color.brand.primary.light` | `BrandPrimaryLight` |
| `color/semantic/danger/light` | `color.semantic.danger.light` | `SemanticDangerLight` |
| `spacing/space4` | `spacing.space4` | `HomeservicesSpacing.space4` |
| `radius/md` | `radius.md` | `HomeservicesRadius.md` |
| `elevation/elev2` | `elevation.elev2` | `HomeservicesElevation.elev2` |
| `motion/duration/base` | `motion.duration.base` | `HomeservicesMotion.base` |
| `typography/body/lg/fontSize` | `typography.body.lg.fontSize` | `bodyLarge.fontSize = 16.sp` |

---

## Part 2 — Figma Code Connect (manual workflow)

[Figma Code Connect](https://github.com/figma/code-connect) links Figma components to Kotlin Composables so that selecting a component in Dev Mode shows the correct Compose snippet.

### Current status: stubs committed, activation pending Dev Mode

The stubs in `figma/code-connect/` are ready. Activation requires:
1. Figma Professional plan or above (Dev Mode)
2. A Figma personal access token with `file_content:read` scope

### Activation steps (when upgrading to paid plan)

```bash
# 1. Install CLI
npm install -g @figma/code-connect

# 2. Authenticate
figma connect auth

# 3. Validate stubs
figma connect validate --token <FIGMA_PAT>

# 4. Publish
figma connect publish --token <FIGMA_PAT>
```

After publishing, selecting any Homeservices component in Figma Dev Mode will show the Kotlin Compose snippet with import path.

### Adding new component stubs

When a new Composable is added to the design system:
1. Create `figma/code-connect/<ComponentName>.figma.kts`
2. Follow the pattern in `HomeservicesTheme.figma.kts`
3. Node URL: copy from Figma right-click → Copy link to selection

---

## Part 3 — Keeping tokens in sync

Token changes follow this path:

```
Kotlin token file (source of truth)
    ↓  edit + commit
figma/variables.json (mirror — update manually)
    ↓  CI check (tools/check-token-drift.py)
    ↓  fail if mismatch
    ↓  Token Studio re-import if values changed
Figma Variables (reflect Kotlin)
```

The CI drift check runs on every PR that touches `design-system/**` or `figma/**`. It will block merge if `figma/variables.json` diverges from the Kotlin constants. See `TOKEN-SYNC.md` for the full rule.
