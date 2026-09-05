package com.homeservices.customer.ui.booking

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * The blank-key warning is a developer diagnostic. It must fire only when the app is
 * genuinely about to hand a blank key to the Razorpay SDK — never during the cash-only
 * pilot, where the key is blank by design and no payment is attempted.
 */
internal class RazorpayKeyWarningTest {
    @Test
    fun `warns when a debug build is about to open checkout with a blank key`() {
        assertTrue(shouldWarnBlankRazorpayKey(isDebugBuild = true, isAwaitingPayment = true, keyId = ""))
    }

    @Test
    fun `warns when the key is only whitespace`() {
        assertTrue(shouldWarnBlankRazorpayKey(isDebugBuild = true, isAwaitingPayment = true, keyId = "   "))
    }

    @Test
    fun `stays silent on a cash-only booking that never reaches payment`() {
        assertFalse(shouldWarnBlankRazorpayKey(isDebugBuild = true, isAwaitingPayment = false, keyId = ""))
    }

    @Test
    fun `stays silent when a key is configured`() {
        assertFalse(shouldWarnBlankRazorpayKey(isDebugBuild = true, isAwaitingPayment = true, keyId = "rzp_live_abc123"))
    }

    @Test
    fun `never surfaces to end users in a release build`() {
        assertFalse(shouldWarnBlankRazorpayKey(isDebugBuild = false, isAwaitingPayment = true, keyId = ""))
    }
}
