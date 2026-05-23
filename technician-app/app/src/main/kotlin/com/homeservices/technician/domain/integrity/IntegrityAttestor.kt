package com.homeservices.technician.domain.integrity

public interface IntegrityAttestor {
    public suspend fun attest(nonce: String): Result<String>
}
