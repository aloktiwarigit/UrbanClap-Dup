package com.homeservices.customer.data.dataexport

import com.homeservices.customer.data.dataexport.remote.DataExportApiService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import javax.inject.Inject

internal class DataExportRepositoryImpl
    @Inject
    constructor(
        private val api: DataExportApiService,
    ) : DataExportRepository {
        override fun fetchExport(): Flow<Result<ByteArray>> =
            flow {
                emit(
                    runCatching {
                        // body.bytes() blocks while reading the network stream; flowOn(IO)
                        // below ensures this entire flow builder runs on a background thread,
                        // preventing an ANR on the Main dispatcher collected by viewModelScope.
                        api.fetchDataExport().use { body -> body.bytes() }
                    },
                )
            }.flowOn(Dispatchers.IO)
    }
