package com.homeservices.technician.data.network

import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory

internal val defaultMoshi: Moshi = Moshi.Builder().addLast(KotlinJsonAdapterFactory()).build()
