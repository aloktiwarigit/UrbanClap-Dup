package com.homeservices.customer.backup

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.homeservices.customer.R
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * SEC-05: Verifies that data_extraction_rules.xml excludes the `database` and `file`
 * domains from both cloud-backup and device-transfer.
 *
 * Room DB (pending_actions.db) and internal files must not leak to cloud backup or
 * device-to-device transfers. These tests will FAIL until the XML is updated to add
 * the missing `<exclude domain="database"/>` and `<exclude domain="file"/>` entries.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [31])
public class DataExtractionRulesTest {

    @Test
    public fun `cloud-backup excludes database domain`() {
        assertExcludePresent(block = "cloud-backup", domain = "database")
    }

    @Test
    public fun `cloud-backup excludes file domain`() {
        assertExcludePresent(block = "cloud-backup", domain = "file")
    }

    @Test
    public fun `device-transfer excludes database domain`() {
        assertExcludePresent(block = "device-transfer", domain = "database")
    }

    @Test
    public fun `device-transfer excludes file domain`() {
        assertExcludePresent(block = "device-transfer", domain = "file")
    }

    private fun assertExcludePresent(block: String, domain: String) {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val parser = context.resources.getXml(R.xml.data_extraction_rules)
        val excludedDomains = mutableMapOf<String, MutableSet<String>>() // block -> set of excluded domains
        var currentBlock: String? = null
        var eventType = parser.next()
        while (eventType != org.xmlpull.v1.XmlPullParser.END_DOCUMENT) {
            when (eventType) {
                org.xmlpull.v1.XmlPullParser.START_TAG -> {
                    when (parser.name) {
                        "cloud-backup", "device-transfer" -> currentBlock = parser.name
                        "exclude" -> {
                            val domainAttr = parser.getAttributeValue(null, "domain")
                            if (currentBlock != null && domainAttr != null) {
                                excludedDomains.getOrPut(currentBlock) { mutableSetOf() }.add(domainAttr)
                            }
                        }
                    }
                }
                org.xmlpull.v1.XmlPullParser.END_TAG -> {
                    if (parser.name == currentBlock) currentBlock = null
                }
            }
            eventType = parser.next()
        }
        parser.close()
        assertThat(excludedDomains[block])
            .withFailMessage("Expected <exclude domain=\"$domain\"/> inside <$block> but found: ${excludedDomains[block]}")
            .contains(domain)
    }
}
