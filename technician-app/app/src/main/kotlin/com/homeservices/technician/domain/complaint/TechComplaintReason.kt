package com.homeservices.technician.domain.complaint

public enum class TechComplaintReason(
    public val code: String,
    public val labelHindi: String,
) {
    CUSTOMER_MISCONDUCT("CUSTOMER_MISCONDUCT", "ग्राहक ने बुरा व्यवहार किया"),
    LATE_PAYMENT("LATE_PAYMENT", "पेमेंट नहीं मिली"),
    SAFETY_CONCERN("SAFETY_CONCERN", "सुरक्षा की समस्या थी"),
    OTHER("OTHER", "अन्य"),
}
