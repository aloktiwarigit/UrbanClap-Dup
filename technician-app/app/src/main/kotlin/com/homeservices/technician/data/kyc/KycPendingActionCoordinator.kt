package com.homeservices.technician.data.kyc

import android.net.Uri
import com.homeservices.corenav.PendingAction
import com.homeservices.corenav.PendingActionPriority
import com.homeservices.corenav.PendingActionStatus
import com.homeservices.corenav.PendingActionType
import com.homeservices.technician.data.pendingaction.PendingActionStore
import javax.inject.Inject

/**
 * Persists and clears the KYC-flow [PendingAction] durability markers — the
 * optimistic KYC_SUBMIT_PENDING row, the PHOTO_UPLOAD_RETRY row, and the bulk
 * clear of all three (retry / submit-pending / resume) rows on a terminal
 * outcome.
 *
 * Extracted from [com.homeservices.technician.ui.kyc.KycViewModel] — all three
 * operations wrap [PendingActionStore] with the same "skip when technicianId is
 * blank" guard and the same best-effort (never-throwing) semantics, so they form
 * one coherent responsibility that does not belong to the ViewModel's KYC state
 * machine. Purely a persistence facade: it holds no KYC domain logic, so the
 * Complete-iff-both-verified invariant lives entirely in
 * [com.homeservices.technician.ui.kyc.KycViewModel]'s `terminalStateFor` /
 * `terminalStateForOrError`, unchanged by this extraction.
 */
public class KycPendingActionCoordinator
    @Inject
    constructor(
        private val pendingActionStore: PendingActionStore,
    ) {
        /**
         * Tombstones the retry, submit-pending, and resume rows for [techId]. Call
         * once a PAN submission reaches a terminal, non-retryable outcome (a final
         * OCR success, a manual-review verdict, or an Aadhaar-required redirect).
         */
        public suspend fun clearSubmissionRows(techId: String) {
            if (techId.isBlank()) return
            runCatching { pendingActionStore.clearPhotoRetry(techId) }
            runCatching { pendingActionStore.clearKycSubmitPending(techId) }
            runCatching { pendingActionStore.clearKycResume(techId) }
        }

        /**
         * Writes an optimistic KYC_SUBMIT_PENDING row so the onboarding offline chip
         * can surface immediately if the submission is interrupted by process death
         * or network loss.
         */
        public suspend fun persistKycSubmitPending(techId: String) {
            if (techId.isBlank()) return
            val nowMs = System.currentTimeMillis()
            runCatching {
                pendingActionStore.upsert(
                    PendingAction(
                        id = "KYC_SUBMIT_PENDING:technician:$techId:kyc:$techId",
                        userId = techId,
                        role = "technician",
                        type = PendingActionType.KYC_SUBMIT_PENDING,
                        entityType = "kyc",
                        entityId = techId,
                        routeUri = "homeservices://kyc",
                        priority = PendingActionPriority.NORMAL,
                        status = PendingActionStatus.ACTIVE,
                        sourceStatus = null,
                        version = 1L,
                        createdAt = nowMs,
                        updatedAt = nowMs,
                        expiresAt = null,
                        resolvedAt = null,
                    ),
                )
            }
        }

        /**
         * Writes a PHOTO_UPLOAD_RETRY row carrying [fileUri] so the retry banner
         * surfaces after a failed upload.
         */
        public suspend fun persistPhotoUploadRetry(
            fileUri: Uri,
            techId: String,
        ) {
            if (techId.isBlank()) return
            val nowMs = System.currentTimeMillis()
            runCatching {
                pendingActionStore.upsert(
                    PendingAction(
                        id = "PHOTO_UPLOAD_RETRY:technician:$techId:kyc:$techId",
                        userId = techId,
                        role = "technician",
                        type = PendingActionType.PHOTO_UPLOAD_RETRY,
                        entityType = "kyc",
                        entityId = techId,
                        routeUri = fileUri.toString(),
                        priority = PendingActionPriority.HIGH,
                        status = PendingActionStatus.ACTIVE,
                        sourceStatus = null,
                        version = 1L,
                        createdAt = nowMs,
                        updatedAt = nowMs,
                        expiresAt = null,
                        resolvedAt = null,
                    ),
                )
            }
        }
    }
