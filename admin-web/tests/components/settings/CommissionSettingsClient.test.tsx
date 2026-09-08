import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CommissionSettingsClient } from '../../../src/components/settings/CommissionSettingsClient';
import type {
  CommissionConfig,
  TechnicianClientConfig,
  AdminServiceCategory,
} from '../../../src/api/commissions';

// task-9 brief + design doc §6. This is the settings page where the owner changes commission
// rates, hold thresholds, and the technician app's feature flags — three sections kept
// deliberately apart (Rates is money arithmetic affecting only future bookings; Enforcement is
// dispatch behaviour; Technician app features is a third, unrelated document), gated entirely on
// settings.manage.
//
// The ruling this story settled: this page fetches the commission dashboard itself (a separate
// GET from /finance/commissions, which shares no state with this route) purely to compute the
// threshold-impact preview via `thresholdImpact`. The component accepts a `rows` prop so tests
// can seed that fetch directly rather than mocking the full dashboard envelope.

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, string | number>) => {
    const dictionary: Record<string, string> = {
      'settings.heading': 'Commission settings',
      'settings.loading': 'Loading commission settings…',
      'settings.notAuthorized.eyebrow': 'Settings',
      'settings.notAuthorized.headline': 'You do not have access to commission settings.',
      'settings.notAuthorized.copy': 'This area is limited to super-admins.',
      'settings.errors.configLoadFailed': 'Could not load the commission configuration.',
      'settings.errors.featuresLoadFailed': 'Could not load the technician app feature flags.',
      'settings.errors.categoriesLoadFailed': 'Could not load the per-category rate table.',
      'settings.errors.rowsLoadFailed': 'Threshold impact unavailable — could not load technician balances.',
      'settings.errors.rateSaveFailed': 'Could not save the commission rate. Try again.',
      'settings.errors.thresholdOrder': 'The warn threshold must be below the block threshold.',
      'settings.errors.invalidThresholdAmount': 'Enter valid rupee amounts for both thresholds.',
      'settings.errors.enforcementSaveFailed': 'Could not save enforcement settings. Try again.',
      'settings.errors.holdEnforcementSaveFailed': 'Could not save the hold enforcement setting. Try again.',
      'settings.errors.featuresSaveFailed': 'Could not save the technician app features. Try again.',
      'settings.errors.categorySaveFailed': "Could not save this category's rate. Try again.",
      'settings.messages.rateSaved': 'Commission rate saved.',
      'settings.messages.enforcementSaved': 'Enforcement settings saved.',
      'settings.messages.holdEnforcementSaved': 'Hold enforcement setting saved.',
      'settings.messages.featuresSaved': 'Technician app features saved.',
      'settings.messages.categorySaved': 'Category rate saved.',
      'settings.updatedBy': 'Last changed by {actor} · {date}',
      'settings.rates.heading': 'Rates',
      'settings.rates.globalLabel': 'Global commission rate (%)',
      'settings.rates.globalSave': 'Save rate',
      'settings.rates.consequence':
        'Applies to bookings created from now on. Past bookings keep the rate they were priced at.',
      'settings.rates.invalidRate': 'Enter a rate between 15% and 35%.',
      'settings.rates.categoryTableHeading': 'Per-category rates',
      'settings.rates.categoryTableEmpty': 'No categories yet.',
      'settings.rates.columns.category': 'Category',
      'settings.rates.columns.effectiveRate': 'Effective rate',
      'settings.rates.columns.status': 'Status',
      'settings.rates.columns.override': 'Override (%)',
      'settings.rates.statusOverride': 'Override',
      'settings.rates.statusInherited': 'Inherited',
      'settings.rates.setOverride': 'Save',
      'settings.rates.clearOverride': 'Inherit global',
      'settings.enforcement.heading': 'Enforcement',
      'settings.enforcement.warnLabel': 'Warn threshold (₹)',
      'settings.enforcement.blockLabel': 'Block threshold (₹)',
      'settings.enforcement.save': 'Save enforcement settings',
      'settings.enforcement.appliesWithin': 'Applies within 5 minutes.',
      'settings.enforcement.impactNone': 'At {amount}, no technicians currently carrying a balance would be blocked today.',
      'settings.enforcement.impact':
        'At {amount}, {count} technician(s) currently carrying a balance would be blocked today ({names}).',
      'settings.enforcement.holdEnforcementLabel': 'Block technicians who owe too much',
      'settings.enforcement.enforceKycLabel': 'Require KYC before dispatch',
      'settings.enforcement.confirmEnableTitle': 'Turn on hold enforcement?',
      'settings.enforcement.confirmEnableBody':
        'Technicians whose balance crosses the block threshold will stop receiving work until they pay down. Applies within 5 minutes.',
      'settings.enforcement.confirmDisableTitle': 'Turn off hold enforcement?',
      'settings.enforcement.confirmDisableBody':
        'Technicians already blocked will start receiving work again immediately, even if they still owe commission.',
      'settings.enforcement.confirmConfirm': 'Confirm',
      'settings.enforcement.confirmCancel': 'Cancel',
      'settings.features.heading': 'Technician app features',
      'settings.features.save': 'Save features',
      'settings.features.wallet': 'Wallet',
      'settings.features.duesBanner': 'Dues banner',
      'settings.features.upiQr': 'UPI QR collection',
      'settings.features.incentives': 'Incentives',
      'settings.features.addOnRequests': 'Add-on requests',
    };
    const template = dictionary[key] ?? `[${key}]`;
    if (!params) return template;
    return Object.entries(params).reduce(
      (acc, [name, value]) => acc.replaceAll(`{${name}}`, String(value)),
      template,
    );
  },
  useLocale: () => 'en',
}));

const {
  fetchCommissionConfig,
  updateCommissionConfig,
  fetchTechnicianClientConfig,
  updateTechnicianClientConfig,
  fetchAdminCategories,
  updateCategoryCommission,
  fetchCommissionDashboard,
} = vi.hoisted(() => ({
  fetchCommissionConfig: vi.fn(),
  updateCommissionConfig: vi.fn(),
  fetchTechnicianClientConfig: vi.fn(),
  updateTechnicianClientConfig: vi.fn(),
  fetchAdminCategories: vi.fn(),
  updateCategoryCommission: vi.fn(),
  fetchCommissionDashboard: vi.fn(),
}));
vi.mock('@/api/commissions', () => ({
  fetchCommissionConfig,
  updateCommissionConfig,
  fetchTechnicianClientConfig,
  updateTechnicianClientConfig,
  fetchAdminCategories,
  updateCategoryCommission,
  fetchCommissionDashboard,
}));

let mockRole: string | null = 'super-admin';
vi.mock('@/lib/auth/context', () => ({
  useAdminAuth: () => ({ auth: mockRole ? { role: mockRole } : null }),
}));
vi.mock('@/admin/capabilities', () => ({
  hasCapability: (role: string | null | undefined, capability: string) =>
    role === 'super-admin' && capability === 'settings.manage',
}));

function config(overrides: Partial<CommissionConfig> = {}): CommissionConfig {
  return {
    defaultCommissionBps: 2000,
    warnThresholdPaise: 500000,
    blockThresholdPaise: 1000000,
    holdEnforcementEnabled: false,
    enforceKycInDispatch: true,
    updatedBy: 'admin-1',
    updatedAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}

function techConfig(overrides: Partial<TechnicianClientConfig> = {}): TechnicianClientConfig {
  return {
    id: 'technician-client-config',
    features: {
      wallet: true,
      duesBanner: false,
      upiQr: false,
      incentives: false,
      addOnRequests: false,
    },
    minSupportedVersionCode: 10,
    updatedBy: 'admin-1',
    updatedAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}

function category(overrides: Partial<AdminServiceCategory> = {}): AdminServiceCategory {
  return {
    id: 'ac-repair',
    name: 'AC Repair',
    heroImageUrl: 'https://example.com/cat.jpg',
    sortOrder: 1,
    isActive: true,
    updatedBy: 'admin-1',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}

function enforcementRegion() {
  return screen.getByRole('region', { name: 'Enforcement' });
}

function ratesRegion() {
  return screen.getByRole('region', { name: 'Rates' });
}

async function setThresholds(
  user: ReturnType<typeof userEvent.setup>,
  { warn, block }: { warn?: string; block?: string },
) {
  if (warn !== undefined) {
    const input = screen.getByLabelText('Warn threshold (₹)');
    await user.clear(input);
    await user.type(input, warn);
  }
  if (block !== undefined) {
    const input = screen.getByLabelText('Block threshold (₹)');
    await user.clear(input);
    await user.type(input, block);
  }
}

beforeEach(() => {
  mockRole = 'super-admin';
  fetchCommissionConfig.mockReset();
  updateCommissionConfig.mockReset();
  fetchTechnicianClientConfig.mockReset();
  updateTechnicianClientConfig.mockReset();
  fetchAdminCategories.mockReset();
  updateCategoryCommission.mockReset();
  fetchCommissionDashboard.mockReset();
});

describe('CommissionSettingsClient', () => {
  it('warns that a rate change does not reprice past bookings', () => {
    render(
      <CommissionSettingsClient
        initialConfig={config()}
        initialTechnicianConfig={techConfig()}
        initialCategories={[]}
        rows={[]}
      />,
    );
    expect(
      screen.getByText(/Past bookings keep the rate they were priced at/i),
    ).toBeInTheDocument();
  });

  it('rejects warn >= block before calling the API', async () => {
    const user = userEvent.setup();
    render(
      <CommissionSettingsClient
        initialConfig={config()}
        initialTechnicianConfig={techConfig()}
        initialCategories={[]}
        rows={[]}
      />,
    );

    await setThresholds(user, { warn: '5000', block: '5000' });
    await user.click(within(enforcementRegion()).getByRole('button', { name: /save/i }));

    expect(updateCommissionConfig).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent(/warn.*below.*block/i);
  });

  it('shows how many technicians a candidate block threshold would affect', async () => {
    const user = userEvent.setup();
    render(
      <CommissionSettingsClient
        initialConfig={config()}
        initialTechnicianConfig={techConfig()}
        initialCategories={[]}
        rows={[{ technicianName: 'Ramesh', outstandingPaise: 139346 }]}
      />,
    );

    await setThresholds(user, { block: '1000' });

    expect(screen.getByTestId('threshold-impact')).toHaveTextContent(/1 technician/);
    expect(screen.getByTestId('threshold-impact')).toHaveTextContent(/Ramesh/);
  });

  it('renders nothing for the threshold-impact preview when no rows have loaded', () => {
    // Neither `rows` nor a resolving `fetchCommissionDashboard` is supplied — the fetch is left
    // permanently pending, standing in for "rows have not loaded yet". The brief is explicit:
    // render nothing here, never a misleading zero.
    fetchCommissionDashboard.mockReturnValue(new Promise(() => {}));
    render(
      <CommissionSettingsClient
        initialConfig={config()}
        initialTechnicianConfig={techConfig()}
        initialCategories={[]}
      />,
    );
    expect(screen.queryByTestId('threshold-impact')).not.toBeInTheDocument();
  });

  it('requires confirmation before enabling hold enforcement', async () => {
    const user = userEvent.setup();
    render(
      <CommissionSettingsClient
        initialConfig={config({ holdEnforcementEnabled: false })}
        initialTechnicianConfig={techConfig()}
        initialCategories={[]}
        rows={[]}
      />,
    );

    await user.click(screen.getByLabelText(/block technicians who owe too much/i));

    expect(updateCommissionConfig).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toHaveTextContent(/stop receiving work/i);
  });

  it('confirms and saves hold enforcement, then closes the dialog', async () => {
    const user = userEvent.setup();
    updateCommissionConfig.mockResolvedValue(config({ holdEnforcementEnabled: true }));
    render(
      <CommissionSettingsClient
        initialConfig={config({ holdEnforcementEnabled: false })}
        initialTechnicianConfig={techConfig()}
        initialCategories={[]}
        rows={[]}
      />,
    );

    await user.click(screen.getByLabelText(/block technicians who owe too much/i));
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => {
      expect(updateCommissionConfig).toHaveBeenCalledWith({ holdEnforcementEnabled: true });
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows who last changed the config and when', () => {
    render(
      <CommissionSettingsClient
        initialConfig={config({ updatedBy: 'alok', updatedAt: '2026-09-01T00:00:00.000Z' })}
        initialTechnicianConfig={techConfig()}
        initialCategories={[]}
        rows={[]}
      />,
    );
    expect(screen.getAllByText(/alok/i).length).toBeGreaterThan(0);
  });

  it('hides everything from a role without settings.manage', () => {
    mockRole = 'finance';
    render(
      <CommissionSettingsClient
        initialConfig={config()}
        initialTechnicianConfig={techConfig()}
        initialCategories={[]}
        rows={[]}
      />,
    );
    expect(screen.getByText('You do not have access to commission settings.')).toBeInTheDocument();
    expect(screen.queryByLabelText(/block technicians who owe too much/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Rates')).not.toBeInTheDocument();
  });

  it('saves a valid global commission rate', async () => {
    const user = userEvent.setup();
    updateCommissionConfig.mockResolvedValue(config({ defaultCommissionBps: 2500 }));
    render(
      <CommissionSettingsClient
        initialConfig={config()}
        initialTechnicianConfig={techConfig()}
        initialCategories={[]}
        rows={[]}
      />,
    );

    const input = screen.getByLabelText('Global commission rate (%)');
    await user.clear(input);
    await user.type(input, '25');
    await user.click(within(ratesRegion()).getByRole('button', { name: 'Save rate' }));

    await waitFor(() => {
      expect(updateCommissionConfig).toHaveBeenCalledWith({ defaultCommissionBps: 2500 });
    });
    expect(await screen.findByText('Commission rate saved.')).toBeInTheDocument();
  });

  it('rejects a global rate outside the 15%-35% range without calling the API', async () => {
    const user = userEvent.setup();
    render(
      <CommissionSettingsClient
        initialConfig={config()}
        initialTechnicianConfig={techConfig()}
        initialCategories={[]}
        rows={[]}
      />,
    );

    const input = screen.getByLabelText('Global commission rate (%)');
    await user.clear(input);
    await user.type(input, '50');
    await user.click(within(ratesRegion()).getByRole('button', { name: 'Save rate' }));

    expect(updateCommissionConfig).not.toHaveBeenCalled();
    expect(await screen.findByText('Enter a rate between 15% and 35%.')).toBeInTheDocument();
  });

  it('sets a per-category commission override', async () => {
    const user = userEvent.setup();
    updateCategoryCommission.mockResolvedValue(category({ commissionBps: 2500 }));
    render(
      <CommissionSettingsClient
        initialConfig={config()}
        initialTechnicianConfig={techConfig()}
        initialCategories={[category()]}
        rows={[]}
      />,
    );

    expect(screen.getByText('Inherited')).toBeInTheDocument();
    const overrideInput = screen.getByLabelText('Override (%)');
    await user.type(overrideInput, '25');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(updateCategoryCommission).toHaveBeenCalledWith('ac-repair', 2500);
    });
    expect(await screen.findByText('Override')).toBeInTheDocument();
  });

  it("clears a category's override back to inheriting the global rate", async () => {
    const user = userEvent.setup();
    // `category()`'s base fixture already carries no `commissionBps` key at all — that is what
    // "cleared" looks like on the wire (an absent key, never a literal `null`/`undefined` value).
    updateCategoryCommission.mockResolvedValue(category());
    render(
      <CommissionSettingsClient
        initialConfig={config()}
        initialTechnicianConfig={techConfig()}
        initialCategories={[category({ commissionBps: 2500 })]}
        rows={[]}
      />,
    );

    expect(screen.getByText('Override')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Inherit global' }));

    await waitFor(() => {
      expect(updateCategoryCommission).toHaveBeenCalledWith('ac-repair', null);
    });
    expect(await screen.findByText('Inherited')).toBeInTheDocument();
  });

  it('saves technician app features', async () => {
    const user = userEvent.setup();
    updateTechnicianClientConfig.mockResolvedValue(
      techConfig({ features: { wallet: false, duesBanner: true, upiQr: false, incentives: false, addOnRequests: false } }),
    );
    render(
      <CommissionSettingsClient
        initialConfig={config()}
        initialTechnicianConfig={techConfig()}
        initialCategories={[]}
        rows={[]}
      />,
    );

    await user.click(screen.getByLabelText('Wallet'));
    await user.click(screen.getByLabelText('Dues banner'));
    await user.click(screen.getByRole('button', { name: 'Save features' }));

    await waitFor(() => {
      expect(updateTechnicianClientConfig).toHaveBeenCalledWith({
        features: { wallet: false, duesBanner: true, upiQr: false, incentives: false, addOnRequests: false },
      });
    });
    expect(await screen.findByText('Technician app features saved.')).toBeInTheDocument();
  });

  it('scopes a categories-fetch failure to the rate table and keeps the rest of the page usable', async () => {
    fetchAdminCategories.mockRejectedValue(new Error('boom'));
    render(
      <CommissionSettingsClient
        initialConfig={config()}
        initialTechnicianConfig={techConfig()}
        rows={[]}
      />,
    );

    expect(
      await screen.findByText('Could not load the per-category rate table.'),
    ).toBeInTheDocument();
    // The rest of the page — including the global rate editor fed by the same section — must
    // still render and work, per the "fetch independently and degrade" rule.
    expect(screen.getByLabelText('Global commission rate (%)')).toBeInTheDocument();
    expect(within(enforcementRegion()).getByLabelText('Warn threshold (₹)')).toBeInTheDocument();
  });
});
