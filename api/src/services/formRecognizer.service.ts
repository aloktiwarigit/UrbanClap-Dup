import { DocumentAnalysisClient, AzureKeyCredential } from '@azure/ai-form-recognizer';
import { getStorageDownloadUrl } from '../firebase/admin.js';
import { maskPan, hashPan } from './pan.utils.js';

type OcrResult =
  | { status: 'PAN_DONE'; panMaskedNumber: string; panHash: string }
  | { status: 'MANUAL_REVIEW'; panMaskedNumber: null; panHash: null };

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
    const poller = await client.beginAnalyzeDocumentFromUrl('prebuilt-idDocument', downloadUrl);
    const result = await poller.pollUntilDone();
    const docNumber = result.documents?.[0]?.fields?.['DocumentNumber']?.content;
    if (docNumber) {
      const panMaskedNumber = maskPan(docNumber);
      if (!panMaskedNumber) {
        // Non-canonical format — route to manual review; raw discarded
        return { status: 'MANUAL_REVIEW', panMaskedNumber: null, panHash: null };
      }
      const panHash = hashPan(docNumber);
      return { status: 'PAN_DONE', panMaskedNumber, panHash };
    }
    return { status: 'MANUAL_REVIEW', panMaskedNumber: null, panHash: null };
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    if (statusCode === 429) {
      return { status: 'MANUAL_REVIEW', panMaskedNumber: null, panHash: null };
    }
    throw err;
  }
}
