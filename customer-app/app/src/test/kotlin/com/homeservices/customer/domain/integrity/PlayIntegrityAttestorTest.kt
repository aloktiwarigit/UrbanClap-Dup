package com.homeservices.customer.domain.integrity

import android.content.Context
import com.google.android.play.core.integrity.IntegrityManager
import com.google.android.play.core.integrity.IntegrityTokenRequest
import com.google.android.play.core.integrity.IntegrityTokenResponse
import com.google.android.gms.tasks.Tasks
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.unmockkStatic
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

public class PlayIntegrityAttestorTest {

    private val context: Context = mockk(relaxed = true)
    private val manager: IntegrityManager = mockk()

    @BeforeEach
    public fun setUp() {
        mockkStatic("com.google.android.play.core.integrity.IntegrityManagerFactory")
        every {
            com.google.android.play.core.integrity.IntegrityManagerFactory.create(context)
        } returns manager
    }

    @AfterEach
    public fun tearDown() {
        unmockkStatic("com.google.android.play.core.integrity.IntegrityManagerFactory")
    }

    @Test
    public fun `attest — success path — returns Result success with token`(): Unit =
        runTest {
            val fakeToken = "fake-integrity-token"
            val response: IntegrityTokenResponse = mockk {
                every { token() } returns fakeToken
            }
            every {
                manager.requestIntegrityToken(any<IntegrityTokenRequest>())
            } returns Tasks.forResult(response)

            val sut = PlayIntegrityAttestor(context)
            val result = sut.attest("test-nonce")

            assertThat(result.isSuccess).isTrue()
            assertThat(result.getOrThrow()).isEqualTo(fakeToken)
        }

    @Test
    public fun `attest — failure path — returns Result failure`(): Unit =
        runTest {
            val exception = RuntimeException("Play Integrity not available")
            every {
                manager.requestIntegrityToken(any<IntegrityTokenRequest>())
            } returns Tasks.forException(exception)

            val sut = PlayIntegrityAttestor(context)
            val result = sut.attest("test-nonce")

            assertThat(result.isFailure).isTrue()
            assertThat(result.exceptionOrNull()).isEqualTo(exception)
        }

    @Test
    public fun `attest — debug bypass — returns Result success with debug-bypass token`(): Unit =
        runTest {
            // In a real debug build, BuildConfig.DEBUG would be true.
            // PlayIntegrityAttestor.attest() short-circuits to "debug-bypass" when
            // the instance is constructed with debugBypass=true (injected via Hilt in debug).
            // We test the bypass path directly by constructing with that flag.
            val sut = PlayIntegrityAttestor(context, debugBypass = true)
            val result = sut.attest("any-nonce")

            assertThat(result.isSuccess).isTrue()
            assertThat(result.getOrThrow()).isEqualTo("debug-bypass")
        }
}
