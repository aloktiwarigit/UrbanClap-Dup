import { getStorage } from 'firebase-admin/storage';

export async function getStorageDownloadUrl(storagePath: string): Promise<string> {
  const bucket = getStorage().bucket();
  const file = bucket.file(storagePath);
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 15 * 60 * 1000, // 15 min
  });
  return url;
}

export async function checkStorageFileExists(storagePath: string): Promise<boolean> {
  const [exists] = await getStorage().bucket().file(storagePath).exists();
  return exists;
}

export async function uploadBufferToStorage(
  storagePath: string,
  buffer: Buffer,
  contentType: string,
): Promise<void> {
  await getStorage().bucket().file(storagePath).save(buffer, { contentType, resumable: false });
}

export async function downloadStorageFile(storagePath: string): Promise<Buffer> {
  const [contents] = await getStorage().bucket().file(storagePath).download();
  return contents;
}
