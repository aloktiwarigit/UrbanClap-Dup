import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CommissionSettingsClient } from '../../../src/components/settings/CommissionSettingsClient';
import type {
  CommissionConfig,
  TechnicianClientConfig,
  AdminServiceCategory,
  AdminService,
} from '../../../src/api/commissions';
import enMessages from '../../../messages/en.json';
import hiMessages from '../../../messages/hi.json';

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
      'settings.errors.servicesLoadFailed': 'Could not load the service-overrides roster.',
      'settings.errors.rowsLoadFailed': 'Threshold impact unavailable — could not load technician balances.',
      'settings.errors.rateSaveFailed': 'Could not save the commission rate. Try again.',
      'settings.errors.thresholdOrder': 'The warn threshold must be below the block threshold.',
      'settings.errors.invalidThresholdAmount': 'Enter valid rupee amounts for both thresholds.',
      'settings.errors.enforcementSaveFailed': 'Could not save enforcement settings. Try again.',
      'settings.errors.holdEnforcementSaveFailed': 'Could not save the hold enforcement setting. Try again.',
      'settings.errors.featuresSaveFailed': 'Could not save the technician app features. Try again.',
      'settings.errors.categorySaveFailed': "Could not save this category's rate. Try again.",
      'settings.errors.serviceClearFailed': "Could not clear the service's commission override. Try again.",
      'settings.messages.rateSaved': 'Commission rate saved.',
      'settings.messages.enforcementSaved': 'Enforcement settings saved.',
      'settings.messages.holdEnforcementSaved': 'Hold enforcement setting saved.',
      'settings.messages.featuresSaved': 'Technician app features saved.',
      'settings.messages.categorySaved': 'Category rate saved.',
      'settings.messages.serviceCleared': 'Service commission override cleared.',
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
      'settings.rates.columns.service': 'Service',
      'settings.rates.statusOverride': 'Override',
      'settings.rates.statusInherited': 'Inherited',
      'settings.rates.setOverride': 'Save',
      'settings.rates.clearOverride': 'Inherit global',
      'settings.rates.serviceOverridesHeading': 'Service overrides',
      'settings.rates.noServiceOverrides': 'No services currently carry a commission override.',
      'settings.enforcement.heading': 'Enforcement',
      'settings.enforcement.warnLabel': 'Warn threshold (₹)',
      'settings.enforcement.blockLabel': 'Block threshold (₹)',
      'settings.enforcement.save': 'Save enforcement settings',
      'settings.enforcement.appliesWithin': 'Applies within 5 minutes.',
      'settings.enforcement.impactNone': 'At {amount}, no technicians currently carrying a balance would be blocked today.',
      'settings.enforcement.impact':
        'At {amount}, {count} technician(s) currently carrying a balance would be blocked today ({names}).',
      'settings.enforcement.impactNonePartial':
        'At {amount}, no technicians on this page currently carrying a balance would be blocked today.',
      'settings.enforcement.impactPartial':
        'At {amount}, {count} technician(s) on this page currently carrying a balance would be blocked today ({names}).',
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
  fetchAdminServices,
  updateCategoryCommission,
  updateServiceCommission,
  fetchCommissionDashboard,
} = vi.hoisted(() => ({
  fetchCommissionConfig: vi.fn(),
  updateCommissionConfig: vi.fn(),
  fetchTechnicianClientConfig: vi.fn(),
  updateTechnicianClientConfig: vi.fn(),
  fetchAdminCategories: vi.fn(),
  fetchAdminServices: vi.fn(),
  updateCategoryCommission: vi.fn(),
  updateServiceCommission: vi.fn(),
  fetchCommissionDashboard: vi.fn(),
}));
vi.mock('@/api/commissions', () => ({
  fetchCommissionConfig,
  updateCommissionConfig,
  fetchTechnicianClientConfig,
  updateTechnicianClientConfig,
  fetchAdminCategories,
  fetchAdminServices,
  updateCategoryCommission,
  updateServiceCommission,
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

function service(overrides: Partial<AdminService> = {}): AdminService {
  return {
    id: 'ac-deep-clean',
    categoryId: 'ac-repair',
    name: 'AC Deep Clean',
    shortDescription: 'Deep clean of AC unit',
    heroImageUrl: 'https://example.com/svc.jpg',
    basePrice: 59900,
    durationMinutes: 90,
    includes: [],
    faq: [],
    addOns: [],
    photoStages: [],
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
  fetchAdminServices.mockReset();
  // Unlike `fetchAdminCategories` (every test below seeds `initialCategories`, so its mount-time
  // fetch never actually runs except in the one test that deliberately exercises it),
  // `fetchAdminServices` needs a safe default: most tests below don't seed `initialServices`, so
  // omitting this would make `loadServices`' mount effect resolve `undefined` in every one of them
  // and crash the roster's render. Tests that care about roster contents seed `initialServices`
  // directly (bypassing this fetch); tests that care about the fetch path override this mock.
  fetchAdminServices.mockResolvedValue([]);
  updateCategoryCommission.mockReset();
  updateServiceCommission.mockReset();
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
    // Unqualified: this is the whole set (`rowsPartial` defaults to false), so the copy must not
    // carry the page-scoped qualifier.
    expect(screen.getByTestId('threshold-impact')).not.toHaveTextContent(/on this page/i);
  });

  // Codex round 2 (P2): `fetchCommissionDashboard` only ever returns its first page (50 rows)
  // plus a `continuationToken` when more exist. Before this fix, `dashboardRows` silently held
  // just that page and the preview counted blocked technicians from it alone — undercounting
  // above 50 technicians carrying a balance, with nothing on screen to say so. The fix labels
  // the figure instead of draining every page to compute a settings-screen preview, mirroring
  // the exact `isPartial` qualifier idiom `CommissionsClient`/`SummaryBand` already established
  // for the commissions roll-up.
  it('labels the threshold-impact preview as page-scoped when the dashboard reports more pages exist', async () => {
    const user = userEvent.setup();
    render(
      <CommissionSettingsClient
        initialConfig={config()}
        initialTechnicianConfig={techConfig()}
        initialCategories={[]}
        rows={[{ technicianName: 'Ramesh', outstandingPaise: 139346 }]}
        rowsPartial
      />,
    );

    await setThresholds(user, { block: '1000' });

    expect(screen.getByTestId('threshold-impact')).toHaveTextContent(/1 technician/);
    expect(screen.getByTestId('threshold-impact')).toHaveTextContent(/Ramesh/);
    expect(screen.getByTestId('threshold-impact')).toHaveTextContent(/on this page/i);
  });

  it('labels the threshold-impact preview as page-scoped even in the zero-blocked case, when the dashboard reports more pages exist', async () => {
    const user = userEvent.setup();
    render(
      <CommissionSettingsClient
        initialConfig={config()}
        initialTechnicianConfig={techConfig()}
        initialCategories={[]}
        rows={[{ technicianName: 'Ramesh', outstandingPaise: 139346 }]}
        rowsPartial
      />,
    );

    // ₹1,000,000 is above every seeded balance, so nothing on this page would be blocked — but
    // there may still be blocked technicians on pages this preview never fetched.
    await setThresholds(user, { block: '1000000' });

    expect(screen.getByTestId('threshold-impact')).toHaveTextContent(/on this page/i);
  });

  it('derives the page-scoped label itself from a live fetch that reports a continuation token, not only from the `rowsPartial` test seed', async () => {
    const user = userEvent.setup();
    fetchCommissionDashboard.mockResolvedValue({
      technicians: [{ technicianName: 'Ramesh', outstandingPaise: 139346 }],
      totalOutstanding: 139346,
      unreconciledTechnicianCount: 0,
      continuationToken: 'page-2',
    });
    render(
      <CommissionSettingsClient
        initialConfig={config()}
        initialTechnicianConfig={techConfig()}
        initialCategories={[]}
      />,
    );

    await waitFor(() => expect(fetchCommissionDashboard).toHaveBeenCalled());
    await setThresholds(user, { block: '1000' });

    expect(screen.getByTestId('threshold-impact')).toHaveTextContent(/on this page/i);
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

  it('renders a service overrides section listing every service with commissionBps set', () => {
    render(
      <CommissionSettingsClient
        initialConfig={config()}
        initialTechnicianConfig={techConfig()}
        initialCategories={[]}
        initialServices={[
          service({ id: 'ac-deep-clean', name: 'AC Deep Clean', commissionBps: 2900 }),
          service({ id: 'tap-repair', name: 'Tap Repair' }),
        ]}
        rows={[]}
      />,
    );

    expect(screen.getByText('AC Deep Clean')).toBeInTheDocument();
    expect(screen.queryByText('Tap Repair')).not.toBeInTheDocument();
  });

  it('shows a "no overrides" message when no service carries a commission override', () => {
    render(
      <CommissionSettingsClient
        initialConfig={config()}
        initialTechnicianConfig={techConfig()}
        initialCategories={[]}
        initialServices={[service()]}
        rows={[]}
      />,
    );

    expect(
      screen.getByText('No services currently carry a commission override.'),
    ).toBeInTheDocument();
  });

  it('clicking Clear on a service override calls updateServiceCommission with null', async () => {
    const user = userEvent.setup();
    updateServiceCommission.mockResolvedValue(service());
    render(
      <CommissionSettingsClient
        initialConfig={config()}
        initialTechnicianConfig={techConfig()}
        initialCategories={[category()]}
        initialServices={[service({ commissionBps: 2900 })]}
        rows={[]}
      />,
    );

    expect(screen.getByText('AC Deep Clean')).toBeInTheDocument();
    // Category lookup by `categoryId` against the loaded `categories` roster. "AC Repair" also
    // appears as the (uninherited) category table's own row, so this asserts at least one match
    // rather than a single one.
    expect(screen.getAllByText('AC Repair').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Inherit global' }));

    await waitFor(() => {
      expect(updateServiceCommission).toHaveBeenCalledWith('ac-deep-clean', null);
    });
    expect(await screen.findByText('Service commission override cleared.')).toBeInTheDocument();
    expect(
      screen.getByText('No services currently carry a commission override.'),
    ).toBeInTheDocument();
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

  // Mirrors the categories-fetch-failure test above, for `loadServices`'s mount-effect path
  // (task 8): omitting `initialServices` is what makes the real mount effect call the (mocked)
  // `fetchAdminServices` in the first place — every other services-roster test above seeds
  // `initialServices` directly and so never exercises `loadServices` at all.
  it('scopes a services-fetch failure to the service-overrides roster and keeps the rest of the page usable', async () => {
    fetchAdminServices.mockRejectedValue(new Error('boom'));
    render(
      <CommissionSettingsClient
        initialConfig={config()}
        initialTechnicianConfig={techConfig()}
        initialCategories={[]}
        rows={[]}
      />,
    );

    expect(
      await screen.findByText('Could not load the service-overrides roster.'),
    ).toBeInTheDocument();
    // The rest of the page — including the global rate editor fed by the same section — must
    // still render and work, per the "fetch independently and degrade" rule.
    expect(screen.getByLabelText('Global commission rate (%)')).toBeInTheDocument();
    expect(within(enforcementRegion()).getByLabelText('Warn threshold (₹)')).toBeInTheDocument();
  });

  // Fix round 1 (I-2): `rupeesToPaise` alone accepts a leading "-" (→ a negative paise value that
  // would still pass a naive `warn < block` comparison) and silently rounds more than 2 decimal
  // places. Both must be rejected before the API ever sees them, with the same
  // invalidThresholdAmount message the blank/non-numeric case already used.
  it('rejects a negative warn threshold without calling the API', async () => {
    const user = userEvent.setup();
    render(
      <CommissionSettingsClient
        initialConfig={config()}
        initialTechnicianConfig={techConfig()}
        initialCategories={[]}
        rows={[]}
      />,
    );

    await setThresholds(user, { warn: '-100' });
    await user.click(within(enforcementRegion()).getByRole('button', { name: /save/i }));

    expect(updateCommissionConfig).not.toHaveBeenCalled();
    expect(await screen.findByText('Enter valid rupee amounts for both thresholds.')).toBeInTheDocument();
  });

  it('rejects a threshold amount with more than 2 decimal places without calling the API', async () => {
    const user = userEvent.setup();
    render(
      <CommissionSettingsClient
        initialConfig={config()}
        initialTechnicianConfig={techConfig()}
        initialCategories={[]}
        rows={[]}
      />,
    );

    await setThresholds(user, { block: '12.345' });
    await user.click(within(enforcementRegion()).getByRole('button', { name: /save/i }));

    expect(updateCommissionConfig).not.toHaveBeenCalled();
    expect(await screen.findByText('Enter valid rupee amounts for both thresholds.')).toBeInTheDocument();
  });
});

// I-1 (fix round 1): the mocked `next-intl` dictionary above proves the component renders a
// *key*; it never reads messages/en.json, so someone could delete the no-repricing consequence
// line, strip "currently carrying a balance" from the impact copy, or reword the threshold-order
// message, and the component suite above would stay green regardless. These three sentences are
// the most expensive copy on this page (design doc §6 ruling + the brief's money-boundary
// warning), so they are pinned here by reading the real message file directly.
describe('the real messages/en.json copy (not the mocked dictionary above)', () => {
  function messageAt(path: string, source: unknown = enMessages, sourceName = 'messages/en.json'): string {
    const value = path.split('.').reduce<unknown>((acc, key) => {
      if (acc !== null && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
        return (acc as Record<string, unknown>)[key];
      }
      return undefined;
    }, source);
    if (typeof value !== 'string') {
      throw new Error(`${sourceName} is missing a string at "${path}"`);
    }
    return value;
  }

  it('states that a rate change never reprices past bookings', () => {
    expect(messageAt('commissions.settings.rates.consequence')).toMatch(
      /Past bookings keep the rate they were priced at/i,
    );
  });

  it('scopes the threshold-impact preview to technicians currently carrying a balance', () => {
    expect(messageAt('commissions.settings.enforcement.impactNone')).toMatch(
      /currently carrying a balance/i,
    );
    expect(messageAt('commissions.settings.enforcement.impact')).toMatch(
      /currently carrying a balance/i,
    );
  });

  // Codex round 2 (P2): the page-scoped variants must exist and must actually say "this page" —
  // matching the exact wording idiom `messages/en.json`'s `summaryBand.technicianCountPartial`
  // already uses for the same "loaded page, not the whole roster" qualifier, rather than a
  // second, differently-worded idiom for the same idea.
  it('labels the page-scoped threshold-impact copy as covering only the loaded page', () => {
    expect(messageAt('commissions.settings.enforcement.impactNonePartial')).toMatch(/on this page/i);
    expect(messageAt('commissions.settings.enforcement.impactPartial')).toMatch(/on this page/i);
    expect(messageAt('commissions.summaryBand.technicianCountPartial')).toMatch(/on this page/i);
  });

  it('states the threshold-order rule as warn below block, matching the client-side check', () => {
    expect(messageAt('commissions.settings.errors.thresholdOrder')).toMatch(/warn.*below.*block/i);
  });

  // Issue #334 task 7: proves the new service-overrides-roster keys exist as real, translated
  // strings in BOTH message files — not a mock. The Hindi assertions in particular guard against
  // the exact `nameHiLabel`-shaped gap this repo has hit before (English fallback text pasted into
  // messages/hi.json): each key is checked against the real hi.json import, not a mocked
  // dictionary, and (separately, in tests/i18n/commissions.i18n.test.tsx) the whole `commissions`
  // namespace is already checked for byte-identical en/hi values.
  it('every new settings.rates/messages/errors key for the service-overrides roster exists as a real string in both en and hi message files', () => {
    for (const path of [
      'commissions.settings.rates.serviceOverridesHeading',
      'commissions.settings.rates.noServiceOverrides',
      'commissions.settings.rates.columns.service',
      'commissions.settings.messages.serviceCleared',
      'commissions.settings.errors.serviceClearFailed',
    ]) {
      expect(messageAt(path)).toEqual(expect.any(String));
      expect(messageAt(path, hiMessages, 'messages/hi.json')).toEqual(expect.any(String));
    }
  });
});
