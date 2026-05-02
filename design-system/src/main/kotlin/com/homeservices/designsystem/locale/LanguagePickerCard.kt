package com.homeservices.designsystem.locale

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp

public data class LanguageOption(
    public val tag: String,
    public val displayLabel: String,
    public val nativeName: String,
)

public val DefaultLanguageOptions: List<LanguageOption> = listOf(
    LanguageOption(tag = "en", displayLabel = "English", nativeName = "English"),
    LanguageOption(tag = "hi", displayLabel = "Hindi", nativeName = "हिन्दी"),
)

@Composable
public fun LanguagePickerCard(
    options: List<LanguageOption>,
    selectedTag: String,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        options.forEach { option ->
            val isSelected = option.tag == selectedTag
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = if (isSelected) {
                    MaterialTheme.colorScheme.primaryContainer
                } else {
                    MaterialTheme.colorScheme.surfaceVariant
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .selectable(
                        selected = isSelected,
                        onClick = { onSelect(option.tag) },
                        role = Role.RadioButton,
                    ),
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(16.dp),
                ) {
                    RadioButton(selected = isSelected, onClick = null)
                    Column(modifier = Modifier.padding(start = 12.dp)) {
                        Text(
                            text = option.nativeName,
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.onSurface,
                        )
                        Text(
                            text = option.displayLabel,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }
        }
    }
}
