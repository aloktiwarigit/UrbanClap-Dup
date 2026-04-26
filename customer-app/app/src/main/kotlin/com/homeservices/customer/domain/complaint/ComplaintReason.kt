package com.homeservices.customer.domain.complaint

public enum class ComplaintReason(
    public val code: String,
    public val labelHindi: String,
) {
    SERVICE_QUALITY("SERVICE_QUALITY", "काम ठीक नहीं हुआ"),
    LATE_ARRIVAL("LATE_ARRIVAL", "देरी से आए"),
    NO_SHOW("NO_SHOW", "आए ही नहीं"),
    TECHNICIAN_BEHAVIOUR("TECHNICIAN_BEHAVIOUR", "व्यवहार खराब था"),
    BILLING_DISPUTE("BILLING_DISPUTE", "पैसों का झगड़ा"),
    OTHER("OTHER", "अन्य"),
}
