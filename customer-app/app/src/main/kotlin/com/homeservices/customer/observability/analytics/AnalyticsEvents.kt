package com.homeservices.customer.observability.analytics

public object AnalyticsEvents {
    public const val AUTH_START: String = "auth_start"
    public const val AUTH_OTP_SENT: String = "auth_otp_sent"
    public const val AUTH_SUCCESS: String = "auth_success"
    public const val AUTH_FAILURE: String = "auth_failure"
    public const val CATALOGUE_VIEW: String = "catalogue_view"
    public const val SERVICE_VIEW: String = "service_view"
    public const val BOOKING_CREATE_START: String = "booking_create_start"
    public const val BOOKING_CREATE_SUCCESS: String = "booking_create_success"
    public const val PAYMENT_INITIATED: String = "payment_initiated"
    public const val PAYMENT_SUCCESS: String = "payment_success"
    public const val PAYMENT_FAILURE: String = "payment_failure"
    public const val RATING_SUBMITTED: String = "rating_submitted"
    public const val COMPLAINT_FILED: String = "complaint_filed"
}
