package com.homeservices.technician.di

import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class BuildInfoProvider
    @Inject
    constructor(
        public val version: String,
        public val gitSha: String,
    ) {
        public val shortSha: String
            get() = if (gitSha.length <= 8) gitSha else gitSha.substring(0, 8)
    }
