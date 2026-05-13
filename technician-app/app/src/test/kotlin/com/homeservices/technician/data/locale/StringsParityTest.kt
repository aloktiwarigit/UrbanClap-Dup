package com.homeservices.technician.data.locale

import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.io.File
import javax.xml.parsers.DocumentBuilderFactory

public class StringsParityTest {
    private fun keys(path: String): Set<String> {
        val file = File(path)
        if (!file.exists()) return emptySet()
        val doc = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(file)
        val nodes = doc.getElementsByTagName("string")
        return (0 until nodes.length)
            .map {
                nodes
                    .item(it)
                    .attributes
                    .getNamedItem("name")
                    .nodeValue
            }.toSet()
    }

    @Test
    public fun `values-hi strings has all keys from values strings`() {
        val en = keys("src/main/res/values/strings.xml")
        val hi = keys("src/main/res/values-hi/strings.xml")
        val missing = en - hi
        assertTrue(missing.isEmpty()) {
            "Keys in values/strings.xml missing from values-hi/strings.xml:\n${missing.sorted().joinToString("\n")}"
        }
    }
}
