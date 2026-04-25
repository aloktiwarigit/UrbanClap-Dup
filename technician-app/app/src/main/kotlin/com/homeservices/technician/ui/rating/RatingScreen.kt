package com.homeservices.technician.ui.rating

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.homeservices.technician.domain.rating.model.CustomerRating
import com.homeservices.technician.domain.rating.model.RatingSnapshot
import com.homeservices.technician.domain.rating.model.SideState
import com.homeservices.technician.domain.rating.model.TechRating

@Composable
public fun RatingScreen(
    modifier: Modifier = Modifier,
    viewModel: RatingViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsState()
    val overall by viewModel.overall.collectAsState()
    val behav by viewModel.behaviour.collectAsState()
    val comm by viewModel.communication.collectAsState()
    val comment by viewModel.comment.collectAsState()
    val canSubmit by viewModel.canSubmit.collectAsState()

    Column(modifier = modifier.fillMaxSize().padding(16.dp)) {
        when (val current = state) {
            is RatingUiState.Loading, is RatingUiState.Submitting ->
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            is RatingUiState.AwaitingPartner -> AwaitingPartnerBody(current.snapshot)
            is RatingUiState.Revealed -> RevealedBody(current.snapshot)
            is RatingUiState.Error -> Text("Error: ${current.message}")
            is RatingUiState.Editing -> {
                Text("How was your customer?")
                Spacer(Modifier.height(8.dp))
                StarRow(label = "Overall", value = overall, onChange = viewModel::setOverall)
                StarRow(label = "Behaviour", value = behav, onChange = viewModel::setBehaviour)
                StarRow(label = "Communication", value = comm, onChange = viewModel::setCommunication)
                OutlinedTextField(
                    value = comment,
                    onValueChange = viewModel::setComment,
                    label = { Text("Comment (optional, ≤500 chars)") },
                    modifier = Modifier.padding(vertical = 8.dp),
                )
                Button(onClick = viewModel::submit, enabled = canSubmit) { Text("Submit") }
            }
        }
    }
}

@Composable
private fun AwaitingPartnerBody(snapshot: RatingSnapshot?) {
    Text("Thanks! Awaiting your customer's rating.")
    Spacer(Modifier.height(12.dp))
    val techRating = (snapshot?.techSide as? SideState.Submitted)?.rating as? TechRating
    if (techRating != null) {
        TechRatingDisplay(label = "Your rating", rating = techRating)
    }
}

@Composable
private fun RevealedBody(snapshot: RatingSnapshot) {
    Text("Both ratings revealed.")
    Spacer(Modifier.height(12.dp))
    val techRating = (snapshot.techSide as? SideState.Submitted)?.rating as? TechRating
    if (techRating != null) {
        TechRatingDisplay(label = "Your rating", rating = techRating)
        Spacer(Modifier.height(12.dp))
    }
    val customerRating = (snapshot.customerSide as? SideState.Submitted)?.rating as? CustomerRating
    if (customerRating != null) {
        CustomerRatingDisplay(label = "Customer's rating", rating = customerRating)
    }
}

@Composable
private fun TechRatingDisplay(
    label: String,
    rating: TechRating,
) {
    Text(label)
    Text("Overall: ${rating.overall} ★")
    Text("Behaviour: ${rating.subScores.behaviour} ★")
    Text("Communication: ${rating.subScores.communication} ★")
    rating.comment?.takeIf { it.isNotBlank() }?.let { Text("Comment: $it") }
}

@Composable
private fun CustomerRatingDisplay(
    label: String,
    rating: CustomerRating,
) {
    Text(label)
    Text("Overall: ${rating.overall} ★")
    Text("Punctuality: ${rating.subScores.punctuality} ★")
    Text("Skill: ${rating.subScores.skill} ★")
    Text("Behaviour: ${rating.subScores.behaviour} ★")
    rating.comment?.takeIf { it.isNotBlank() }?.let { Text("Comment: $it") }
}

@Composable
private fun StarRow(
    label: String,
    value: Int,
    onChange: (Int) -> Unit,
) {
    Row(modifier = Modifier.padding(vertical = 4.dp)) {
        Text("$label: ", modifier = Modifier.padding(end = 8.dp))
        for (i in 1..5) {
            Text(
                text = if (i <= value) "★" else "☆",
                modifier =
                    Modifier
                        .padding(horizontal = 2.dp)
                        .clickable(onClickLabel = "rate") { onChange(i) },
            )
        }
    }
}
