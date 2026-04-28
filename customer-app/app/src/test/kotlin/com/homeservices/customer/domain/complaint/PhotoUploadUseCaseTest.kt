package com.homeservices.customer.domain.complaint

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.storage.FirebaseStorage
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class PhotoUploadUseCaseTest {
    private val storage: FirebaseStorage = mockk()
    private val auth: FirebaseAuth = mockk()
    private val useCase = PhotoUploadUseCase(storage, auth)

    @Test
    public fun `returns failure when no authenticated user`(): Unit =
        runTest {
            every { auth.currentUser } returns null
            val result = useCase("bk-1", "/some/local/file.jpg")
            assertThat(result.isFailure).isTrue()
            assertThat(result.exceptionOrNull()?.message).contains("No authenticated user")
        }

    @Test
    public fun `returns failure when file path does not exist`(): Unit =
        runTest {
            val user: FirebaseUser = mockk()
            every { auth.currentUser } returns user
            every { user.uid } returns "uid-1"
            val result = useCase("bk-1", "/nonexistent/path/that/does/not/exist.jpg")
            assertThat(result.isFailure).isTrue()
        }
}
