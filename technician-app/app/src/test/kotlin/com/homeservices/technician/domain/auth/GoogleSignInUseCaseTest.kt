package com.homeservices.technician.domain.auth

import android.content.Context
import androidx.credentials.CredentialManager
import androidx.fragment.app.FragmentActivity
import com.homeservices.technician.domain.auth.model.GoogleSignInResult
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class GoogleSignInUseCaseTest {
    private val credentialManager: CredentialManager = mockk()
    private val context: Context = mockk()
    private val useCase = GoogleSignInUseCase(credentialManager, context)

    @Test
    public fun `getCredential returns Error with IllegalStateException when webClientId is blank`(): Unit =
        runTest {
            useCase.webClientId = ""
            val activity = mockk<FragmentActivity>(relaxed = true)

            val result = useCase.getCredential(activity)

            assertThat(result).isInstanceOf(GoogleSignInResult.Error::class.java)
            assertThat((result as GoogleSignInResult.Error).cause)
                .isInstanceOf(IllegalStateException::class.java)
        }
}
