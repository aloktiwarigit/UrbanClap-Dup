# ADR-0028: SOS evidence retry is in-memory only; no durable recovery

- **Status:** Accepted
- **Date:** 2026-07-26
- **Context:** Codex review MAJOR-2 on branch `fix/p0-safety-sos-joboffer`
- **Related:** ADR-0024 (SOS audio E2E encryption), `docs/design/uiux-audit-2026.md` SAFE-SOS-006

## Context

SAFE-SOS-006 found that a failed SOS evidence upload discarded the failure reason and offered no
retry. Because `SosViewModel.maybeUploadEvidence()` deletes the recording from disk *before* the
upload starts, the bytes were unrecoverable after the first failure — safety evidence attached to a
live emergency was silently lost.

The fix retains the recording **in memory** (`PendingEvidence`) so the user can retry, and clears it
on success or when the user declines.

Codex review raised the obvious limitation: that retention does not survive the ViewModel. If the
customer leaves the tracking screen, the app is backgrounded and evicted, or the process is killed
between a failed upload and a retry, the evidence is gone with no recovery path. On a poor rural
network — the exact condition that causes the failure — this is not an unlikely sequence.

## Decision

**Accept the limitation for now. Do not persist evidence to disk to enable durable retry.**

## Rationale

The obvious durable fix — keep the file on disk until upload succeeds — is **not** safe as the code
stands, because the on-disk recording is **plaintext**:

- `SosViewModel` writes the raw recording to `filesDir/sos/sos-<bookingId>.m4a`.
- Encryption happens later and elsewhere: `SosAudioUploader.upload()` calls
  `cipher.encrypt(plaintextAudio)` (`SosAudioUploader.kt:44`) at upload time, then ships the key
  separately via `SosKeyUploadRequest` (`:70`).

So the eager `file.delete()` is not incidental — it is what bounds how long an unencrypted recording
of a customer's emergency sits on the device. Keeping it until a successful upload would leave
plaintext SOS audio on disk indefinitely whenever uploads keep failing, which is precisely the
population most at risk. That trades a **possible** loss of evidence for a **guaranteed** increase in
plaintext-at-rest exposure. Under the DPDP posture and ADR-0024's E2E-encryption intent, that is the
wrong trade to make silently in a P0 hotfix.

In-memory retention is strictly better than the previous behaviour (no retry at all) and adds no
at-rest exposure.

## Consequences

- Evidence upload can be retried only while the customer stays on the tracking screen.
- Leaving the screen, or process death, loses the recording. **The SOS itself is unaffected** — the
  alert is dispatched by `fireSos()` before any upload is attempted, so owner support is notified
  regardless. Only the supporting audio is lost.
- The failure is visible, not silent: the customer sees the real error and a retry action.

## Follow-up (not in this change)

Track as its own story, sized properly:

1. Encrypt at rest — reuse `SosAudioCipher` when the recording is first written rather than at upload
   time, so persisting it is not a privacy regression.
2. Persist the ciphertext plus its key material until upload succeeds, then wipe.
3. Retry in the background (WorkManager) so recovery does not depend on the customer remaining on
   the screen — the real fix for the rural-network case.

This is a change to the SOS crypto contract and key-handling path, so it needs its own threat-model
review. That is why it is not folded into a safety hotfix.

## Alternatives considered

- **Persist plaintext until upload succeeds.** Rejected: unbounded plaintext-at-rest for emergency
  audio.
- **Hold in memory across ViewModels via a singleton.** Rejected: still lost on process death, and
  moves emergency audio into a longer-lived scope with no clear ownership or wipe guarantee.
- **Block the customer on the tracking screen until upload completes.** Rejected: traps the user
  during an emergency, and SAFE-SOS-001 exists precisely because trapping/blocking on this surface
  is dangerous.
