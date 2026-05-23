package com.homeservices.customer.domain.auth

import com.homeservices.customer.domain.auth.gateway.TruecallerGateway
import com.homeservices.customer.domain.auth.model.TruecallerAuthResult
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

public class TruecallerLoginUseCaseTest {
    private lateinit var gateway: TruecallerGateway
    private lateinit var useCase: TruecallerLoginUseCase
    private lateinit var resultFlow: MutableSharedFlow<TruecallerAuthResult>

    @BeforeEach
    public fun setUp() {
        resultFlow = MutableSharedFlow(replay = 1)
        gateway = mockk(relaxed = true)
        every { gateway.resultFlow } returns resultFlow
        useCase = TruecallerLoginUseCase(gateway)
    }

    @Test
    public fun `emits Success with payload, signature, algorithm and last 4 digits when gateway emits Success`(): Unit =
        runTest {
            val success =
                TruecallerAuthResult.Success(
                    payload = "base64payload==",
                    signature = "base64signature==",
                    signatureAlgorithm = "SHA512withRSA",
                    phoneLastFour = "0000",
                )
            resultFlow.tryEmit(success)

            val result = useCase.resultFlow.first()
            assertThat(result).isInstanceOf(TruecallerAuthResult.Success::class.java)
            val s = result as TruecallerAuthResult.Success
            assertThat(s.phoneLastFour).isEqualTo("0000")
            assertThat(s.payload).isEqualTo("base64payload==")
            assertThat(s.signature).isEqualTo("base64signature==")
            assertThat(s.signatureAlgorithm).isEqualTo("SHA512withRSA")
        }

    @Test
    public fun `emits Success with empty strings for payload and signature when gateway emits null-safe values`(): Unit =
        runTest {
            val success =
                TruecallerAuthResult.Success(
                    payload = "",
                    signature = "",
                    signatureAlgorithm = "",
                    phoneLastFour = "1111",
                )
            resultFlow.tryEmit(success)

            val result = useCase.resultFlow.first()
            assertThat(result).isInstanceOf(TruecallerAuthResult.Success::class.java)
            val s = result as TruecallerAuthResult.Success
            assertThat(s.phoneLastFour).isEqualTo("1111")
            assertThat(s.payload).isNotNull()
            assertThat(s.signature).isNotNull()
            assertThat(s.signatureAlgorithm).isNotNull()
        }

    @Test
    public fun `emits Cancelled when gateway emits Cancelled`(): Unit =
        runTest {
            resultFlow.tryEmit(TruecallerAuthResult.Cancelled)

            val result = useCase.resultFlow.first()
            assertThat(result).isEqualTo(TruecallerAuthResult.Cancelled)
        }

    @Test
    public fun `emits Failure with errorType when gateway emits Failure`(): Unit =
        runTest {
            resultFlow.tryEmit(TruecallerAuthResult.Failure(errorType = 404))

            val result = useCase.resultFlow.first()
            assertThat(result).isInstanceOf(TruecallerAuthResult.Failure::class.java)
            assertThat((result as TruecallerAuthResult.Failure).errorType).isEqualTo(404)
        }
}
