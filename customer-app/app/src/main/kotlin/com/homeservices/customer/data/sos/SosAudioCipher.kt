package com.homeservices.customer.data.sos

import java.security.SecureRandom
import java.util.Base64
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.spec.GCMParameterSpec
import javax.inject.Inject

public data class EncryptedBlob(
    public val ciphertext: ByteArray,
    public val keyB64: String,
    public val ivB64: String,
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is EncryptedBlob) return false
        return ciphertext.contentEquals(other.ciphertext) && keyB64 == other.keyB64 && ivB64 == other.ivB64
    }

    override fun hashCode(): Int = 31 * ciphertext.contentHashCode() + keyB64.hashCode() + ivB64.hashCode()
}

public class SosAudioCipher
    @Inject
    constructor() {
        private val random = SecureRandom()
        private val encoder = Base64.getEncoder()

        private companion object {
            const val AES_KEY_BITS = 256
            const val GCM_IV_BYTES = 12
            const val GCM_TAG_BITS = 128
        }

        public fun encrypt(plaintext: ByteArray): EncryptedBlob {
            val key = KeyGenerator.getInstance("AES").apply { init(AES_KEY_BITS) }.generateKey()
            val iv = ByteArray(GCM_IV_BYTES).also { random.nextBytes(it) }

            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(Cipher.ENCRYPT_MODE, key, GCMParameterSpec(GCM_TAG_BITS, iv))
            val ciphertext = cipher.doFinal(plaintext)

            return EncryptedBlob(
                ciphertext = ciphertext,
                keyB64 = encoder.encodeToString(key.encoded),
                ivB64 = encoder.encodeToString(iv),
            )
        }
    }
