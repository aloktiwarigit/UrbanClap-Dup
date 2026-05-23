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

  it('returns panMaskedNumber and panHash on successful OCR', async () => {
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

    expect(result.status).toBe('PAN_DONE');
    if (result.status === 'PAN_DONE') {
      expect(result.panMaskedNumber).toBe('XXXXX1234F');
      expect(result.panHash).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it('[DPDP] raw PAN never present in return value', async () => {
    const { DocumentAnalysisClient: MockClient } = await import('@azure/ai-form-recognizer');
    const { getStorageDownloadUrl } = await import('../../src/firebase/admin.js');
    vi.mocked(getStorageDownloadUrl).mockResolvedValue('https://storage.example.com/pan.jpg');
    vi.mocked(MockClient).mockImplementation(() => ({
      beginAnalyzeDocumentFromUrl: vi.fn().mockResolvedValue({
        pollUntilDone: vi.fn().mockResolvedValue({
          documents: [{ fields: { DocumentNumber: { content: 'ABCDE1234F', confidence: 0.99 } } }],
        }),
      }),
    } as unknown as DocumentAnalysisClient));

    const { extractPanFromStoragePath } = await import('../../src/services/formRecognizer.service.js');
    const result = await extractPanFromStoragePath('technicians/abc/pan.jpg');

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('ABCDE1234F');
    expect(serialized).not.toContain('abcde1234f');
    // The result must not expose a 'panNumber' property at all
    expect(result).not.toHaveProperty('panNumber');
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
    expect(result).toEqual({ status: 'MANUAL_REVIEW', panMaskedNumber: null, panHash: null });
  });

  it('returns MANUAL_REVIEW for non-canonical PAN format (interior space)', async () => {
    const { DocumentAnalysisClient: MockClient } = await import('@azure/ai-form-recognizer');
    const { getStorageDownloadUrl } = await import('../../src/firebase/admin.js');
    vi.mocked(getStorageDownloadUrl).mockResolvedValue('https://storage.example.com/pan.jpg');
    vi.mocked(MockClient).mockImplementation(() => ({
      beginAnalyzeDocumentFromUrl: vi.fn().mockResolvedValue({
        pollUntilDone: vi.fn().mockResolvedValue({
          documents: [{ fields: { DocumentNumber: { content: 'ABCDE 1234F' } } }],
        }),
      }),
    } as unknown as DocumentAnalysisClient));

    const { extractPanFromStoragePath } = await import('../../src/services/formRecognizer.service.js');
    const result = await extractPanFromStoragePath('technicians/abc/pan.jpg');
    expect(result).toEqual({ status: 'MANUAL_REVIEW', panMaskedNumber: null, panHash: null });
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
    expect(result).toEqual({ status: 'MANUAL_REVIEW', panMaskedNumber: null, panHash: null });
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
