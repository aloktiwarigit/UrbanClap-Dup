package com.homeservices.technician.domain.auth

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class PhoneNumberNormalizerTest {
    @Test
    public fun `already E164 is returned as-is`() {
        assertThat(PhoneNumberNormalizer.normalize("+919876543210")).isEqualTo("+919876543210")
    }

    @Test
    public fun `international E164 non-India is returned as-is`() {
        assertThat(PhoneNumberNormalizer.normalize("+12125551234")).isEqualTo("+12125551234")
    }

    @Test
    public fun `10-digit Indian mobile is normalized to E164`() {
        assertThat(PhoneNumberNormalizer.normalize("9876543210")).isEqualTo("+919876543210")
    }

    @Test
    public fun `0-prefix 11-digit STD number is normalized`() {
        assertThat(PhoneNumberNormalizer.normalize("09876543210")).isEqualTo("+919876543210")
    }

    @Test
    public fun `91-prefix 12-digit ISD number is normalized`() {
        assertThat(PhoneNumberNormalizer.normalize("919876543210")).isEqualTo("+919876543210")
    }

    @Test
    public fun `leading and trailing whitespace is stripped before normalizing`() {
        assertThat(PhoneNumberNormalizer.normalize(" +919876543210 ")).isEqualTo("+919876543210")
    }

    @Test
    public fun `dashes and spaces within number are ignored`() {
        assertThat(PhoneNumberNormalizer.normalize("+91 98765-43210")).isEqualTo("+919876543210")
    }

    @Test
    public fun `number starting with digit 5 returns null`() {
        assertThat(PhoneNumberNormalizer.normalize("5876543210")).isNull()
    }

    @Test
    public fun `number too short returns null`() {
        assertThat(PhoneNumberNormalizer.normalize("98765432")).isNull()
    }

    @Test
    public fun `empty string returns null`() {
        assertThat(PhoneNumberNormalizer.normalize("")).isNull()
    }

    @Test
    public fun `non-numeric string returns null`() {
        assertThat(PhoneNumberNormalizer.normalize("abcdefghij")).isNull()
    }

    @Test
    public fun `0-prefix 11-digit with non-Indian first digit returns null`() {
        assertThat(PhoneNumberNormalizer.normalize("05876543210")).isNull()
    }

    @Test
    public fun `91-prefix 12-digit with non-Indian first digit returns null`() {
        assertThat(PhoneNumberNormalizer.normalize("915876543210")).isNull()
    }
}
