package com.homeservices.customer.data.dataexport

import com.homeservices.customer.data.dataexport.remote.DataExportApiService
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
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
                        api.fetchDataExport().use { body -> body.bytes() }
                    },
                )
            }
    }
