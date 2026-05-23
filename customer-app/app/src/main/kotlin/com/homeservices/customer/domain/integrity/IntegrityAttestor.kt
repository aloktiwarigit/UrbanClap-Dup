package com.homeservices.customer.domain.integrity

public interface IntegrityAttestor {
    public suspend fun attest(nonce: String): Result<String>
}
