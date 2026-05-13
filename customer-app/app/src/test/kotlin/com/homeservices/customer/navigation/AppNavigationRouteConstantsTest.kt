package com.homeservices.customer.navigation

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

/**
 * TDD-first: verify route string constants before implementation.
 *
 * E11-S01b-2 Part A: ROUTE_AUTH and ROUTE_MAIN must be stable string values
 * that match the existing nav-graph routes defined in AuthGraph.kt ("auth")
 * and MainGraph.kt ("main"). Any rename of the constant value would be a
 * breaking navigation regression.
 */
public class AppNavigationRouteConstantsTest {
    @Test
    public fun `ROUTE_AUTH constant equals the legacy auth nav-graph route string`() {
        assertThat(ROUTE_AUTH).isEqualTo("auth")
    }

    @Test
    public fun `ROUTE_MAIN constant equals the legacy main nav-graph route string`() {
        assertThat(ROUTE_MAIN).isEqualTo("main")
    }

    @Test
    public fun `ROUTE_AUTH and ROUTE_MAIN are distinct`() {
        assertThat(ROUTE_AUTH).isNotEqualTo(ROUTE_MAIN)
    }
}
