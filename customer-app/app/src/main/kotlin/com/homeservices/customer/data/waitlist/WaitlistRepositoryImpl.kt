package com.homeservices.customer.data.waitlist

import com.homeservices.customer.domain.waitlist.WaitlistRepository
import com.homeservices.customer.domain.waitlist.WaitlistRequest
import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass
import retrofit2.HttpException
import retrofit2.http.Body
import retrofit2.http.POST
import java.time.Instant
import javax.inject.Inject

private const val HTTP_TOO_MANY_REQUESTS = 429

/** Thrown when the API returns HTTP 429. Carries the Retry-After value in seconds. */
public class RateLimitedException(
    public val retryAfterSec: Int,
) : Exception("Rate limited — retry after ${retryAfterSec}s")

@JsonClass(generateAdapter = true)
internal data class WaitlistRequestDto(
    @Json(name = "phone") val phone: String,
    @Json(name = "lat") val lat: Double,
    @Json(name = "lng") val lng: Double,
    @Json(name = "serviceId") val serviceId: String,
    @Json(name = "requestedAt") val requestedAt: String,
)

internal interface WaitlistApiService {
    @POST("v1/waitlist")
    suspend fun joinWaitlist(
        @Body body: WaitlistRequestDto,
    )
}

/** Default retry-after seconds when the header is absent on a 429 response. */
private const val DEFAULT_RETRY_AFTER_SEC = 60

internal class WaitlistRepositoryImpl
    @Inject
    constructor(
        private val api: WaitlistApiService,
    ) : WaitlistRepository {
        override suspend fun joinWaitlist(request: WaitlistRequest): Result<Unit> =
            runCatching {
                api.joinWaitlist(
                    WaitlistRequestDto(
                        phone = request.phone,
                        lat = request.lat,
                        lng = request.lng,
                        serviceId = request.serviceId,
                        requestedAt = Instant.now().toString(),
                    ),
                )
            }.mapFailure429()

        private fun Result<Unit>.mapFailure429(): Result<Unit> =
            recoverCatching { throwable ->
                if (throwable is HttpException && throwable.code() == HTTP_TOO_MANY_REQUESTS) {
                    val retryAfter =
                        throwable
                            .response()
                            ?.headers()
                            ?.get("Retry-After")
                            ?.toIntOrNull()
                            ?: DEFAULT_RETRY_AFTER_SEC
                    throw RateLimitedException(retryAfter)
                }
                throw throwable
            }
    }
