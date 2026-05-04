package com.homeservices.customer.domain.auth.model

public sealed class TruecallerAuthResult {
    /**
     * Truecaller SDK callback succeeded.
     *
     * [payload], [signature], and [signatureAlgorithm] are forwarded to the
     * server-side verification endpoint when the `truecaller_server_verify_v2`
     * flag is ON (Phase 2 path — ADR-0005).
     *
     * [phoneLastFour] is retained for the anonymous sign-in fallback path
     * (Phase 1, flag OFF) and for display in the UI.
     */
    public data class Success(
        val payload: String,
        val signature: String,
        val signatureAlgorithm: String,
        val phoneLastFour: String,
    ) : TruecallerAuthResult()

    public data class Failure(
        val errorType: Int,
    ) : TruecallerAuthResult()

    public data object Cancelled : TruecallerAuthResult()
}
