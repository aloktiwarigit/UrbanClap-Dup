// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('next-intl/middleware', () => ({
  default: () => () => NextResponse.next(),
}));

import { normalizeSameHostRedirect } from '../middleware';

describe('normalizeSameHostRedirect', () => {
  it('removes ACA internal port from same-host absolute redirects', () => {
    const req = new NextRequest(
      'https://aca-admin-homeservices-prod.icybush-b2e9c876.centralindia.azurecontainerapps.io/dashboard',
      {
        headers: {
          host: 'aca-admin-homeservices-prod.icybush-b2e9c876.centralindia.azurecontainerapps.io',
        },
      },
    );
    const res = NextResponse.redirect(
      'https://aca-admin-homeservices-prod.icybush-b2e9c876.centralindia.azurecontainerapps.io:3000/hi/dashboard',
    );

    normalizeSameHostRedirect(res, req);

    expect(res.headers.get('location')).toBe(
      'https://aca-admin-homeservices-prod.icybush-b2e9c876.centralindia.azurecontainerapps.io/hi/dashboard',
    );
  });

  it('preserves external absolute redirects', () => {
    const req = new NextRequest('https://admin.example.test/dashboard');
    const res = NextResponse.redirect('https://example.com/hi/dashboard');

    normalizeSameHostRedirect(res, req);

    expect(res.headers.get('location')).toBe('https://example.com/hi/dashboard');
  });
});
