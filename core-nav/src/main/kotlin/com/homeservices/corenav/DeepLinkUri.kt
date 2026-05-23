package com.homeservices.corenav

import java.net.URI
import java.net.URLDecoder
import java.net.URLEncoder

/**
 * Pure builder/parser for `homeservices://action/<TYPE>?<args>` deep-link URIs.
 *
 * This object has no Android dependencies and is fully unit-testable on JVM.
 *
 * URI format:
 *   scheme:  homeservices
 *   host:    action
 *   path:    /<PendingActionType.name>
 *   query:   entityId=<entityId>&<rawArgs key=value pairs>
 *
 * All arg values are URL-encoded to handle special characters (spaces, &, =, unicode).
 */
public object DeepLinkUri {
    private const val SCHEME = "homeservices"
    private const val HOST = "action"
    private const val ENTITY_ID_KEY = "entityId"
    private const val ENCODING = "UTF-8"

    /**
     * Build a deep-link URI string from a [NotificationIntent].
     *
     * The [NotificationIntent.entityId] is always included as the `entityId` query parameter.
     * Additional [NotificationIntent.rawArgs] are appended after `entityId`.
     */
    public fun build(intent: NotificationIntent): String {
        val sb = StringBuilder()
        sb.append("$SCHEME://$HOST/${intent.type.name}")
        sb.append("?$ENTITY_ID_KEY=${encode(intent.entityId)}")
        intent.rawArgs.forEach { (key, value) ->
            sb.append("&${encode(key)}=${encode(value)}")
        }
        return sb.toString()
    }

    /**
     * Parse a deep-link URI string into a [NotificationIntent].
     *
     * Returns null if:
     * - The URI is malformed or cannot be parsed
     * - The scheme is not "homeservices"
     * - The host is not "action"
     * - The path segment does not match any [PendingActionType] value
     * - The `entityId` query parameter is missing or empty
     */
    @Suppress("ReturnCount") // guard-clause pattern: each early return handles a distinct malformed-URI case
    public fun parse(uri: String): NotificationIntent? {
        if (uri.isBlank()) return null
        return try {
            val parsed = URI(uri)
            if (parsed.scheme != SCHEME) return null
            if (parsed.host != HOST) return null

            // Path is "/<TYPE>" — strip the leading slash
            val typeName = parsed.path?.trimStart('/') ?: return null
            val type = runCatching { PendingActionType.valueOf(typeName) }.getOrNull() ?: return null

            val queryParams = parseQueryString(parsed.rawQuery ?: return null)
            val entityId = queryParams[ENTITY_ID_KEY]?.takeIf { it.isNotEmpty() } ?: return null

            // Build rawArgs from remaining params (excluding entityId)
            val rawArgs = queryParams.filterKeys { it != ENTITY_ID_KEY }

            NotificationIntent(
                type = type,
                entityId = entityId,
                rawArgs = rawArgs,
            )
        } catch (_: Exception) {
            null
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private fun encode(value: String): String = URLEncoder.encode(value, ENCODING)

    private fun decode(value: String): String = URLDecoder.decode(value, ENCODING)

    /**
     * Parse a raw query string (no leading `?`) into a map of decoded key-value pairs.
     * Handles URL-encoded keys and values.
     */
    private fun parseQueryString(rawQuery: String): Map<String, String> {
        if (rawQuery.isBlank()) return emptyMap()
        return rawQuery
            .split("&")
            .mapNotNull { pair ->
                val idx = pair.indexOf('=')
                if (idx < 0) return@mapNotNull null
                val key = decode(pair.substring(0, idx))
                val value = decode(pair.substring(idx + 1))
                key to value
            }.toMap()
    }
}
