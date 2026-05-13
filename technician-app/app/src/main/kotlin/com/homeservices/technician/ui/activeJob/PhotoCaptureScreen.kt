package com.homeservices.technician.ui.activeJob

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.homeservices.technician.R
import java.io.File
import java.util.concurrent.Executors

private const val PREVIEW_TARGET_WIDTH = 1080
private const val PREVIEW_TARGET_HEIGHT = 1920

/**
 * Full-screen CameraX capture overlay shown before each active-job stage transition.
 *
 * [onPhotoTaken] fires with the absolute file path when the user confirms the photo.
 * [onDismiss] fires when the user cancels without taking a photo.
 * Upload state ([isUploading], [uploadError]) is owned by the caller (ViewModel).
 */
@Composable
internal fun PhotoCaptureScreen(
    stage: String,
    onPhotoTaken: (filePath: String) -> Unit,
    onDismiss: () -> Unit,
    isUploading: Boolean,
    uploadError: String?,
    onRetry: () -> Unit,
    onRetake: () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    var hasCameraPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) ==
                PackageManager.PERMISSION_GRANTED,
        )
    }
    val permissionLauncher =
        rememberLauncherForActivityResult(
            ActivityResultContracts.RequestPermission(),
        ) { granted -> hasCameraPermission = granted }

    LaunchedEffect(Unit) {
        if (!hasCameraPermission) permissionLauncher.launch(Manifest.permission.CAMERA)
    }

    var capturedPath by remember { mutableStateOf<String?>(null) }
    var noCameraAvailable by remember { mutableStateOf(false) }
    val imageCapture = remember { ImageCapture.Builder().build() }
    val executor = remember { Executors.newSingleThreadExecutor() }
    // Held so onDispose can unbind CameraX use cases and release the camera resource.
    var cameraProvider by remember { mutableStateOf<ProcessCameraProvider?>(null) }
    DisposableEffect(Unit) {
        onDispose {
            executor.shutdown()
            cameraProvider?.unbindAll()
        }
    }

    Box(modifier = modifier.fillMaxSize().background(Color.Black)) {
        if (!hasCameraPermission) {
            PermissionDeniedContent(
                onRequest = { permissionLauncher.launch(Manifest.permission.CAMERA) },
                onDismiss = onDismiss,
                modifier = Modifier.align(Alignment.Center),
            )
            return@Box
        }

        if (noCameraAvailable) {
            Column(
                modifier = Modifier.align(Alignment.Center).padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Text(stringResource(R.string.photo_no_back_camera), color = Color.White)
                TextButton(onClick = onDismiss) { Text(stringResource(R.string.photo_go_back), color = Color.White) }
            }
            return@Box
        }

        if (capturedPath == null) {
            AndroidView(
                factory = { ctx ->
                    PreviewView(ctx).also { pv ->
                        ProcessCameraProvider.getInstance(ctx).addListener(
                            {
                                val provider = ProcessCameraProvider.getInstance(ctx).get()
                                cameraProvider = provider
                                if (!provider.hasCamera(CameraSelector.DEFAULT_BACK_CAMERA)) {
                                    noCameraAvailable = true
                                    return@addListener
                                }
                                val preview =
                                    Preview
                                        .Builder()
                                        .build()
                                        .also { it.setSurfaceProvider(pv.surfaceProvider) }
                                provider.unbindAll()
                                provider.bindToLifecycle(
                                    lifecycleOwner,
                                    CameraSelector.DEFAULT_BACK_CAMERA,
                                    preview,
                                    imageCapture,
                                )
                            },
                            ContextCompat.getMainExecutor(ctx),
                        )
                    }
                },
                modifier = Modifier.fillMaxSize(),
            )

            Text(
                text = stagePrompt(stage),
                style = MaterialTheme.typography.titleMedium,
                color = Color.White,
                modifier =
                    Modifier
                        .align(Alignment.TopCenter)
                        .statusBarsPadding()
                        .background(Color.Black.copy(alpha = 0.55f))
                        .fillMaxWidth()
                        .padding(16.dp),
            )

            Button(
                onClick = {
                    val file =
                        File(
                            context.cacheDir,
                            "photo_${stage}_${System.currentTimeMillis()}.jpg",
                        )
                    imageCapture.takePicture(
                        ImageCapture.OutputFileOptions.Builder(file).build(),
                        ContextCompat.getMainExecutor(context),
                        object : ImageCapture.OnImageSavedCallback {
                            override fun onImageSaved(out: ImageCapture.OutputFileResults) {
                                capturedPath = file.absolutePath
                            }

                            override fun onError(exc: ImageCaptureException) { /* surfaced via uploadError on retry */ }
                        },
                    )
                },
                modifier =
                    Modifier
                        .align(Alignment.BottomCenter)
                        .navigationBarsPadding()
                        .padding(bottom = 48.dp),
            ) { Text(stringResource(R.string.photo_capture)) }

            TextButton(
                onClick = onDismiss,
                modifier =
                    Modifier
                        .align(Alignment.BottomStart)
                        .navigationBarsPadding()
                        .padding(16.dp),
            ) { Text(stringResource(R.string.photo_cancel), color = Color.White) }
        } else {
            val previewBitmap =
                remember(capturedPath) {
                    capturedPath?.let(::decodePreviewBitmap)?.asImageBitmap()
                }
            if (previewBitmap != null) {
                Image(
                    bitmap = previewBitmap,
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize(),
                )
            }

            Column(
                modifier =
                    Modifier
                        .align(Alignment.TopCenter)
                        .statusBarsPadding()
                        .background(Color.Black.copy(alpha = 0.55f))
                        .fillMaxWidth()
                        .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Text(
                    text = stagePrompt(stage),
                    style = MaterialTheme.typography.titleMedium,
                    color = Color.White,
                )
                Text(
                    text = "Photo captured",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.White,
                )
            }

            if (uploadError != null) {
                Column(
                    modifier =
                        Modifier
                            .align(Alignment.Center)
                            .background(Color.Black.copy(alpha = 0.65f))
                            .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Text(stringResource(R.string.photo_upload_failed, uploadError), color = Color.White)
                    Button(onClick = onRetry) { Text(stringResource(R.string.photo_retry_upload)) }
                    TextButton(onClick = {
                        capturedPath = null
                        onRetake()
                    }) {
                        Text(stringResource(R.string.photo_retake_photo), color = Color.White)
                    }
                }
            } else {
                Row(
                    modifier =
                        Modifier
                            .align(Alignment.BottomCenter)
                            .navigationBarsPadding()
                            .background(Color.Black.copy(alpha = 0.55f))
                            .padding(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    OutlinedButton(onClick = { capturedPath = null }) {
                        Text(stringResource(R.string.photo_retake), color = Color.White)
                    }
                    Button(
                        onClick = { capturedPath?.let(onPhotoTaken) },
                        enabled = !isUploading,
                    ) {
                        if (isUploading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                strokeWidth = 2.dp,
                                color = MaterialTheme.colorScheme.onPrimary,
                            )
                        } else {
                            Text(stringResource(R.string.photo_confirm_upload))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun PermissionDeniedContent(
    onRequest: () -> Unit,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
): Unit {
    Column(
        modifier = modifier.padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text(stringResource(R.string.photo_camera_permission_required), color = Color.White)
        Button(onClick = onRequest) { Text(stringResource(R.string.photo_grant_permission)) }
        TextButton(onClick = onDismiss) { Text(stringResource(R.string.photo_cancel), color = Color.White) }
    }
}

private fun stagePrompt(stage: String): String =
    when (stage) {
        "EN_ROUTE" -> "Starting Trip - Take a photo of your transport"
        "REACHED" -> "Arrived - Take a photo of the site"
        "IN_PROGRESS" -> "Starting Work - Take a photo of the work area"
        "COMPLETED" -> "Completing - Take a photo of the finished work"
        else -> "Take a photo to continue"
    }

private fun decodePreviewBitmap(filePath: String): Bitmap? {
    val bounds =
        BitmapFactory.Options().apply {
            inJustDecodeBounds = true
        }
    BitmapFactory.decodeFile(filePath, bounds)
    val sampleSize =
        calculateSampleSize(
            bounds.outWidth,
            bounds.outHeight,
            PREVIEW_TARGET_WIDTH,
            PREVIEW_TARGET_HEIGHT,
        )
    return BitmapFactory.decodeFile(
        filePath,
        BitmapFactory.Options().apply {
            inSampleSize = sampleSize
        },
    )
}

private fun calculateSampleSize(
    width: Int,
    height: Int,
    targetWidth: Int,
    targetHeight: Int,
): Int {
    var sampleSize = 1
    if (height > targetHeight || width > targetWidth) {
        val halfHeight = height / 2
        val halfWidth = width / 2
        while (halfHeight / sampleSize >= targetHeight && halfWidth / sampleSize >= targetWidth) {
            sampleSize *= 2
        }
    }
    return sampleSize
}
