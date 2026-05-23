/**
 * POST /v1/auth/truecaller/verify
 *
 * Verifies a Truecaller profile payload against Truecaller's RSA public key.
 * On successful verification, mints a Firebase custom token for the verified
 * phone number and returns it to the client.
 *
 * Called by customer-app after Truecaller SDK callback when the
 * `truecaller_server_verify_v2` GrowthBook feature flag is ON (default OFF).
 *
 * ADR-0005 Phase 2 implementation.
 */

import '../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import { createVerify } from 'node:crypto';
import { z } from 'zod';
import { getTruecallerPublicKey } from '../../services/truecaller.service.js';
import { getFirebaseAdmin } from '../../services/firebaseAdmin.js';

// ── Request schema ────────────────────────────────────────────────────────────

const TruecallerVerifyRequestSchema = z.object({
  payload: z.string().min(1),
  signature: z.string().min(1),
  signatureAlgorithm: z.string().min(1),
  fcmToken: z.string().optional(),
});

// ── Algorithm mapping ─────────────────────────────────────────────────────────

const ALGORITHM_MAP: Record<string, string> = {
  SHA512withRSA: 'RSA-SHA512',
  SHA256withRSA: 'RSA-SHA256',
  SHA384withRSA: 'RSA-SHA384',
};

function toNodeAlgorithm(javaAlgorithm: string): string {
  return ALGORITHM_MAP[javaAlgorithm] ?? javaAlgorithm;
}

// ── Signature verification ────────────────────────────────────────────────────

async function verifyTruecallerSignature(
  payload: string,       // base64-encoded payload bytes
  signature: string,     // base64-encoded signature bytes
  algorithm: string,     // e.g. "SHA512withRSA"
): Promise<boolean> {
  const publicKey = await getTruecallerPublicKey();
  const nodeAlgorithm = toNodeAlgorithm(algorithm);

  try {
    const verifier = createVerify(nodeAlgorithm);
    verifier.update(Buffer.from(payload, 'base64'));
    return verifier.verify(publicKey, Buffer.from(signature, 'base64'));
  } catch {
    // Unsupported algorithm or malformed key/signature — treat as invalid
    return false;
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function truecallerVerifyHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { status: 400, jsonBody: { code: 'INVALID_JSON' } };
  }

  const parsed = TruecallerVerifyRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: 400,
      jsonBody: {
        code: 'VALIDATION_ERROR',
        issues: parsed.error.issues.map((i) => ({
          path: i.path,
          message: i.message,
          code: i.code,
        })),
      },
    };
  }

  const { payload, signature, signatureAlgorithm } = parsed.data;

  // Verify Truecaller RSA signature
  const isValid = await verifyTruecallerSignature(payload, signature, signatureAlgorithm);
  if (!isValid) {
    return { status: 400, jsonBody: { code: 'TRUECALLER_SIGNATURE_INVALID' } };
  }

  // Decode payload to extract phone number
  let phoneNumber: string;
  try {
    const payloadJson = JSON.parse(Buffer.from(payload, 'base64').toString('utf8')) as {
      phoneNumber?: string;
    };
    if (!payloadJson.phoneNumber) {
      return { status: 400, jsonBody: { code: 'PAYLOAD_MISSING_PHONE' } };
    }
    phoneNumber = payloadJson.phoneNumber;
  } catch {
    return { status: 400, jsonBody: { code: 'PAYLOAD_DECODE_ERROR' } };
  }

  // Mint Firebase custom token
  // TODO(E11-S01b): Migrate UID from phoneNumber to stable internal user ID to
  // survive phone number format changes. For now, phoneNumber is the UID.
  // See ADR-0005 follow-up note.
  const customToken = await getFirebaseAdmin().auth().createCustomToken(phoneNumber);

  // Session expires in 1 hour (Firebase custom tokens expire in 1h by default)
  const sessionExpiresAt = Date.now() + 60 * 60 * 1000;

  return {
    status: 200,
    jsonBody: {
      firebaseCustomToken: customToken,
      sessionExpiresAt,
    },
  };
}

// ── Azure Functions registration ──────────────────────────────────────────────

app.http('truecallerVerify', {
  methods: ['POST'],
  route: 'v1/auth/truecaller/verify',
  authLevel: 'anonymous',
  handler: truecallerVerifyHandler,
});
