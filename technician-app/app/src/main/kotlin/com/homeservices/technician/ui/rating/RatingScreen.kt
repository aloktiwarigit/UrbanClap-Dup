package com.homeservices.technician.ui.rating

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.homeservices.designsystem.components.HsPrimaryButton
import com.homeservices.designsystem.components.HsSecondaryButton
import com.homeservices.designsystem.components.HsSectionCard
import com.homeservices.designsystem.components.HsTrustBadge
import com.homeservices.technician.domain.rating.model.CustomerRating
import com.homeservices.technician.domain.rating.model.RatingSnapshot
import com.homeservices.technician.domain.rating.model.SideState
import com.homeservices.technician.domain.rating.model.TechRating

@Composable
public fun RatingScreen(
    modifier: Modifier = Modifier,
    onFileComplaint: (bookingId: String) -> Unit = {},
    viewModel: RatingViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsState()
    val overall by viewModel.overall.collectAsState()
    val behav by viewModel.behaviour.collectAsState()
    val comm by viewModel.communication.collectAsState()
    val comment by viewModel.comment.collectAsState()
    val canSubmit by viewModel.canSubmit.collectAsState()

    Surface(modifier = modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(
            modifier = Modifier.fillMaxSize().padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            when (val current = state) {
                is RatingUiState.Loading, is RatingUiState.Submitting ->
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                is RatingUiState.AwaitingPartner -> {
                    AwaitingPartnerBody(
                        snapshot = current.snapshot,
                        bookingId = viewModel.bookingId,
                        onFileComplaint = onFileComplaint,
                    )
                }
                is RatingUiState.Revealed -> {
                    RevealedBody(
                        snapshot = current.snapshot,
                        bookingId = viewModel.bookingId,
                        onFileComplaint = onFileComplaint,
                    )
                }
                is RatingUiState.Error -> StatusMessage("Could not load rating", current.message)
                is RatingUiState.Editing -> {
                    HsTrustBadge(text = "Customer feedback")
                    Text(
                        text = "Rate your customer",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        text = "Your rating helps owner support keep the service marketplace fair for professionals.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    HsSectionCard {
                        StarRow(label = "Overall", value = overall, onChange = viewModel::setOverall)
                        Spacer(Modifier.height(12.dp))
                        StarRow(label = "Behaviour", value = behav, onChange = viewModel::setBehaviour)
                        Spacer(Modifier.height(12.dp))
                        StarRow(label = "Communication", value = comm, onChange = viewModel::setCommunication)
                    }
                    OutlinedTextField(
                        value = comment,
                        onValueChange = viewModel::setComment,
                        label = { Text("Comment (optional, <=500 chars)") },
                        minLines = 3,
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Spacer(Modifier.weight(1f))
                    HsPrimaryButton(
                        text = "Submit rating",
                        onClick = viewModel::submit,
                        enabled = canSubmit,
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
            }
        }
    }
}

@Composable
private fun AwaitingPartnerBody(
    snapshot: RatingSnapshot?,
    bookingId: String,
    onFileComplaint: (String) -> Unit,
) {
    HsTrustBadge(text = "Ratings")
    StatusMessage("Rating submitted", "We will reveal both ratings after the customer responds.")
    Spacer(Modifier.height(12.dp))
    val techRating = (snapshot?.techSide as? SideState.Submitted)?.rating as? TechRating
    if (techRating != null) {
        HsSectionCard(title = "Your rating") {
            TechRatingDisplay(rating = techRating)
        }
    }
    Spacer(Modifier.height(16.dp))
    HsSecondaryButton(
        text = "Report issue",
        onClick = { onFileComplaint(bookingId) },
        modifier = Modifier.fillMaxWidth(),
    )
}

@Composable
private fun RevealedBody(
    snapshot: RatingSnapshot,
    bookingId: String,
    onFileComplaint: (String) -> Unit,
) {
    HsTrustBadge(text = "Ratings")
    StatusMessage("Ratings revealed", "Thanks for keeping the service marketplace fair.")
    Spacer(Modifier.height(12.dp))
    val techRating = (snapshot.techSide as? SideState.Submitted)?.rating as? TechRating
    if (techRating != null) {
        HsSectionCard(title = "Your rating") {
            TechRatingDisplay(rating = techRating)
        }
        Spacer(Modifier.height(12.dp))
    }
    val customerRating = (snapshot.customerSide as? SideState.Submitted)?.rating as? CustomerRating
    if (customerRating != null) {
        HsSectionCard(title = "Customer's rating") {
            CustomerRatingDisplay(rating = customerRating)
        }
    }
    Spacer(Modifier.height(16.dp))
    HsSecondaryButton(
        text = "Report issue",
        onClick = { onFileComplaint(bookingId) },
        modifier = Modifier.fillMaxWidth(),
    )
}

@Composable
private fun TechRatingDisplay(rating: TechRating) {
    Text("Overall: ${rating.overall} \u2605")
    Text("Behaviour: ${rating.subScores.behaviour} \u2605")
    Text("Communication: ${rating.subScores.communication} \u2605")
    rating.comment?.takeIf { it.isNotBlank() }?.let { Text("Comment: $it") }
}

@Composable
private fun CustomerRatingDisplay(rating: CustomerRating) {
    Text("Overall: ${rating.overall} \u2605")
    Text("Punctuality: ${rating.subScores.punctuality} \u2605")
    Text("Skill: ${rating.subScores.skill} \u2605")
    Text("Behaviour: ${rating.subScores.behaviour} \u2605")
    rating.comment?.takeIf { it.isNotBlank() }?.let { Text("Comment: $it") }
}

@Composable
private fun StatusMessage(
    title: String,
    body: String,
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Text(body, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun StarRow(
    label: String,
    value: Int,
    onChange: (Int) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(label, style = MaterialTheme.typography.labelLarge)
        Row {
            for (i in 1..5) {
                Text(
                    text = if (i <= value) "\u2605" else "\u2606",
                    style = MaterialTheme.typography.headlineSmall,
                    color = if (i <= value) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier =
                        Modifier
                            .padding(end = 6.dp)
                            .clickable(onClickLabel = "rate $i stars") { onChange(i) },
                )
            }
        }
    }
}
