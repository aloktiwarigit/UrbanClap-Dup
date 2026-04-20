package com.homeservices.customer.ui.catalogue

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import com.homeservices.customer.R
import com.homeservices.customer.domain.catalogue.model.Service

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun ServiceListScreen(
  viewModel: ServiceListViewModel,
  onServiceClick: (String) -> Unit,
  onBack: () -> Unit,
) {
  val uiState by viewModel.uiState.collectAsStateWithLifecycle()
  Scaffold(
    topBar = {
      TopAppBar(
        title = { Text(stringResource(R.string.service_list_title)) },
        navigationIcon = {
          IconButton(onClick = onBack) {
            Icon(
              imageVector = Icons.AutoMirrored.Filled.ArrowBack,
              contentDescription = stringResource(R.string.service_detail_back_desc),
            )
          }
        },
      )
    }
  ) { innerPadding ->
    ServiceListContent(
      uiState = uiState,
      onServiceClick = onServiceClick,
      modifier = Modifier.padding(innerPadding),
    )
  }
}

@Composable
internal fun ServiceListContent(
  uiState: ServiceListUiState,
  onServiceClick: (String) -> Unit,
  modifier: Modifier = Modifier,
) {
  when (uiState) {
    is ServiceListUiState.Loading -> {
      Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator()
      }
    }
    is ServiceListUiState.Error -> {
      Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text(
          text = stringResource(R.string.catalogue_error),
          color = MaterialTheme.colorScheme.onSurface,
        )
      }
    }
    is ServiceListUiState.Success -> {
      LazyColumn(modifier = modifier.fillMaxSize().padding(8.dp)) {
        items(uiState.services) { service ->
          ServiceCard(service = service, onClick = { onServiceClick(service.id) })
        }
      }
    }
  }
}

@Composable
private fun ServiceCard(service: Service, onClick: () -> Unit) {
  Card(
    onClick = onClick,
    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
  ) {
    Column {
      AsyncImage(
        model = service.imageUrl,
        contentDescription = stringResource(R.string.service_image_desc, service.name),
        modifier = Modifier.fillMaxWidth().aspectRatio(16f / 9f),
        contentScale = ContentScale.Crop,
      )
      Column(modifier = Modifier.padding(12.dp)) {
        Text(text = service.name, style = MaterialTheme.typography.titleMedium)
        Row(verticalAlignment = Alignment.CenterVertically) {
          Text(
            text = "₹${service.basePrice / 100}",
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.Bold,
          )
          Spacer(modifier = Modifier.weight(1f))
          Text(
            text = stringResource(R.string.service_duration_label, service.durationMinutes),
            style = MaterialTheme.typography.bodySmall,
          )
        }
        Text(
          text = stringResource(R.string.service_rating_placeholder),
          style = MaterialTheme.typography.bodySmall,
          color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
      }
    }
  }
}
