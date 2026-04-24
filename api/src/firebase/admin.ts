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
