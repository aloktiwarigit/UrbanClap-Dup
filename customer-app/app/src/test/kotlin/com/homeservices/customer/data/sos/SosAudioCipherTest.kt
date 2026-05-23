package com.homeservices.customer.data.sos

import com.google.common.truth.Truth.assertThat
import org.junit.jupiter.api.Test
import java.util.Base64
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

public class SosAudioCipherTest {
    private val cipher = SosAudioCipher()

    @Test
    public fun `encrypt_then_decrypt_roundtrip_matches_original_bytes`() {
        val original = "hello sos audio".toByteArray()
        val blob = cipher.encrypt(original.copyOf())

        val keyBytes = Base64.getDecoder().decode(blob.keyB64)
        val iv = Base64.getDecoder().decode(blob.ivB64)
        val secretKey = SecretKeySpec(keyBytes, "AES")
        val c = Cipher.getInstance("AES/GCM/NoPadding")
        c.init(Cipher.DECRYPT_MODE, secretKey, GCMParameterSpec(128, iv))
        val decrypted = c.doFinal(blob.ciphertext)

        assertThat(decrypted).isEqualTo(original)
    }

    @Test
    public fun `each_invocation_produces_unique_key_and_iv`() {
        val plain = ByteArray(64) { it.toByte() }
        val blob1 = cipher.encrypt(plain.copyOf())
        val blob2 = cipher.encrypt(plain.copyOf())

        assertThat(blob1.keyB64).isNotEqualTo(blob2.keyB64)
        assertThat(blob1.ivB64).isNotEqualTo(blob2.ivB64)
        assertThat(blob1.ciphertext).isNotEqualTo(blob2.ciphertext)
    }

    @Test
    public fun `ciphertext_length_equals_plaintext_length_plus_16_byte_tag`() {
        val plain = ByteArray(100) { 0xAB.toByte() }
        val blob = cipher.encrypt(plain.copyOf())

        assertThat(blob.ciphertext.size).isEqualTo(plain.size + 16)
    }
}
