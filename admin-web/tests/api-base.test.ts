import { describe, expect, it } from 'vitest';
import { apiUrl, BROWSER_API_BASE_URL } from '../src/api/base';
import { getApiBaseUrl, getDefaultApiBaseUrl } from '../src/lib/apiBase';

describe('API base URLs', () => {
  it('uses the admin-web proxy for browser calls by default', () => {
    expect(BROWSER_API_BASE_URL).toBe('/admin-api');
    expect(apiUrl('/v1/admin/auth/login')).toBe('/admin-api/v1/admin/auth/login');
  });

  it('uses production Functions as the server fallback in production', () => {
    expect(getDefaultApiBaseUrl('production')).toBe(
      'https://func-homeservices-prod.azurewebsites.net/api',
    );
  });

  it('trims configured server API base URLs', () => {
    expect(getApiBaseUrl({ API_BASE_URL: 'https://example.test/api///' })).toBe(
      'https://example.test/api',
    );
  });
});
