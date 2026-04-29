package com.homeservices.technician

import com.homeservices.technician.data.rating.RatingReceivedEventBus
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Test

public class MainActivityNavTest {
    private val bus: RatingReceivedEventBus = mockk(relaxed = true)

    @Test
    public fun `#138 navigate_to=ratings_transparency posts to RatingReceivedEventBus`() {
        navigateFromExtra("ratings_transparency", bus)
        verify(exactly = 1) { bus.post() }
    }

    @Test
    public fun `#138 absent navigate_to extra does not trigger rating navigation`() {
        navigateFromExtra(null, bus)
        verify(exactly = 0) { bus.post() }
    }

    @Test
    public fun `#138 unknown navigate_to value does not trigger rating navigation`() {
        navigateFromExtra("some_other_screen", bus)
        verify(exactly = 0) { bus.post() }
    }
}
