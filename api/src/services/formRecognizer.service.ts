import { DocumentAnalysisClient, AzureKeyCredential } from '@azure/ai-form-recognizer';
import { getStorageDownloadUrl } from '../firebase/admin.js';

type OcrResult =
  | { status: 'PAN_DONE'; panNumber: string }
  | { status: 'MANUAL_REVIEW'; panNumber: null };

export async function extractPanFromStoragePath(
  firebaseStoragePath: string
): Promise<OcrResult> {
  const endpoint = process.env['FORM_RECOGNIZER_ENDPOINT'];
  const key = process.env['FORM_RECOGNIZER_KEY'];
  if (!endpoint || !key) {
    throw new Error('FORM_RECOGNIZER_ENDPOINT and FORM_RECOGNIZER_KEY must be set');
  }

  const downloadUrl = await getStorageDownloadUrl(firebaseStoragePath);
  const client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(key));

  try {
    const poller = await client.beginAnalyzeDocument('prebuilt-idDocument', downloadUrl);
    const result = await poller.pollUntilDone();
    const docNumber = result.documents?.[0]?.fields?.['DocumentNumber']?.content;
    if (docNumber) {
      return { status: 'PAN_DONE', panNumber: docNumber };
    }
    return { status: 'MANUAL_REVIEW', panNumber: null };
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    if (statusCode === 429) {
      return { status: 'MANUAL_REVIEW', panNumber: null };
    }
    throw err;
  }
}
