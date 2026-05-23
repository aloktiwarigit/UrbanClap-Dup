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
  usePathname: () => '/hi/catalogue',
  useParams: () => ({ categoryId: 'ac-repair' }),
}));
vi.mock('@/lib/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href }, children),
}));
vi.mock('@/api/catalogue', () => ({
  listCategories: vi.fn().mockResolvedValue([]),
  patchCategory: vi.fn(),
}));

import { CategoryForm } from '../../src/components/catalogue/CategoryForm';
import { CategoryCard } from '../../src/components/catalogue/CategoryCard';
import { ServiceForm } from '../../src/components/catalogue/ServiceForm';

describe('Catalogue i18n extraction', () => {
  // CategoryForm tests
  it('renders no hardcoded English "ID (slug)" label', () => {
    render(React.createElement(CategoryForm, { onSubmit: vi.fn(), onCancel: vi.fn() }));
    expect(screen.queryByText('ID (slug)')).toBeNull();
  });

  it('renders i18n sentinel for ID label', () => {
    render(React.createElement(CategoryForm, { onSubmit: vi.fn(), onCancel: vi.fn() }));
    expect(screen.queryByText('[catalogue.form.idLabel]')).not.toBeNull();
  });

  it('renders no hardcoded "Create Category" button text', () => {
    render(React.createElement(CategoryForm, { onSubmit: vi.fn(), onCancel: vi.fn() }));
    expect(screen.queryByText('Create Category')).toBeNull();
  });

  it('renders i18n sentinel for create button', () => {
    render(React.createElement(CategoryForm, { onSubmit: vi.fn(), onCancel: vi.fn() }));
    expect(screen.queryByText('[catalogue.form.createButton]')).not.toBeNull();
  });

  it('renders no hardcoded "Cancel" button text in CategoryForm', () => {
    render(React.createElement(CategoryForm, { onSubmit: vi.fn(), onCancel: vi.fn() }));
    expect(screen.queryByText('Cancel')).toBeNull();
  });

  // CategoryCard tests
  it('renders no hardcoded "Active" status in CategoryCard', () => {
    const category = { id: 'test', name: 'Test', isActive: true, sortOrder: 1, heroImageUrl: '', updatedBy: 'admin', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' };
    render(React.createElement(CategoryCard, { category, onToggle: vi.fn() }));
    // The status badge must not show hardcoded "Active"
    expect(screen.queryByText('Active')).toBeNull();
  });

  it('renders i18n sentinel for active status in CategoryCard', () => {
    const category = { id: 'test', name: 'Test', isActive: true, sortOrder: 1, heroImageUrl: '', updatedBy: 'admin', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' };
    render(React.createElement(CategoryCard, { category, onToggle: vi.fn() }));
    expect(screen.queryByText('[catalogue.card.statusActive]')).not.toBeNull();
  });

  it('renders no hardcoded "Deactivate" button in CategoryCard', () => {
    const category = { id: 'test', name: 'Test', isActive: true, sortOrder: 1, heroImageUrl: '', updatedBy: 'admin', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' };
    render(React.createElement(CategoryCard, { category, onToggle: vi.fn() }));
    expect(screen.queryByText('Deactivate')).toBeNull();
  });

  it('renders i18n sentinel for deactivate button in CategoryCard', () => {
    const category = { id: 'test', name: 'Test', isActive: true, sortOrder: 1, heroImageUrl: '', updatedBy: 'admin', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' };
    render(React.createElement(CategoryCard, { category, onToggle: vi.fn() }));
    expect(screen.queryByText('[catalogue.card.deactivateButton]')).not.toBeNull();
  });

  // ServiceForm tests
  it('renders no hardcoded "Create Service" button text', () => {
    render(React.createElement(ServiceForm, { categoryId: 'ac-repair', onSubmit: vi.fn(), onCancel: vi.fn() }));
    expect(screen.queryByText('Create Service')).toBeNull();
  });

  it('renders i18n sentinel for service create button', () => {
    render(React.createElement(ServiceForm, { categoryId: 'ac-repair', onSubmit: vi.fn(), onCancel: vi.fn() }));
    expect(screen.queryByText('[catalogue.serviceForm.createButton]')).not.toBeNull();
  });
});
