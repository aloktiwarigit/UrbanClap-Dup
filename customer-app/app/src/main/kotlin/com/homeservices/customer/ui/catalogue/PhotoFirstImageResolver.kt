package com.homeservices.customer.ui.catalogue

/**
 * E16-S03 — Shared helper used by [PhotoFirstCategoryCard] and [PhotoFirstServiceCard]
 * to decide whether to attempt a CDN image load.
 *
 * A blank URL means the API has not yet populated a hero photo for this item.
 * In that case the cards short-circuit to their text/icon fallback rather than
 * issuing a doomed Coil request.
 */
internal fun shouldRenderCdnImage(imageUrl: String): Boolean = imageUrl.isNotBlank()
