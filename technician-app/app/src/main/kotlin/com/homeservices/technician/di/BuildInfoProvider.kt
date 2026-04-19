package com.homeservices.technician.di

import javax.inject.Singleton

@Singleton
public class BuildInfoProvider(
    public val version: String,
    public val gitSha: String,
) {
    public val shortSha: String
        get() = if (gitSha.length <= SHORT_SHA_LENGTH) gitSha else gitSha.substring(0, SHORT_SHA_LENGTH)

    private companion object {
        const val SHORT_SHA_LENGTH: Int = 8
    }
}
