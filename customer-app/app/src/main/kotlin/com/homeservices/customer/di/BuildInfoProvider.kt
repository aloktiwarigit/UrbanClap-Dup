package com.homeservices.customer.di

import javax.inject.Singleton

@Singleton
public class BuildInfoProvider(
    public val version: String,
    public val gitSha: String,
) {
    public val shortSha: String
        get() = if (gitSha.length <= 8) gitSha else gitSha.substring(0, 8)
}
