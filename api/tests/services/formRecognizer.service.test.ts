import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @azure/ai-form-recognizer
vi.mock('@azure/ai-form-recognizer', () => ({
  DocumentAnalysisClient: vi.fn().mockImplementation(() => ({
    beginAnalyzeDocument: vi.fn(),
  })),
  AzureKeyCredential: vi.fn(),
}));

// Mock firebase admin
vi.mock('../../src/firebase/admin', () => ({
  getStorageDownloadUrl: vi.fn(),
}));

describe('formRecognizer.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env['FORM_RECOGNIZER_ENDPOINT'] = 'https://fake.cognitiveservices.azure.com/';
    process.env['FORM_RECOGNIZER_KEY'] = 'fakekey';
  });

  it('returns panNumber on successful OCR', async () => {
    const { DocumentAnalysisClient } = await import('@azure/ai-form-recognizer');
    const { getStorageDownloadUrl } = await import('../../src/firebase/admin');
    vi.mocked(getStorageDownloadUrl).mockResolvedValue('https://storage.example.com/pan.jpg');
    const mockPoller = {
      pollUntilDone: vi.fn().mockResolvedValue({
        documents: [{ fields: { DocumentNumber: { content: 'ABCDE1234F', confidence: 0.99 } } }],
      }),
    };
    vi.mocked(DocumentAnalysisClient).mockImplementation(() => ({
      beginAnalyzeDocument: vi.fn().mockResolvedValue(mockPoller),
    }) as any);

    const { extractPanFromStoragePath } = await import('../../src/services/formRecognizer.service');
    const result = await extractPanFromStoragePath('technicians/abc/pan.jpg');
    expect(result).toEqual({ status: 'PAN_DONE', panNumber: 'ABCDE1234F' });
  });

  it('returns MANUAL_REVIEW when DocumentNumber field is missing', async () => {
    const { DocumentAnalysisClient } = await import('@azure/ai-form-recognizer');
    const { getStorageDownloadUrl } = await import('../../src/firebase/admin');
    vi.mocked(getStorageDownloadUrl).mockResolvedValue('https://storage.example.com/pan.jpg');
    vi.mocked(DocumentAnalysisClient).mockImplementation(() => ({
      beginAnalyzeDocument: vi.fn().mockResolvedValue({
        pollUntilDone: vi.fn().mockResolvedValue({ documents: [{ fields: {} }] }),
      }),
    }) as any);

    const { extractPanFromStoragePath } = await import('../../src/services/formRecognizer.service');
    const result = await extractPanFromStoragePath('technicians/abc/pan.jpg');
    expect(result).toEqual({ status: 'MANUAL_REVIEW', panNumber: null });
  });

  it('returns MANUAL_REVIEW on 429 throttle error', async () => {
    const { DocumentAnalysisClient } = await import('@azure/ai-form-recognizer');
    const { getStorageDownloadUrl } = await import('../../src/firebase/admin');
    vi.mocked(getStorageDownloadUrl).mockResolvedValue('https://storage.example.com/pan.jpg');
    const throttleError = Object.assign(new Error('Too Many Requests'), { statusCode: 429 });
    vi.mocked(DocumentAnalysisClient).mockImplementation(() => ({
      beginAnalyzeDocument: vi.fn().mockRejectedValue(throttleError),
    }) as any);

    const { extractPanFromStoragePath } = await import('../../src/services/formRecognizer.service');
    const result = await extractPanFromStoragePath('technicians/abc/pan.jpg');
    expect(result).toEqual({ status: 'MANUAL_REVIEW', panNumber: null });
  });

  it('throws on unexpected non-429 errors', async () => {
    const { DocumentAnalysisClient } = await import('@azure/ai-form-recognizer');
    const { getStorageDownloadUrl } = await import('../../src/firebase/admin');
    vi.mocked(getStorageDownloadUrl).mockResolvedValue('https://storage.example.com/pan.jpg');
    vi.mocked(DocumentAnalysisClient).mockImplementation(() => ({
      beginAnalyzeDocument: vi.fn().mockRejectedValue(new Error('Auth failure')),
    }) as any);

    const { extractPanFromStoragePath } = await import('../../src/services/formRecognizer.service');
    await expect(extractPanFromStoragePath('technicians/abc/pan.jpg')).rejects.toThrow('Auth failure');
  });
});
