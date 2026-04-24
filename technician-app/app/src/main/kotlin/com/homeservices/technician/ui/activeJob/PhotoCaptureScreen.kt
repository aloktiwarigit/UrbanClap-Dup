package com.homeservices.technician.ui.activeJob

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.LocalLifecycleOwner
import java.io.File
import java.util.concurrent.Executors

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
                Text("No back camera available on this device", color = Color.White)
                TextButton(onClick = onDismiss) { Text("Go back", color = Color.White) }
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
                modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 48.dp),
            ) { Text("Capture") }

            TextButton(
                onClick = onDismiss,
                modifier = Modifier.align(Alignment.BottomStart).padding(16.dp),
            ) { Text("Cancel", color = Color.White) }
        } else {
            Text(
                text = "Photo captured",
                style = MaterialTheme.typography.bodyLarge,
                color = Color.White,
                modifier = Modifier.align(Alignment.TopCenter).padding(top = 48.dp),
            )

            if (uploadError != null) {
                Column(
                    modifier = Modifier.align(Alignment.Center).padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Text("Upload failed: $uploadError", color = MaterialTheme.colorScheme.error)
                    Button(onClick = onRetry) { Text("Retry Upload") }
                    TextButton(onClick = {
                        capturedPath = null
                        onRetake()
                    }) {
                        Text("Retake Photo", color = Color.White)
                    }
                }
            } else {
                Row(
                    modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 48.dp),
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    OutlinedButton(onClick = { capturedPath = null }) {
                        Text("Retake", color = Color.White)
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
                            Text("Confirm & Upload")
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
        Text("Camera permission required", color = Color.White)
        Button(onClick = onRequest) { Text("Grant Permission") }
        TextButton(onClick = onDismiss) { Text("Cancel", color = Color.White) }
    }
}

private fun stagePrompt(stage: String): String =
    when (stage) {
        "EN_ROUTE" -> "Starting Trip — Take a photo of your transport"
        "REACHED" -> "Arrived — Take a photo of the site"
        "IN_PROGRESS" -> "Starting Work — Take a photo of the work area"
        "COMPLETED" -> "Completing — Take a photo of the finished work"
        else -> "Take a photo to continue"
    }
