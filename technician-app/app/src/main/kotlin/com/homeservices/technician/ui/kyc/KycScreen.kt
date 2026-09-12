package com.homeservices.technician.ui.kyc

import android.content.Context
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.browser.customtabs.CustomTabsIntent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.designsystem.components.HsPrimaryButton
import com.homeservices.designsystem.components.HsSecondaryButton
import com.homeservices.designsystem.components.HsSectionCard
import com.homeservices.designsystem.components.HsTimelineStep
import com.homeservices.designsystem.theme.HomeservicesColors
import com.homeservices.designsystem.theme.LocalHomeservicesExtendedColors
import com.homeservices.designsystem.theme.LocalHomeservicesSpacing
import com.homeservices.technician.R
import com.homeservices.technician.domain.kyc.model.KycStatus

private val KycHeroStart = HomeservicesColors.Brand.primaryHover
private val KycHeroEnd = HomeservicesColors.Brand.primary
private const val KYC_HERO_FRACTION = 0.32f
private const val KYC_FORM_FRACTION = 0.70f

@Suppress("CyclomaticComplexMethod") // sealed KycUiState branches are a flat dispatch — extracting would obscure UI flow
@Composable
internal fun KycScreen(
    onComplete: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: KycViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val retryPending by viewModel.photoUploadRetryPending.collectAsStateWithLifecycle()
    val context = LocalContext.current

    LaunchedEffect(uiState) {
        when (val state = uiState) {
            is KycUiState.AadhaarPending -> launchCustomTab(context, state.consentUrl)
            is KycUiState.Complete -> onComplete()
            is KycUiState.Idle -> Unit
            is KycUiState.Loading -> Unit
            is KycUiState.AadhaarDone -> Unit
            is KycUiState.PanReady -> Unit
            is KycUiState.PanUploading -> Unit
            is KycUiState.PanDone -> Unit
            is KycUiState.AadhaarRequired -> Unit
            is KycUiState.ManualReview -> Unit
            is KycUiState.Error -> Unit
        }
    }

    Surface(
        modifier = modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background,
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            when (val state = uiState) {
                is KycUiState.Idle -> {
                    KycStepAadhaar(
                        onStartKyc = { viewModel.startKyc() },
                        onSkip = onComplete,
                    )
                }
                is KycUiState.Loading -> KycLoadingContent(message = "Processing verification")
                is KycUiState.AadhaarPending -> KycLoadingContent(message = "Opening DigiLocker")
                is KycUiState.AadhaarDone -> {
                    // Reachable only once Aadhaar has actually verified (see
                    // KycViewModel.terminalStateFor) — aadhaarVerified is passed explicitly
                    // rather than defaulted so the PAN control's lock is driven by the
                    // observed state, not an assumption baked into KycStepPan.
                    KycStepPan(
                        selectedUri = null,
                        onUriSelected = { uri ->
                            if (uri != null) viewModel.submitPan(uri)
                        },
                        aadhaarVerified = true,
                    )
                }
                is KycUiState.PanReady -> {
                    KycStepPan(
                        selectedUri = Uri.parse(state.uploadUri),
                        onUriSelected = { uri ->
                            if (uri != null) viewModel.submitPan(uri)
                        },
                        aadhaarVerified = true,
                    )
                }
                is KycUiState.PanUploading -> KycLoadingContent(message = "Uploading PAN card")
                // Exactly one step remains and it is Aadhaar, not PAN — never render this as
                // "done" or invite another PAN upload. CTA re-enters the Aadhaar step directly.
                is KycUiState.PanDone -> {
                    KycStepPanDone(onVerifyAadhaar = { viewModel.startKyc() })
                }
                // Distinct from PanDone/AadhaarDone/Idle so a technician whose PAN is
                // pending human review is never told "pick a PAN photo" or "start KYC".
                is KycUiState.ManualReview -> KycStepManualReview()
                // The PAN attempt was refused because Aadhaar isn't verified yet (409).
                // Bounced back to the Aadhaar step with the same "complete Aadhaar first"
                // reason shown on the locked PAN control, so the message is consistent
                // wherever the technician encounters this constraint.
                is KycUiState.AadhaarRequired -> {
                    KycStepAadhaar(
                        onStartKyc = { viewModel.startKyc() },
                        onSkip = onComplete,
                        noticeTitle = stringResource(R.string.kyc_step_pan_locked_title),
                        noticeBody = stringResource(R.string.kyc_step_pan_locked_body),
                    )
                }
                // Reachable only when aadhaarVerified && panVerified — see
                // KycViewModel.terminalStateFor. The only state allowed to say KYC is done.
                is KycUiState.Complete -> KycStepComplete()
                is KycUiState.Error -> {
                    KycStepReview(
                        status = null,
                        onRetry = { viewModel.startKyc() },
                        errorMessage = state.message,
                    )
                }
            }
            if (retryPending) {
                PhotoUploadRetryBanner(
                    onRetry = viewModel::retryPhotoUpload,
                    modifier =
                        Modifier
                            .align(Alignment.TopCenter)
                            .statusBarsPadding()
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                )
            }
        }
    }
}

@Composable
private fun KycFrame(
    eyebrow: String,
    title: String,
    body: String,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    val spacing = LocalHomeservicesSpacing.current
    Box(
        modifier =
            modifier
                .fillMaxSize()
                .background(KycHeroEnd)
                .statusBarsPadding(),
    ) {
        // Hero zone — shows step badge + step title in white
        Box(
            modifier =
                Modifier
                    .fillMaxWidth()
                    .fillMaxHeight(KYC_HERO_FRACTION)
                    .drawBehind {
                        drawRect(
                            brush = Brush.verticalGradient(listOf(KycHeroStart, KycHeroEnd)),
                            size = size,
                        )
                        drawCircle(
                            color = Color.White.copy(alpha = 0.06f),
                            radius = 140.dp.toPx(),
                            center = Offset(size.width - 80.dp.toPx(), -60.dp.toPx()),
                        )
                        drawCircle(
                            color = Color.White.copy(alpha = 0.09f),
                            radius = 70.dp.toPx(),
                            center = Offset(40.dp.toPx(), size.height - 20.dp.toPx()),
                        )
                    },
            contentAlignment = Alignment.BottomStart,
        ) {
            Column(
                modifier = Modifier.padding(start = 28.dp, end = 28.dp, bottom = 28.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text(
                    text = eyebrow,
                    style = MaterialTheme.typography.labelLarge,
                    color = Color.White.copy(alpha = 0.75f),
                    modifier =
                        Modifier
                            .background(
                                color = Color.White.copy(alpha = 0.15f),
                                shape = MaterialTheme.shapes.extraLarge,
                            ).padding(horizontal = 12.dp, vertical = 4.dp),
                )
                Text(
                    text = title,
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                )
            }
        }

        // Form card — scrollable (PAN upload content can vary in height)
        Surface(
            modifier =
                Modifier
                    .fillMaxWidth()
                    .align(Alignment.BottomCenter)
                    .fillMaxHeight(KYC_FORM_FRACTION),
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
            color = Color.White,
            shadowElevation = 8.dp,
        ) {
            Column(
                modifier =
                    Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .imePadding()
                        .padding(horizontal = 24.dp)
                        .padding(top = 28.dp, bottom = 24.dp),
                verticalArrangement = Arrangement.spacedBy(spacing.space6),
            ) {
                Text(
                    text = body,
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                HsSectionCard { content() }
            }
        }
    }
}

/**
 * @param noticeTitle When paired with [noticeBody], renders a warning banner above the timeline —
 *   used for [KycUiState.AadhaarRequired], where the technician is bounced back here after a PAN
 *   attempt the server refused. `null` (the default) renders the plain first-visit step, so
 *   existing callers are unaffected.
 */
@Composable
internal fun KycStepAadhaar(
    onStartKyc: () -> Unit,
    onSkip: () -> Unit,
    modifier: Modifier = Modifier,
    noticeTitle: String? = null,
    noticeBody: String? = null,
) {
    KycFrame(
        eyebrow = "Step 1 of 2",
        title = "Verify your identity",
        body = "Complete Aadhaar verification through DigiLocker before you can receive live jobs.",
        modifier = modifier,
    ) {
        if (noticeTitle != null && noticeBody != null) {
            KycNoticeBanner(
                title = noticeTitle,
                body = noticeBody,
                tone = KycNoticeTone.ACTION_NEEDED,
            )
            Spacer(modifier = Modifier.height(20.dp))
        }
        HsTimelineStep(
            title = "DigiLocker consent",
            body = "You approve access directly with DigiLocker. We only store the verification outcome.",
        )
        Spacer(modifier = Modifier.height(16.dp))
        HsTimelineStep(
            title = "Secure profile unlock",
            body = "Verified partners can continue to PAN upload and job activation.",
        )
        Spacer(modifier = Modifier.height(24.dp))
        HsPrimaryButton(
            text = "Verify with DigiLocker",
            onClick = onStartKyc,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(modifier = Modifier.height(12.dp))
        HsSecondaryButton(
            text = "Skip for now, complete later",
            onClick = onSkip,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

/**
 * @param aadhaarVerified Gates the upload control itself. `false` renders the whole step as
 *   locked — a reason banner plus a disabled upload button, and the photo picker is never
 *   launched — so a technician can never start a PAN submission the server would refuse for
 *   want of Aadhaar. Defaults to `true`: every reachable caller today only shows this step once
 *   Aadhaar has verified (see [KycScreen]'s `AadhaarDone`/`PanReady` branches), so the default
 *   preserves that behaviour; the parameter exists so the control enforces the invariant itself
 *   rather than relying solely on the caller never getting it wrong.
 */
@Composable
internal fun KycStepPan(
    selectedUri: Uri?,
    onUriSelected: (Uri?) -> Unit,
    modifier: Modifier = Modifier,
    aadhaarVerified: Boolean = true,
) {
    val launcher =
        rememberLauncherForActivityResult(
            contract = ActivityResultContracts.GetContent(),
            onResult = { uri -> onUriSelected(uri) },
        )

    KycPanContent(
        selectedUri = selectedUri,
        onChoosePhoto = { launcher.launch("image/*") },
        onSubmit = { onUriSelected(selectedUri) },
        modifier = modifier,
        aadhaarVerified = aadhaarVerified,
    )
}

@Composable
internal fun KycPanContent(
    selectedUri: Uri?,
    onChoosePhoto: () -> Unit,
    onSubmit: () -> Unit,
    modifier: Modifier = Modifier,
    aadhaarVerified: Boolean = true,
) {
    KycFrame(
        eyebrow = "Step 2 of 2",
        title = "Upload PAN card",
        body = "Add a clear PAN card image so finance can approve payouts and tax records.",
        modifier = modifier,
    ) {
        if (!aadhaarVerified) {
            KycNoticeBanner(
                title = stringResource(R.string.kyc_step_pan_locked_title),
                body = stringResource(R.string.kyc_step_pan_locked_body),
                tone = KycNoticeTone.LOCKED,
            )
            Spacer(modifier = Modifier.height(20.dp))
            HsPrimaryButton(
                text = "Upload PAN card photo",
                onClick = onChoosePhoto,
                enabled = false,
                modifier = Modifier.fillMaxWidth(),
            )
            return@KycFrame
        }
        HsTimelineStep(
            title = "Photo quality",
            body = "Keep all corners visible, avoid glare, and make sure the PAN number is readable.",
        )
        Spacer(modifier = Modifier.height(16.dp))
        HsTimelineStep(
            title = "Review",
            body = "Most document checks complete quickly after submission.",
        )
        Spacer(modifier = Modifier.height(24.dp))
        HsPrimaryButton(
            text = if (selectedUri == null) "Upload PAN card photo" else "Change photo",
            onClick = onChoosePhoto,
            modifier = Modifier.fillMaxWidth(),
        )
        if (selectedUri != null) {
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = "Photo selected. Submit it for verification.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(modifier = Modifier.height(16.dp))
            HsSecondaryButton(
                text = "Submit for review",
                onClick = onSubmit,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}

/** Visual weight of [KycNoticeBanner] — kept separate from copy so the same strings can be
 * shown as a neutral default-state notice (a step that simply hasn't unlocked yet) or as a
 * stronger "your last attempt needs action" banner, without duplicating layout code.
 */
private enum class KycNoticeTone {
    LOCKED,
    ACTION_NEEDED,
}

@Composable
private fun KycNoticeBanner(
    title: String,
    body: String,
    tone: KycNoticeTone,
    modifier: Modifier = Modifier,
) {
    val containerColor =
        when (tone) {
            KycNoticeTone.LOCKED -> MaterialTheme.colorScheme.surfaceVariant
            KycNoticeTone.ACTION_NEEDED -> MaterialTheme.colorScheme.errorContainer
        }
    val contentColor =
        when (tone) {
            KycNoticeTone.LOCKED -> MaterialTheme.colorScheme.onSurfaceVariant
            KycNoticeTone.ACTION_NEEDED -> MaterialTheme.colorScheme.onErrorContainer
        }
    val icon: ImageVector =
        when (tone) {
            KycNoticeTone.LOCKED -> Icons.Filled.Lock
            KycNoticeTone.ACTION_NEEDED -> Icons.Filled.Warning
        }
    Surface(
        modifier = modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.medium,
        color = containerColor,
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.Top,
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = contentColor,
                modifier = Modifier.size(20.dp),
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                    color = contentColor,
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = body,
                    style = MaterialTheme.typography.bodySmall,
                    color = contentColor,
                )
            }
        }
    }
}

/**
 * [KycUiState.PanDone]: PAN is verified but Aadhaar is still outstanding. Deliberately keeps the
 * active hero+card step chrome (matching [KycStepAadhaar]/[KycPanContent]) rather than a terminal
 * "done" treatment — there is still one action required — and must never claim completion.
 */
@Composable
internal fun KycStepPanDone(
    onVerifyAadhaar: () -> Unit,
    modifier: Modifier = Modifier,
) {
    KycFrame(
        eyebrow = "Step 1 of 2",
        title = stringResource(R.string.kyc_pan_done_title),
        body = stringResource(R.string.kyc_pan_done_body),
        modifier = modifier,
    ) {
        HsPrimaryButton(
            text = "Verify with DigiLocker",
            onClick = onVerifyAadhaar,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

/**
 * [KycUiState.ManualReview]: a submitted document was flagged and a human is reviewing it.
 * Rendered as a passive terminal status (icon + copy, no card/CTA) so it reads as clearly
 * different from the two active steps and from [KycStepComplete] — a clock, not a checkmark.
 */
@Composable
internal fun KycStepManualReview(modifier: Modifier = Modifier) {
    KycTerminalStatus(
        icon = Icons.Filled.Schedule,
        iconTint = MaterialTheme.colorScheme.primary,
        title = "KYC under review",
        body = "Your documents are with the verification team. You will be notified once approved.",
        modifier = modifier,
    )
}

/**
 * [KycUiState.Complete]: reachable only when both Aadhaar and PAN are verified (see
 * [KycViewModel.terminalStateFor]). The only screen in this flow allowed to say KYC is finished.
 */
@Composable
internal fun KycStepComplete(modifier: Modifier = Modifier) {
    KycTerminalStatus(
        icon = Icons.Filled.Verified,
        iconTint = LocalHomeservicesExtendedColors.current.verified,
        title = stringResource(R.string.kyc_complete_title),
        body = stringResource(R.string.kyc_complete_body),
        modifier = modifier,
    )
}

/**
 * Shared centered terminal-status layout (icon-in-circle + title + body) for KYC states that
 * require no further action from the technician right now. Mirrors [KycLoadingContent]'s
 * Surface/Box/Column skeleton, swapping the spinner for a static state icon.
 */
@Composable
private fun KycTerminalStatus(
    icon: ImageVector,
    iconTint: Color,
    title: String,
    body: String,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background,
    ) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Column(
                modifier = Modifier.padding(horizontal = 32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                Surface(
                    shape = CircleShape,
                    color = iconTint.copy(alpha = 0.12f),
                    modifier = Modifier.size(64.dp),
                ) {
                    Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                        Icon(
                            imageVector = icon,
                            contentDescription = null,
                            tint = iconTint,
                            modifier = Modifier.size(32.dp),
                        )
                    }
                }
                Text(
                    text = title,
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center,
                )
                Text(
                    text = body,
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                )
            }
        }
    }
}

@Composable
internal fun KycStepReview(
    status: KycStatus?,
    onRetry: (() -> Unit)?,
    modifier: Modifier = Modifier,
    errorMessage: String? = null,
) {
    if (errorMessage != null) {
        KycFrame(
            eyebrow = "Action needed",
            title = "Verification did not complete",
            body = errorMessage,
            modifier = modifier,
        ) {
            if (onRetry != null) {
                HsPrimaryButton(
                    text = "Try again",
                    onClick = onRetry,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }
    } else {
        KycFrame(
            eyebrow = "Submitted",
            title = "KYC under review",
            body = "Your documents are with the verification team. You will be notified once approved.",
            modifier = modifier,
        ) {
            Text(
                text = "Current status",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Text(
                text = status?.name ?: "UNKNOWN",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
            )
        }
    }
}

@Composable
internal fun KycLoadingContent(
    message: String,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background,
    ) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Column(
                modifier = Modifier.padding(horizontal = 32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                CircularProgressIndicator(
                    modifier = Modifier.size(56.dp),
                    color = MaterialTheme.colorScheme.primary,
                    strokeWidth = 4.dp,
                )
                Text(
                    text = message,
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center,
                )
            }
        }
    }
}

private fun launchCustomTab(
    context: Context,
    url: String,
) {
    val intent = CustomTabsIntent.Builder().build()
    intent.launchUrl(context, Uri.parse(url))
}
