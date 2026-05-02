#!/usr/bin/env bash
# Bootstrap Azure Static Web Apps deployment for admin-web (idempotent).
#
# What it does:
#   1. Creates the Static Web App resource if it doesn't exist (Free SKU).
#   2. Pulls the deployment token + default hostname.
#   3. Sets the required GitHub Actions secrets + variable on this repo.
#   4. Generates a JWT_SECRET and pushes it to SWA app settings — only if
#      one isn't already set (never rotates an existing secret silently).
#
# Prerequisites:
#   - Azure CLI logged in (az login) with the right subscription set.
#   - GitHub CLI logged in (gh auth login) with admin on this repo.
#   - Firebase web-app config exported to a local JSON file with shape:
#       {
#         "apiKey":      "AIza...",
#         "authDomain":  "homeservices.firebaseapp.com",
#         "projectId":   "homeservices"
#       }
#     Get this from Firebase Console → Project settings → Your apps → Web → Config.
#
# Usage:
#   bash tools/bootstrap-admin-web-deploy.sh <firebase-web-config.json>
#
# Re-runs are safe: existing resources/settings are reused; existing
# JWT_SECRET is preserved (rotate manually with `--rotate-jwt` if needed).

set -euo pipefail

FIREBASE_CONFIG_PATH="${1:-}"
ROTATE_JWT="${ROTATE_JWT:-false}"

if [[ -z "$FIREBASE_CONFIG_PATH" ]]; then
  echo "Usage: $0 <firebase-web-config.json>" >&2
  echo "Set ROTATE_JWT=true to force-rotate the SWA JWT_SECRET." >&2
  exit 2
fi
if [[ ! -f "$FIREBASE_CONFIG_PATH" ]]; then
  echo "Firebase config file not found: $FIREBASE_CONFIG_PATH" >&2
  exit 2
fi

# --- config ---
RG="rg-homeservices-prod"
SWA_NAME="swa-homeservices-admin-prod"
# SWA Free is restricted to: westus2, centralus, eastus2, westeurope, eastasia.
# centralindia is NOT available for Microsoft.Web/staticSites. eastasia (Hong Kong)
# is the closest option to Bengaluru — ~140 ms RTT vs ~250 ms from westeurope.
SWA_LOCATION="${SWA_LOCATION:-eastasia}"

# --- preflight ---
command -v az >/dev/null || { echo "az CLI not found" >&2; exit 1; }
command -v gh >/dev/null || { echo "gh CLI not found" >&2; exit 1; }
command -v jq >/dev/null || { echo "jq not found" >&2; exit 1; }

az account show >/dev/null 2>&1 || { echo "az not logged in — run 'az login'" >&2; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "gh not logged in — run 'gh auth login'" >&2; exit 1; }

FB_API_KEY="$(jq -er '.apiKey' "$FIREBASE_CONFIG_PATH")"
FB_AUTH_DOMAIN="$(jq -er '.authDomain' "$FIREBASE_CONFIG_PATH")"
FB_PROJECT_ID="$(jq -er '.projectId' "$FIREBASE_CONFIG_PATH")"

echo "==> Subscription: $(az account show --query 'name' -o tsv)"
echo "==> GH repo:      $(gh repo view --json nameWithOwner -q .nameWithOwner)"
echo

# --- 1. resource group (create if missing) ---
if az group show --name "$RG" >/dev/null 2>&1; then
  echo "[1/5] Resource group '$RG' already exists — reusing."
else
  echo "[1/5] Creating resource group '$RG' in $SWA_LOCATION..."
  az group create --name "$RG" --location "$SWA_LOCATION" --output none
fi

# --- 2. SWA resource (create if missing) ---
if az staticwebapp show --name "$SWA_NAME" --resource-group "$RG" >/dev/null 2>&1; then
  echo "[2/5] SWA '$SWA_NAME' already exists — reusing."
else
  echo "[2/5] Creating SWA '$SWA_NAME' in $RG ($SWA_LOCATION, Free SKU)..."
  az staticwebapp create \
    --name "$SWA_NAME" \
    --resource-group "$RG" \
    --location "$SWA_LOCATION" \
    --sku Free \
    --output none
fi

# --- 3. fetch token + hostname ---
echo "[3/5] Fetching deployment token + default hostname..."
SWA_TOKEN="$(az staticwebapp secrets list --name "$SWA_NAME" --resource-group "$RG" --query 'properties.apiKey' -o tsv)"
SWA_HOSTNAME="$(az staticwebapp show --name "$SWA_NAME" --resource-group "$RG" --query 'defaultHostname' -o tsv)"
SWA_URL="https://${SWA_HOSTNAME}"

# --- 4. GH secrets + variable ---
echo "[4/5] Setting GitHub repo secrets + variable..."
printf '%s' "$SWA_TOKEN"        | gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --body -
printf '%s' "$FB_API_KEY"       | gh secret set NEXT_PUBLIC_FIREBASE_API_KEY     --body -
printf '%s' "$FB_AUTH_DOMAIN"   | gh secret set NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN --body -
printf '%s' "$FB_PROJECT_ID"    | gh secret set NEXT_PUBLIC_FIREBASE_PROJECT_ID  --body -
gh variable set ADMIN_WEB_PUBLIC_URL --body "$SWA_URL"

# --- 5. SWA app settings (server-side runtime) ---
echo "[5/5] Configuring SWA app settings (JWT_SECRET)..."
EXISTING_JWT="$(az staticwebapp appsettings list \
  --name "$SWA_NAME" --resource-group "$RG" \
  --query "properties.JWT_SECRET" -o tsv 2>/dev/null || echo "")"

if [[ -n "$EXISTING_JWT" && "$ROTATE_JWT" != "true" ]]; then
  echo "      JWT_SECRET already set — preserving (set ROTATE_JWT=true to rotate)."
else
  if [[ -n "$EXISTING_JWT" ]]; then
    echo "      ROTATE_JWT=true — overwriting existing JWT_SECRET."
  fi
  NEW_JWT="$(openssl rand -hex 32)"
  az staticwebapp appsettings set \
    --name "$SWA_NAME" --resource-group "$RG" \
    --setting-names "JWT_SECRET=$NEW_JWT" \
    --output none
  echo "      JWT_SECRET written to SWA app settings."
fi

echo
echo "==> Done."
echo "    SWA URL:  $SWA_URL"
echo "    Trigger first deploy: gh workflow run admin-ship.yml"
