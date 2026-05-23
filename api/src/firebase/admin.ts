import { getStorage } from 'firebase-admin/storage';
import { getFirebaseAdmin } from '../services/firebaseAdmin.js';

function defaultBucket() {
  return getStorage(getFirebaseAdmin()).bucket();
}

export async function getStorageDownloadUrl(storagePath: string): Promise<string> {
  return getStorageDownloadUrlWithTtl(storagePath, 900);
}

export async function getStorageDownloadUrlWithTtl(
  storagePath: string,
  ttlSeconds: number,
): Promise<string> {
  const bucket = defaultBucket();
  const file = bucket.file(storagePath);
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + ttlSeconds * 1000,
  });
  return url;
}

export async function checkStorageFileExists(storagePath: string): Promise<boolean> {
  const [exists] = await defaultBucket().file(storagePath).exists();
  return exists;
}

export async function uploadBufferToStorage(
  storagePath: string,
  buffer: Buffer,
  contentType: string,
): Promise<void> {
  await defaultBucket().file(storagePath).save(buffer, { contentType, resumable: false });
}

export async function downloadStorageFile(storagePath: string): Promise<Buffer> {
  const [contents] = await defaultBucket().file(storagePath).download();
  return contents;
}
