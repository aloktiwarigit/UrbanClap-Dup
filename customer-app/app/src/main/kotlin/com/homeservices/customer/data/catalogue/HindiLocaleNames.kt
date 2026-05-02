package com.homeservices.customer.data.catalogue

/**
 * Client-side Hindi name lookup for catalogue entities returned by the API in English.
 * Per umbrella spec §2.2: API stores single-language English; customer-app substitutes
 * Hindi locally when current locale is `hi`. Missing entries fall back gracefully.
 * Source of truth: api/src/cosmos/seeds/catalogue.ts.
 */
public object HindiLocaleNames {
    public val categoryHindiNames: Map<String, String> = mapOf(
        "ac-repair" to "एसी मरम्मत",
        "water-pump" to "वाटर पंप / बोरवेल",
        "plumbing" to "प्लंबिंग",
        "electrical" to "इलेक्ट्रिकल",
        "water-purifier" to "आरओ / वाटर प्यूरीफायर",
    )

    public val serviceHindiNames: Map<String, String> = mapOf(
        "ac-deep-clean" to "एसी डीप क्लीन",
        "ac-gas-refill" to "एसी गैस रीफिल",
        "ac-installation" to "एसी इंस्टॉलेशन",
        "water-pump-repair" to "वाटर पंप मरम्मत",
        "borewell-servicing" to "बोरवेल सर्विसिंग",
        "plumbing-leak-fix" to "लीक मरम्मत",
        "plumbing-tap-install" to "नल / फॉसेट इंस्टॉलेशन",
        "plumbing-pipe-repair" to "पाइप मरम्मत",
        "electrical-fan-install" to "सीलिंग फैन इंस्टॉलेशन",
        "electrical-switchboard-fix" to "स्विचबोर्ड मरम्मत",
        "electrical-wiring" to "नई पॉइंट वायरिंग",
        "ro-installation" to "आरओ इंस्टॉलेशन",
        "ro-service-amc" to "आरओ सर्विस / फिल्टर बदलाव",
    )

    public val serviceShortDescriptionsHindi: Map<String, String> = mapOf(
        "ac-deep-clean" to "केमिकल वॉश, गैस चेक, फिल्टर सफाई — पूरी तरह से ₹599 में।",
        "ac-gas-refill" to "जब कूलिंग कमजोर हो, तब फुल गैस रीचार्ज।",
        "ac-installation" to "तांबे की पाइप के साथ प्रोफेशनल स्प्लिट एसी इंस्टॉलेशन।",
        "water-pump-repair" to "सरफेस + सबमर्सिबल पंप समस्या निवारण और मरम्मत — पूरी तरह से ₹699 में।",
        "borewell-servicing" to "बोरवेल पंप सर्विसिंग और रिप्लेसमेंट।",
        "plumbing-leak-fix" to "लीक का सटीक पता लगाकर रिपेयर।",
        "plumbing-tap-install" to "ब्रांडेड नल / फॉसेट का इंस्टॉलेशन।",
        "plumbing-pipe-repair" to "टूटी या लीक पाइप की मरम्मत।",
        "electrical-fan-install" to "नया सीलिंग फैन इंस्टॉल या रिप्लेसमेंट।",
        "electrical-switchboard-fix" to "स्विचबोर्ड और सॉकेट की मरम्मत।",
        "electrical-wiring" to "नए लाइट / पंखा पॉइंट के लिए वायरिंग।",
        "ro-installation" to "आरओ / वाटर प्यूरीफायर का सेटअप।",
        "ro-service-amc" to "फिल्टर बदलाव और मेंबरेन रिप्लेसमेंट।",
    )
}
