import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string) => `[${ns}.${key}]`,
  useLocale: () => 'hi',
}));
vi.mock('next-intl/server', () => ({
  getTranslations: async (ns: string) => (key: string) => `[${ns}.${key}]`,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useParams: () => ({ locale: 'hi' }),
}));

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: class {
    setCustomParameters = vi.fn();
  },
}));

vi.mock('@/lib/auth/firebase', () => ({
  getFirebaseAuth: vi.fn(),
}));

vi.mock('@/api/base', () => ({
  apiUrl: (path: string) => path,
}));

vi.mock('@/lib/auth/safe-next-path', () => ({
  getSafeNextPath: () => '/dashboard',
}));

import LoginPage from '../../app/[locale]/login/page';

describe('Login page i18n extraction', () => {
  it('renders no hardcoded "Secure operations access" hero title', () => {
    render(React.createElement(LoginPage));
    expect(screen.queryByText('Secure operations access')).toBeNull();
  });

  it('renders i18n sentinel for hero title', () => {
    render(React.createElement(LoginPage));
    expect(screen.queryByText('[login.hero.title]')).not.toBeNull();
  });

  it('renders no hardcoded "Continue with Google" button', () => {
    render(React.createElement(LoginPage));
    expect(screen.queryByText('Continue with Google')).toBeNull();
  });

  it('renders i18n sentinel for Google continue button', () => {
    render(React.createElement(LoginPage));
    expect(screen.queryByText('[login.form.google.continueButton]')).not.toBeNull();
  });

  it('renders no hardcoded "or use admin password" divider', () => {
    render(React.createElement(LoginPage));
    expect(screen.queryByText('or use admin password')).toBeNull();
  });

  it('renders i18n sentinel for divider', () => {
    render(React.createElement(LoginPage));
    expect(screen.queryByText('[login.form.divider]')).not.toBeNull();
  });

  it('renders no hardcoded "Email address" label', () => {
    render(React.createElement(LoginPage));
    expect(screen.queryByText('Email address')).toBeNull();
  });

  it('renders i18n sentinel for email label', () => {
    render(React.createElement(LoginPage));
    expect(screen.queryByText(/\[login\.form\.emailLabel\]/)).not.toBeNull();
  });

  it('renders no hardcoded "Sign in with password" button', () => {
    render(React.createElement(LoginPage));
    expect(screen.queryByText('Sign in with password')).toBeNull();
  });

  it('renders i18n sentinel for password submit button', () => {
    render(React.createElement(LoginPage));
    expect(screen.queryByText('[login.form.password.submitButton]')).not.toBeNull();
  });

  it('renders no hardcoded step-one description', () => {
    render(React.createElement(LoginPage));
    expect(
      screen.queryByText('Continue with Google or admin email and password.'),
    ).toBeNull();
  });

  it('renders i18n sentinel for step-one description', () => {
    render(React.createElement(LoginPage));
    expect(screen.queryByText('[login.steps.one.description]')).not.toBeNull();
  });

  it('renders no hardcoded "HomeHeroo admin" eyebrow', () => {
    render(React.createElement(LoginPage));
    expect(screen.queryByText('HomeHeroo admin')).toBeNull();
  });

  it('renders i18n sentinel for brand eyebrow', () => {
    render(React.createElement(LoginPage));
    expect(screen.queryByText('[login.brand.eyebrow]')).not.toBeNull();
  });
});
