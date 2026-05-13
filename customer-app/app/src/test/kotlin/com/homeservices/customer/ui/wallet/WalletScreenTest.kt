package com.homeservices.customer.ui.wallet

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.customer.domain.wallet.model.LedgerEntry
import com.homeservices.customer.domain.wallet.model.LedgerEntryType
import com.homeservices.customer.domain.wallet.model.WalletBalance
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4

/**
 * Paparazzi screenshot tests for WalletScreen and WalletBalanceChip.
 *
 * @Ignore — golden recording is Linux-only due to cross-OS font antialiasing drift.
 * Record via `paparazzi-record.yml` workflow_dispatch on CI.
 * See docs/patterns/paparazzi-cross-os-goldens.md
 */
@Ignore("CI-only — record via paparazzi-record.yml")
@RunWith(JUnit4::class)
public class WalletScreenTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi(deviceConfig = DeviceConfig.PIXEL_5)

    @Test
    public fun `wallet screen loading state`(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                WalletContent(
                    balanceState = WalletBalanceUiState.Loading,
                    ledgerState = LedgerUiState.Loading,
                    onRetry = {},
                )
            }
        }
    }

    @Test
    public fun `wallet screen with balance and entries`(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                WalletContent(
                    balanceState = WalletBalanceUiState.Ready(
                        WalletBalance(balanceInPaise = 50000L, lastUpdatedAt = "2026-05-13T10:00:00Z"),
                    ),
                    ledgerState = LedgerUiState.Ready(
                        listOf(
                            LedgerEntry(
                                id = "le-1",
                                type = LedgerEntryType.CREDIT_ISSUED,
                                amountInPaise = 50000L,
                                bookingId = null,
                                reason = "Welcome bonus",
                                createdAt = "2026-05-13T10:00:00Z",
                            ),
                            LedgerEntry(
                                id = "le-2",
                                type = LedgerEntryType.CREDIT_APPLIED,
                                amountInPaise = 10000L,
                                bookingId = "bk-1",
                                reason = "Applied to booking",
                                createdAt = "2026-05-13T12:00:00Z",
                            ),
                        ),
                    ),
                    onRetry = {},
                )
            }
        }
    }

    @Test
    public fun `wallet screen error state`(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                WalletContent(
                    balanceState = WalletBalanceUiState.Error,
                    ledgerState = LedgerUiState.Error,
                    onRetry = {},
                )
            }
        }
    }

    @Test
    public fun `wallet balance chip visible when balance positive`(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                WalletBalanceChip(
                    balanceInPaise = 50000L,
                    onClick = {},
                )
            }
        }
    }
}
