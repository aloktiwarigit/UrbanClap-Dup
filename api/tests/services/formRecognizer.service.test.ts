import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DocumentAnalysisClient } from '@azure/ai-form-recognizer';

vi.mock('@azure/ai-form-recognizer', () => ({
  DocumentAnalysisClient: vi.fn(),
  AzureKeyCredential: vi.fn(),
}));

vi.mock('../../src/firebase/admin.js', () => ({
  getStorageDownloadUrl: vi.fn(),
}));

describe('formRecognizer.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env['FORM_RECOGNIZER_ENDPOINT'] = 'https://fake.cognitiveservices.azure.com/';
    process.env['FORM_RECOGNIZER_KEY'] = 'fakekey';
  });

  it('returns panNumber on successful OCR', async () => {
    const { DocumentAnalysisClient: MockClient } = await import('@azure/ai-form-recognizer');
    const { getStorageDownloadUrl } = await import('../../src/firebase/admin.js');
    vi.mocked(getStorageDownloadUrl).mockResolvedValue('https://storage.example.com/pan.jpg');
    const mockPoller = {
      pollUntilDone: vi.fn().mockResolvedValue({
        documents: [{ fields: { DocumentNumber: { content: 'ABCDE1234F', confidence: 0.99 } } }],
      }),
    };
    vi.mocked(MockClient).mockImplementation(() => ({
      beginAnalyzeDocumentFromUrl: vi.fn().mockResolvedValue(mockPoller),
    } as unknown as DocumentAnalysisClient));

    const { extractPanFromStoragePath } = await import('../../src/services/formRecognizer.service.js');
    const result = await extractPanFromStoragePath('technicians/abc/pan.jpg');
    expect(result).toEqual({ status: 'PAN_DONE', panNumber: 'ABCDE1234F' });
  });

  it('returns MANUAL_REVIEW when DocumentNumber field is missing', async () => {
    const { DocumentAnalysisClient: MockClient } = await import('@azure/ai-form-recognizer');
    const { getStorageDownloadUrl } = await import('../../src/firebase/admin.js');
    vi.mocked(getStorageDownloadUrl).mockResolvedValue('https://storage.example.com/pan.jpg');
    vi.mocked(MockClient).mockImplementation(() => ({
      beginAnalyzeDocumentFromUrl: vi.fn().mockResolvedValue({
        pollUntilDone: vi.fn().mockResolvedValue({ documents: [{ fields: {} }] }),
      }),
    } as unknown as DocumentAnalysisClient));

    const { extractPanFromStoragePath } = await import('../../src/services/formRecognizer.service.js');
    const result = await extractPanFromStoragePath('technicians/abc/pan.jpg');
    expect(result).toEqual({ status: 'MANUAL_REVIEW', panNumber: null });
  });

  it('returns MANUAL_REVIEW on 429 throttle error', async () => {
    const { DocumentAnalysisClient: MockClient } = await import('@azure/ai-form-recognizer');
    const { getStorageDownloadUrl } = await import('../../src/firebase/admin.js');
    vi.mocked(getStorageDownloadUrl).mockResolvedValue('https://storage.example.com/pan.jpg');
    const throttleError = Object.assign(new Error('Too Many Requests'), { statusCode: 429 });
    vi.mocked(MockClient).mockImplementation(() => ({
      beginAnalyzeDocumentFromUrl: vi.fn().mockRejectedValue(throttleError),
    } as unknown as DocumentAnalysisClient));

    const { extractPanFromStoragePath } = await import('../../src/services/formRecognizer.service.js');
    const result = await extractPanFromStoragePath('technicians/abc/pan.jpg');
    expect(result).toEqual({ status: 'MANUAL_REVIEW', panNumber: null });
  });

  it('throws on unexpected non-429 errors', async () => {
    const { DocumentAnalysisClient: MockClient } = await import('@azure/ai-form-recognizer');
    const { getStorageDownloadUrl } = await import('../../src/firebase/admin.js');
    vi.mocked(getStorageDownloadUrl).mockResolvedValue('https://storage.example.com/pan.jpg');
    vi.mocked(MockClient).mockImplementation(() => ({
      beginAnalyzeDocumentFromUrl: vi.fn().mockRejectedValue(new Error('Auth failure')),
    } as unknown as DocumentAnalysisClient));

    const { extractPanFromStoragePath } = await import('../../src/services/formRecognizer.service.js');
    await expect(extractPanFromStoragePath('technicians/abc/pan.jpg')).rejects.toThrow('Auth failure');
  });
});
