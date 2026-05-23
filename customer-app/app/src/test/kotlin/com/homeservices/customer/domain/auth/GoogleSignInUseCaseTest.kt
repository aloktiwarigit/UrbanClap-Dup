package com.homeservices.customer.domain.auth

import androidx.fragment.app.FragmentActivity
import com.homeservices.customer.domain.auth.gateway.GoogleCredentialProvider
import com.homeservices.customer.domain.auth.model.GoogleSignInResult
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

public class GoogleSignInUseCaseTest {
    private lateinit var provider: GoogleCredentialProvider
    private lateinit var activity: FragmentActivity
    private lateinit var sut: GoogleSignInUseCase

    @BeforeEach
    public fun setUp(): Unit {
        provider = mockk()
        activity = mockk(relaxed = true)
        sut = GoogleSignInUseCase(provider)
    }

    @Test
    public fun `getCredential — provider returns Cancelled — returns Cancelled`(): Unit =
        runTest {
            coEvery { provider.getCredential(activity) } returns GoogleSignInResult.Cancelled

            val result = sut.getCredential(activity)

            assertThat(result).isEqualTo(GoogleSignInResult.Cancelled)
        }

    @Test
    public fun `getCredential — provider returns Unavailable — returns Unavailable`(): Unit =
        runTest {
            coEvery { provider.getCredential(activity) } returns GoogleSignInResult.Unavailable

            val result = sut.getCredential(activity)

            assertThat(result).isEqualTo(GoogleSignInResult.Unavailable)
        }

    @Test
    public fun `getCredential — provider returns Error — returns Error with cause`(): Unit =
        runTest {
            val cause = RuntimeException("unexpected")
            coEvery { provider.getCredential(activity) } returns GoogleSignInResult.Error(cause)

            val result = sut.getCredential(activity)

            assertThat(result).isInstanceOf(GoogleSignInResult.Error::class.java)
            assertThat((result as GoogleSignInResult.Error).cause).isEqualTo(cause)
        }
}
