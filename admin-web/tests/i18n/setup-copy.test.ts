import { describe, it, expect } from 'vitest';

import en from '../../messages/en.json';
import hi from '../../messages/hi.json';

/**
 * Guards the Microsoft Authenticator enrollment instructions.
 *
 * Microsoft Authenticator's "Add account" sheet offers Personal account /
 * Work or school account / Other account. Picking "Personal account" enrolls
 * the admin's own Microsoft account, which issues 8-digit TOTPs — our API only
 * ever issues 6-digit ones (no `digits` param on the otpauth URI), so the code
 * can never be entered. Two admins hit this during onboarding.
 *
 * The setup copy must therefore name the "Other account" branch explicitly and
 * warn against "Personal account".
 */
describe('setup page authenticator instructions', () => {
  const enSetup = en.setup as Record<string, string>;
  const hiSetup = hi.setup as Record<string, string>;

  it('keeps en and hi setup keys in parity', () => {
    expect(Object.keys(enSetup).sort()).toEqual(Object.keys(hiSetup).sort());
  });

  for (const [locale, setup] of [
    ['en', enSetup],
    ['hi', hiSetup],
  ] as const) {
    it(`[${locale}] step2 directs the admin to the "Other account" branch`, () => {
      expect(setup.step2).toMatch(/Other account/i);
    });

    it(`[${locale}] step2 warns against the "Personal account" branch`, () => {
      expect(setup.step2).toMatch(/Personal account/i);
    });

    // The API sets issuer: 'homeservices-admin' (api/src/services/totp.service.ts),
    // so that — not the brand name — is the label the authenticator shows.
    it(`[${locale}] step3 names the issuer exactly as the authenticator shows it`, () => {
      expect(setup.step3).toContain('homeservices-admin');
    });
  }
});
