import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { routing } from '@/i18n/config';
import { getLocaleFromRequest } from '@/lib/i18n/helpers';

describe('locale persistence via NEXT_LOCALE cookie', () => {
  it('returns "en" when NEXT_LOCALE=en cookie is present and no URL prefix', () => {
    const req = new NextRequest('http://localhost:3000/dashboard', {
      headers: { cookie: 'NEXT_LOCALE=en; hs_access=sometoken' },
    });
    expect(getLocaleFromRequest(req, routing.defaultLocale, routing.locales)).toBe('en');
  });

  it('returns "hi" (default) when NEXT_LOCALE cookie is absent', () => {
    const req = new NextRequest('http://localhost:3000/dashboard', {
      headers: { cookie: 'hs_access=sometoken' },
    });
    expect(getLocaleFromRequest(req, routing.defaultLocale, routing.locales)).toBe('hi');
  });

  it('URL locale prefix overrides cookie', () => {
    const req = new NextRequest('http://localhost:3000/en/dashboard', {
      headers: { cookie: 'NEXT_LOCALE=hi' },
    });
    expect(getLocaleFromRequest(req, routing.defaultLocale, routing.locales)).toBe('en');
  });

  it('returns default locale for unknown NEXT_LOCALE cookie value', () => {
    const req = new NextRequest('http://localhost:3000/dashboard', {
      headers: { cookie: 'NEXT_LOCALE=de' },
    });
    expect(getLocaleFromRequest(req, routing.defaultLocale, routing.locales)).toBe('hi');
  });

  it('handles multiple cookies — NEXT_LOCALE extracted correctly', () => {
    const req = new NextRequest('http://localhost:3000/dashboard', {
      headers: {
        cookie: 'hs_access=tok1; NEXT_LOCALE=en; growthbook_id=xyz',
      },
    });
    expect(getLocaleFromRequest(req, routing.defaultLocale, routing.locales)).toBe('en');
  });
});
