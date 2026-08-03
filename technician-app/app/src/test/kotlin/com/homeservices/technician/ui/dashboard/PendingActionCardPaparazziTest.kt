package com.homeservices.technician.ui.dashboard

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.corenav.PendingAction
import com.homeservices.corenav.PendingActionPriority
import com.homeservices.corenav.PendingActionStatus
import com.homeservices.corenav.PendingActionType
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Rule
import org.junit.Test

/**
 * Paparazzi screenshot tests for [PendingActionCard].
 *
 * Goldens recorded on Linux CI via `workflow_dispatch` on paparazzi-record.yml
 * to avoid cross-OS font drift. See docs/patterns/paparazzi-cross-os-goldens.md.
 */
public class PendingActionCardPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    private fun makeAction(
        type: PendingActionType,
        priority: PendingActionPriority = PendingActionPriority.NORMAL,
    ): PendingAction =
        PendingAction(
            id = "test-${type.name}",
            userId = "tech-1",
            role = "technician",
            type = type,
            entityType = "booking",
            entityId = "bk-snap-1",
            routeUri = "homeservices://action/${type.name}?entityId=bk-snap-1",
            priority = priority,
            status = PendingActionStatus.ACTIVE,
            sourceStatus = null,
            version = 1L,
            createdAt = 1_746_000_000_000L,
            updatedAt = 1_746_000_000_000L,
            expiresAt = null,
            resolvedAt = null,
        )

    @Test
    public fun `PendingActionCard JOB_OFFER`() {
        paparazzi.snapshot {
            HomeservicesTheme {
                PendingActionCard(
                    action = makeAction(PendingActionType.JOB_OFFER, PendingActionPriority.HIGH),
                    onClick = {},
                )
            }
        }
    }

    @Test
    public fun `PendingActionCard RATING_PROMPT_TECHNICIAN`() {
        paparazzi.snapshot {
            HomeservicesTheme {
                PendingActionCard(
                    action = makeAction(PendingActionType.RATING_PROMPT_TECHNICIAN),
                    onClick = {},
                )
            }
        }
    }

    @Test
    public fun `PendingActionCard RATING_RECEIVED`() {
        paparazzi.snapshot {
            HomeservicesTheme {
                PendingActionCard(
                    action = makeAction(PendingActionType.RATING_RECEIVED),
                    onClick = {},
                )
            }
        }
    }

    @Test
    public fun `PendingActionCard EARNINGS_UPDATE`() {
        paparazzi.snapshot {
            HomeservicesTheme {
                PendingActionCard(
                    action = makeAction(PendingActionType.EARNINGS_UPDATE),
                    onClick = {},
                )
            }
        }
    }
}
