package com.homeservices.customer.ui.catalogue

import com.homeservices.designsystem.format.formatRupees

/**
 * M-9 (final review fix wave) — shared helper used by [ServiceDetailScreen] and [ServiceListScreen]
 * to render a paise price as a rupee string. Was an identical private one-liner duplicated in both
 * files, both delegating to [formatRupees]. CatalogueHomeScreen.kt already deleted its own copy —
 * that screen builds its price label at the call site via `stringResource` instead — so this is the
 * one place the two remaining screens now share it from.
 */
internal fun formatPrice(pricePaise: Int): String = formatRupees(pricePaise)
