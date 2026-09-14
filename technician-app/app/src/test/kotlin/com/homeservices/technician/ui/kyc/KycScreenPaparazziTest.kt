package com.homeservices.technician.ui.kyc

import android.net.Uri
import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import com.homeservices.technician.domain.kyc.model.KycStatus
import org.junit.Rule
import org.junit.Test

public class KycScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi =
        Paparazzi(
            deviceConfig = DeviceConfig.PIXEL_5,
            theme = "android:Theme.Material3.DayNight.NoActionBar",
        )

    @Test
    public fun snapshot_step1_aadhaar(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                KycStepAadhaar(onStartKyc = {}, onSkip = {})
            }
        }
    }

    @Test
    public fun snapshot_step2_pan_no_selection(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                KycPanContent(selectedUri = null, onChoosePhoto = {}, onSubmit = {}, aadhaarVerified = true)
            }
        }
    }

    @Test
    public fun snapshot_step2_pan_selected(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                KycPanContent(
                    selectedUri = Uri.parse("content://media/external/images/media/1"),
                    onChoosePhoto = {},
                    onSubmit = {},
                    aadhaarVerified = true,
                )
            }
        }
    }

    // Renders KycStepReview's non-error ("Current status: <status>") branch. NOT a "complete"
    // state — the KYC-complete render is KycStepComplete(), covered by snapshot_kyc_complete_*
    // below. This argument pair (a non-null status, no error message) is unreachable from
    // KycScreen's only production call site, which always passes status = null with a non-null
    // errorMessage (the KycUiState.Error branch). Kept as a defensive component-level snapshot
    // of KycStepReview's other branch; renamed off "step3_complete" so it stops claiming a
    // PAN_DONE render means KYC is done — see E21-S05a final-review finding 4.
    @Test
    public fun snapshot_step_review_under_review_status_pan_done(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                KycStepReview(status = KycStatus.PAN_DONE, onRetry = null)
            }
        }
    }

    @Test
    public fun snapshot_step3_error(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                KycStepReview(
                    status = null,
                    onRetry = {},
                    errorMessage = "Network error during Aadhaar verification. Please try again.",
                )
            }
        }
    }

    @Test
    public fun snapshot_loading(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                KycLoadingContent(message = "Processing verification")
            }
        }
    }

    // KycUiState.PanDone: PAN verified, Aadhaar still outstanding ("one step left").

    @Test
    public fun snapshot_pan_done_light(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                KycStepPanDone(onVerifyAadhaar = {})
            }
        }
    }

    @Test
    public fun snapshot_pan_done_dark(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = true) {
                KycStepPanDone(onVerifyAadhaar = {})
            }
        }
    }

    // KycUiState.AadhaarRequired: a PAN attempt was made before Aadhaar verified; bounced back
    // to the Aadhaar step with an action-needed notice.

    @Test
    public fun snapshot_aadhaar_required_light(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                KycStepAadhaar(
                    onStartKyc = {},
                    onSkip = {},
                    noticeTitle = "Complete Aadhaar first",
                    noticeBody = "Verify your Aadhaar before uploading your PAN card.",
                )
            }
        }
    }

    @Test
    public fun snapshot_aadhaar_required_dark(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = true) {
                KycStepAadhaar(
                    onStartKyc = {},
                    onSkip = {},
                    noticeTitle = "Complete Aadhaar first",
                    noticeBody = "Verify your Aadhaar before uploading your PAN card.",
                )
            }
        }
    }

    // KycUiState.Complete: both Aadhaar and PAN verified.

    @Test
    public fun snapshot_kyc_complete_light(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                KycStepComplete()
            }
        }
    }

    @Test
    public fun snapshot_kyc_complete_dark(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = true) {
                KycStepComplete()
            }
        }
    }

    // KycUiState.ManualReview: a submitted document was flagged and a human is reviewing it.

    @Test
    public fun snapshot_manual_review_light(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                KycStepManualReview()
            }
        }
    }

    @Test
    public fun snapshot_manual_review_dark(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = true) {
                KycStepManualReview()
            }
        }
    }

    // KycUiState.ConfirmationFailed: submission succeeded but the confirming status re-read
    // failed. Active hero+card step (like KycStepPanDone), not a terminal status render.

    @Test
    public fun snapshot_confirmation_failed_light(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                KycStepConfirmationFailed(onRetry = {})
            }
        }
    }

    @Test
    public fun snapshot_confirmation_failed_dark(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = true) {
                KycStepConfirmationFailed(onRetry = {})
            }
        }
    }

    // KycPanContent(aadhaarVerified = false): renders the locked PAN control. Future-proofing
    // only — this codebase's two real call sites both pass aadhaarVerified = true by
    // construction, so no user-reachable state currently renders this. The sequential
    // Aadhaar-before-PAN gate itself is enforced in KycViewModel.terminalStateFor and is
    // covered by that class's unit tests, not by this snapshot.

    @Test
    public fun snapshot_pan_locked_light(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = false) {
                KycPanContent(
                    selectedUri = null,
                    onChoosePhoto = {},
                    onSubmit = {},
                    aadhaarVerified = false,
                )
            }
        }
    }

    @Test
    public fun snapshot_pan_locked_dark(): Unit {
        paparazzi.snapshot {
            HomeservicesTheme(darkTheme = true) {
                KycPanContent(
                    selectedUri = null,
                    onChoosePhoto = {},
                    onSubmit = {},
                    aadhaarVerified = false,
                )
            }
        }
    }
}
