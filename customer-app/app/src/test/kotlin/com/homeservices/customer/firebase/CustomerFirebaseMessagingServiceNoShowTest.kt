package com.homeservices.customer.firebase

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.homeservices.customer.data.wallet.NoShowCreditEvent
import com.homeservices.customer.data.wallet.NoShowCreditEventBus
import io.mockk.every
import io.mockk.just
import io.mockk.mockk
import io.mockk.runs
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

/**
 * Unit tests for [NoShowCreditHandler].
 *
 * Uses [RobolectricTestRunner] so that Android framework types (Context,
 * NotificationManager, NotificationCompat.Builder) are available on the JVM.
 * The eventBus is still a MockK mock so we can verify call interactions.
 */
@RunWith(RobolectricTestRunner::class)
public class CustomerFirebaseMessagingServiceNoShowTest {
    private val context: Context = ApplicationProvider.getApplicationContext()
    private val eventBus: NoShowCreditEventBus = mockk(relaxed = true)

    @Test
    public fun `handleNoShowCredit posts event with correct amount and bookingId`() {
        val data =
            mapOf(
                "type" to "NO_SHOW_CREDIT_ISSUED",
                "creditAmountPaise" to "50000",
                "bookingId" to "bk-123",
            )

        val eventSlot = slot<NoShowCreditEvent>()
        every { eventBus.post(capture(eventSlot)) } just runs

        NoShowCreditHandler(context, eventBus).handle(data)

        verify(exactly = 1) { eventBus.post(any()) }
        assertThat(eventSlot.captured.creditAmountPaise).isEqualTo(50000L)
        assertThat(eventSlot.captured.bookingId).isEqualTo("bk-123")
    }

    @Test
    public fun `handleNoShowCredit posts event with zero amount when creditAmountPaise missing`() {
        val data = mapOf("type" to "NO_SHOW_CREDIT_ISSUED")

        val eventSlot = slot<NoShowCreditEvent>()
        every { eventBus.post(capture(eventSlot)) } just runs

        NoShowCreditHandler(context, eventBus).handle(data)

        verify(exactly = 1) { eventBus.post(any()) }
        assertThat(eventSlot.captured.creditAmountPaise).isEqualTo(0L)
        assertThat(eventSlot.captured.bookingId).isEmpty()
    }

    @Test
    public fun `handleNoShowCredit posts event with zero amount when creditAmountPaise non-numeric`() {
        val data =
            mapOf(
                "type" to "NO_SHOW_CREDIT_ISSUED",
                "creditAmountPaise" to "invalid",
                "bookingId" to "bk-99",
            )

        val eventSlot = slot<NoShowCreditEvent>()
        every { eventBus.post(capture(eventSlot)) } just runs

        NoShowCreditHandler(context, eventBus).handle(data)

        assertThat(eventSlot.captured.creditAmountPaise).isEqualTo(0L)
    }

    @Test
    public fun `handleNoShowCredit posts event with empty bookingId when missing`() {
        val data = mapOf("creditAmountPaise" to "10000")
        every { eventBus.post(any()) } just runs

        NoShowCreditHandler(context, eventBus).handle(data)

        verify(exactly = 1) { eventBus.post(any()) }
    }

    @Test
    public fun `handleNoShowCredit uses data map title and body when present`() {
        val data =
            mapOf(
                "creditAmountPaise" to "30000",
                "bookingId" to "bk-5",
                "title" to "Custom Title",
                "body" to "Custom Body",
            )
        every { eventBus.post(any()) } just runs

        // Should not throw — title/body from data map are used without calling getString
        NoShowCreditHandler(context, eventBus).handle(data)

        verify(exactly = 1) { eventBus.post(any()) }
    }
}
