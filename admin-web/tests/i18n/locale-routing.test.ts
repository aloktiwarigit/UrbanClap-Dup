import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { routing } from '@/i18n/config';
import { stripLocalePrefix, getLocaleFromRequest } from '@/lib/i18n/helpers';

describe('stripLocalePrefix', () => {
  it('strips /hi/ prefix leaving the raw path', () => {
    expect(stripLocalePrefix('/hi/dashboard', routing.locales)).toBe('/dashboard');
  });

  it('strips /en/ prefix', () => {
    expect(stripLocalePrefix('/en/orders/123', routing.locales)).toBe('/orders/123');
  });

  it('handles locale-root /hi returning /', () => {
    expect(stripLocalePrefix('/hi', routing.locales)).toBe('/');
  });

  it('leaves unknown-locale paths unchanged', () => {
    expect(stripLocalePrefix('/fr/dashboard', routing.locales)).toBe('/fr/dashboard');
  });

  it('leaves non-locale paths unchanged', () => {
    expect(stripLocalePrefix('/dashboard', routing.locales)).toBe('/dashboard');
  });

  it('leaves /admin-api/ paths unchanged', () => {
    expect(stripLocalePrefix('/admin-api/v1/health', routing.locales)).toBe('/admin-api/v1/health');
  });
});

describe('getLocaleFromRequest', () => {
  it('returns locale from /hi/ URL prefix', () => {
    const req = new NextRequest('http://localhost:3000/hi/dashboard');
    expect(getLocaleFromRequest(req, routing.defaultLocale, routing.locales)).toBe('hi');
  });

  it('returns locale from /en/ URL prefix', () => {
    const req = new NextRequest('http://localhost:3000/en/orders');
    expect(getLocaleFromRequest(req, routing.defaultLocale, routing.locales)).toBe('en');
  });

  it('falls back to NEXT_LOCALE cookie when path has no locale prefix', () => {
    const req = new NextRequest('http://localhost:3000/dashboard', {
      headers: { cookie: 'NEXT_LOCALE=en' },
    });
    expect(getLocaleFromRequest(req, routing.defaultLocale, routing.locales)).toBe('en');
  });

  it('returns defaultLocale when no URL prefix and no cookie', () => {
    const req = new NextRequest('http://localhost:3000/dashboard');
    expect(getLocaleFromRequest(req, routing.defaultLocale, routing.locales)).toBe('hi');
  });

  it('ignores unknown locale in NEXT_LOCALE cookie, returns defaultLocale', () => {
    const req = new NextRequest('http://localhost:3000/dashboard', {
      headers: { cookie: 'NEXT_LOCALE=fr' },
    });
    expect(getLocaleFromRequest(req, routing.defaultLocale, routing.locales)).toBe('hi');
  });

  it('URL prefix takes priority over NEXT_LOCALE cookie', () => {
    const req = new NextRequest('http://localhost:3000/en/dashboard', {
      headers: { cookie: 'NEXT_LOCALE=hi' },
    });
    expect(getLocaleFromRequest(req, routing.defaultLocale, routing.locales)).toBe('en');
  });
});
