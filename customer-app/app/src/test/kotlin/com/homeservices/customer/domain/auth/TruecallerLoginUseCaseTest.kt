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
    public fun `emits Success when SDK calls onSuccessProfileShared`(): Unit =
        runTest {
            val profile = mockk<TrueProfile>()

            useCase.simulateSdkCallback { callback ->
                callback.onSuccessProfileShared(profile)
            }

            val result = useCase.resultFlow.first()
            assertThat(result).isInstanceOf(TruecallerAuthResult.Success::class.java)
            assertThat((result as TruecallerAuthResult.Success).profile).isSameAs(profile)
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
