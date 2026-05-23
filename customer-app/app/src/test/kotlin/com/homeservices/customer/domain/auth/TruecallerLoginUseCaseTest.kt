package com.homeservices.customer.domain.auth

import com.homeservices.customer.domain.auth.model.TruecallerAuthResult
import com.truecaller.android.sdk.common.models.TrueProfile
import com.truecaller.android.sdk.legacy.TrueError
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

public class TruecallerLoginUseCaseTest {
    private lateinit var useCase: TruecallerLoginUseCase

    @BeforeEach
    public fun setUp() {
        useCase = TruecallerLoginUseCase()
    }

    @Test
    public fun `emits Success with payload, signature, algorithm and last 4 digits when SDK calls onSuccessProfileShared`(): Unit =
        runTest {
            val profile =
                TrueProfile.Builder("Test", "").build().also {
                    it.phoneNumber = "+919876540000"
                    it.payload = "base64payload=="
                    it.signature = "base64signature=="
                    it.signatureAlgorithm = "SHA512withRSA"
                }

            useCase.simulateSdkCallback { callback ->
                callback.onSuccessProfileShared(profile)
            }

            val result = useCase.resultFlow.first()
            assertThat(result).isInstanceOf(TruecallerAuthResult.Success::class.java)
            val success = result as TruecallerAuthResult.Success
            assertThat(success.phoneLastFour).isEqualTo("0000")
            assertThat(success.payload).isEqualTo("base64payload==")
            assertThat(success.signature).isEqualTo("base64signature==")
            assertThat(success.signatureAlgorithm).isEqualTo("SHA512withRSA")
        }

    @Test
    public fun `emits Success with empty strings for payload and signature when SDK provides null values`(): Unit =
        runTest {
            val profile =
                TrueProfile.Builder("Test", "").build().also {
                    it.phoneNumber = "+919876541111"
                    // payload, signature, signatureAlgorithm not set — will be null from SDK
                }

            useCase.simulateSdkCallback { callback ->
                callback.onSuccessProfileShared(profile)
            }

            val result = useCase.resultFlow.first()
            assertThat(result).isInstanceOf(TruecallerAuthResult.Success::class.java)
            val success = result as TruecallerAuthResult.Success
            assertThat(success.phoneLastFour).isEqualTo("1111")
            // Null-safe: empty string fallback ensures downstream code is not null-unsafe
            assertThat(success.payload).isNotNull()
            assertThat(success.signature).isNotNull()
            assertThat(success.signatureAlgorithm).isNotNull()
        }

    @Test
    public fun `emits Cancelled when SDK calls onVerificationRequired`(): Unit =
        runTest {
            useCase.simulateSdkCallback { callback ->
                callback.onVerificationRequired(null)
            }

            val result = useCase.resultFlow.first()
            assertThat(result).isEqualTo(TruecallerAuthResult.Cancelled)
        }

    @Test
    public fun `emits Failure with errorType when SDK calls onFailureProfileShared`(): Unit =
        runTest {
            val trueError =
                mockk<TrueError> {
                    every { errorType } returns 404
                }

            useCase.simulateSdkCallback { callback ->
                callback.onFailureProfileShared(trueError)
            }

            val result = useCase.resultFlow.first()
            assertThat(result).isInstanceOf(TruecallerAuthResult.Failure::class.java)
            assertThat((result as TruecallerAuthResult.Failure).errorType).isEqualTo(404)
        }
}
