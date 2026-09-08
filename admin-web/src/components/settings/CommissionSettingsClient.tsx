'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { formatINR, formatDate, rupeesToPaise } from '@/lib/format/intl';
import {
  fetchCommissionConfig,
  updateCommissionConfig,
  fetchTechnicianClientConfig,
  updateTechnicianClientConfig,
  fetchAdminCategories,
  updateCategoryCommission,
  fetchCommissionDashboard,
  type CommissionConfig,
  type TechnicianClientConfig,
  type AdminServiceCategory,
  type CommissionDashboardRow,
} from '@/api/commissions';
import { thresholdImpact } from '@/lib/commissions/derive';
import { hasCapability } from '@/admin/capabilities';
import { useAdminAuth } from '@/lib/auth/context';
import { useToast, ToastRegion } from '@/components/ui/Toast';
import { Dialog } from '@/components/ui/Dialog';
import { EmptyState } from '@/components/EmptyState';

type ThresholdImpactRow = Pick<CommissionDashboardRow, 'technicianName' | 'outstandingPaise'>;

export interface CommissionSettingsClientProps {
  // Seeds initial state without the mount-time fetch — used by tests, and available for a future
  // SSR handoff. Each of the four is independent: any one omitted fetches on mount, and (per the
  // lesson from task 7/8) a failure on one never blocks or blanks the others — this screen edits
  // three unrelated documents (commission config, technician-client config, categories) plus a
  // read-only dashboard snapshot, and a hiccup on any one of them should scope its own section,
  // not the page.
  initialConfig?: CommissionConfig;
  initialTechnicianConfig?: TechnicianClientConfig;
  initialCategories?: AdminServiceCategory[];
  // Threshold-impact source rows (design doc §6 ruling, task-9 brief): `/settings/commission` is
  // a separate route from `/finance/commissions` with its own client and no shared state, so this
  // component fetches the dashboard itself (one extra GET) rather than receiving rows from a
  // parent — `rows` exists purely to seed that fetch for tests. The dashboard only ever returns
  // technicians with a non-zero balance or a non-CLEAR state, and only its first page, which is
  // why the impact copy below says "currently carrying a balance" rather than implying full
  // roster coverage.
  rows?: ThresholdImpactRow[];
}

// Only whole percent or up to 2 decimal places (matches the rupee-amount pattern used elsewhere
// in this console) — rejecting anything finer avoids a typo like "22.345" silently rounding.
const PERCENT_PATTERN = /^\d+(\.\d{1,2})?$/;
const MIN_COMMISSION_BPS = 1500;
const MAX_COMMISSION_BPS = 3500;

function parsePercentToBps(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!PERCENT_PATTERN.test(trimmed)) return undefined;
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return undefined;
  return Math.round(value * 100);
}

function formatBpsAsPercent(bps: number): string {
  return (bps / 100).toFixed(2);
}

function isValidCommissionBps(bps: number): boolean {
  return bps >= MIN_COMMISSION_BPS && bps <= MAX_COMMISSION_BPS;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Duck-types the 400 THRESHOLD_ORDER shape rather than checking `instanceof ApiError` (mirrors
 * `isIdempotencyMismatch` in RemittanceDrawer.tsx) — this only has to recognise the shape, not
 * the class, so the same check works against a real `ApiError` and a plain test double alike.
 */
function isThresholdOrderError(err: unknown): boolean {
  if (!isRecord(err) || err.status !== 400) return false;
  const body = err.body;
  return isRecord(body) && body.code === 'THRESHOLD_ORDER';
}

interface FeatureFlags {
  wallet: boolean;
  duesBanner: boolean;
  upiQr: boolean;
  incentives: boolean;
  addOnRequests: boolean;
}

const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  wallet: false,
  duesBanner: false,
  upiQr: false,
  incentives: false,
  addOnRequests: false,
};

/**
 * The commission console's settings screen (design doc §6, task-9 brief) — where the owner
 * changes commission rates, hold thresholds, and the technician app's feature flags. Gated
 * entirely on `settings.manage` (super-admin only): a role without it sees a not-authorized
 * state and nothing else on this page ever fetches or renders.
 *
 * Three sections, deliberately kept apart by a rule each (design doc §6): Rates is money
 * arithmetic that only ever affects bookings created after a change — the accompanying
 * consequence line exists because assuming a rate edit repriced history is the single most
 * expensive misunderstanding available on this page. Enforcement is behaviour affecting
 * dispatch, and `holdEnforcementEnabled` — the one switch here that decides whether technicians
 * stop receiving work — is gated behind an explicit confirm step. Technician app features are a
 * third, unrelated document.
 */
export function CommissionSettingsClient({
  initialConfig,
  initialTechnicianConfig,
  initialCategories,
  rows: initialRows,
}: CommissionSettingsClientProps) {
  const t = useTranslations('commissions');
  const locale = useLocale();
  const { auth } = useAdminAuth();
  const canManage = hasCapability(auth?.role, 'settings.manage');
  const { toast, show, dismiss } = useToast();

  const [config, setConfig] = useState<CommissionConfig | null>(initialConfig ?? null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [rateSaving, setRateSaving] = useState(false);
  const [rateTouched, setRateTouched] = useState(false);
  const [globalRateInput, setGlobalRateInput] = useState(
    initialConfig !== undefined ? formatBpsAsPercent(initialConfig.defaultCommissionBps) : '',
  );

  const [thresholdsTouched, setThresholdsTouched] = useState(false);
  const [warnRupeesInput, setWarnRupeesInput] = useState(
    initialConfig !== undefined ? String(initialConfig.warnThresholdPaise / 100) : '',
  );
  const [blockRupeesInput, setBlockRupeesInput] = useState(
    initialConfig !== undefined ? String(initialConfig.blockThresholdPaise / 100) : '',
  );
  const [kycTouched, setKycTouched] = useState(false);
  const [kycChecked, setKycChecked] = useState(initialConfig?.enforceKycInDispatch ?? false);
  const [enforcementSaving, setEnforcementSaving] = useState(false);
  const [enforcementValidationError, setEnforcementValidationError] = useState<string | null>(null);

  const [holdConfirmOpen, setHoldConfirmOpen] = useState(false);
  const [pendingHoldEnforcement, setPendingHoldEnforcement] = useState(false);
  const [holdEnforcementSaving, setHoldEnforcementSaving] = useState(false);

  const [techConfig, setTechConfig] = useState<TechnicianClientConfig | null>(
    initialTechnicianConfig ?? null,
  );
  const [featuresError, setFeaturesError] = useState<string | null>(null);
  const [featuresTouched, setFeaturesTouched] = useState(false);
  const [featuresDraft, setFeaturesDraft] = useState<FeatureFlags>({
    ...DEFAULT_FEATURE_FLAGS,
    ...(initialTechnicianConfig?.features ?? {}),
  });
  const [featuresSaving, setFeaturesSaving] = useState(false);

  const [categories, setCategories] = useState<AdminServiceCategory[] | null>(
    initialCategories ?? null,
  );
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const categoryDraftsInitialized = useRef(false);
  const [categoryDrafts, setCategoryDrafts] = useState<Record<string, string>>({});
  const [categorySavingId, setCategorySavingId] = useState<string | null>(null);

  const [dashboardRows, setDashboardRows] = useState<ThresholdImpactRow[] | undefined>(initialRows);
  const [rowsError, setRowsError] = useState<string | null>(null);

  const globalRateId = useId();
  const warnId = useId();
  const blockId = useId();
  const kycId = useId();
  const holdEnforcementId = useId();
  const walletId = useId();
  const duesBannerId = useId();
  const upiQrId = useId();
  const incentivesId = useId();
  const addOnRequestsId = useId();

  // Each load* function owns exactly one document and one error state — see the prop doc comment
  // above for why. None of these run at all for a role without settings.manage (guarded in the
  // mount effect below), so an unauthorized viewer triggers zero network calls.
  const loadConfig = useCallback(async () => {
    setConfigError(null);
    try {
      const c = await fetchCommissionConfig();
      setConfig(c);
    } catch {
      setConfigError(t('settings.errors.configLoadFailed'));
    }
  }, [t]);

  const loadFeatures = useCallback(async () => {
    setFeaturesError(null);
    try {
      const c = await fetchTechnicianClientConfig();
      setTechConfig(c);
    } catch {
      setFeaturesError(t('settings.errors.featuresLoadFailed'));
    }
  }, [t]);

  const loadCategories = useCallback(async () => {
    setCategoriesError(null);
    try {
      const list = await fetchAdminCategories();
      setCategories(list);
    } catch {
      setCategoriesError(t('settings.errors.categoriesLoadFailed'));
    }
  }, [t]);

  const loadRows = useCallback(async () => {
    setRowsError(null);
    try {
      const dashboard = await fetchCommissionDashboard();
      setDashboardRows(dashboard.technicians);
    } catch {
      setRowsError(t('settings.errors.rowsLoadFailed'));
    }
  }, [t]);

  useEffect(() => {
    if (!canManage) return;
    if (initialConfig === undefined) void loadConfig();
    if (initialTechnicianConfig === undefined) void loadFeatures();
    if (initialCategories === undefined) void loadCategories();
    if (initialRows === undefined) void loadRows();
    // Mount-only, and only when authorized — see the load* functions' own doc note.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage]);

  // Populates the rate/threshold/KYC form fields from `config` the first time it becomes
  // available (mount-time fetch resolves after first render), without ever clobbering an edit
  // the operator has already started typing.
  useEffect(() => {
    if (config === null) return;
    if (!rateTouched) setGlobalRateInput(formatBpsAsPercent(config.defaultCommissionBps));
    if (!thresholdsTouched) {
      setWarnRupeesInput(String(config.warnThresholdPaise / 100));
      setBlockRupeesInput(String(config.blockThresholdPaise / 100));
    }
    if (!kycTouched) setKycChecked(config.enforceKycInDispatch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  useEffect(() => {
    if (techConfig === null || featuresTouched) return;
    setFeaturesDraft({ ...DEFAULT_FEATURE_FLAGS, ...(techConfig.features ?? {}) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [techConfig]);

  // Category override drafts initialise once, from whichever categories first load — after that,
  // a row's draft only changes via the operator typing or a successful save (see
  // handleSaveCategory/handleClearCategory), never by re-running this effect.
  useEffect(() => {
    if (categories === null || categoryDraftsInitialized.current) return;
    categoryDraftsInitialized.current = true;
    const drafts: Record<string, string> = {};
    for (const category of categories) {
      if (category.commissionBps !== undefined) {
        drafts[category.id] = formatBpsAsPercent(category.commissionBps);
      }
    }
    setCategoryDrafts(drafts);
  }, [categories]);

  async function handleSaveGlobalRate() {
    const bps = parsePercentToBps(globalRateInput);
    if (bps === undefined || !isValidCommissionBps(bps)) {
      show(t('settings.rates.invalidRate'), 'error');
      return;
    }
    setRateSaving(true);
    try {
      const updated = await updateCommissionConfig({ defaultCommissionBps: bps });
      setConfig(updated);
      show(t('settings.messages.rateSaved'), 'success');
    } catch {
      show(t('settings.errors.rateSaveFailed'), 'error');
    } finally {
      setRateSaving(false);
    }
  }

  async function handleSaveEnforcement() {
    setEnforcementValidationError(null);
    const warnPaise = rupeesToPaise(warnRupeesInput);
    const blockPaise = rupeesToPaise(blockRupeesInput);
    if (warnPaise === undefined || blockPaise === undefined) {
      setEnforcementValidationError(t('settings.errors.invalidThresholdAmount'));
      return;
    }
    if (warnPaise >= blockPaise) {
      setEnforcementValidationError(t('settings.errors.thresholdOrder'));
      return;
    }
    setEnforcementSaving(true);
    try {
      const updated = await updateCommissionConfig({
        warnThresholdPaise: warnPaise,
        blockThresholdPaise: blockPaise,
        enforceKycInDispatch: kycChecked,
      });
      setConfig(updated);
      show(t('settings.messages.enforcementSaved'), 'success');
    } catch (err) {
      // Both the client-side pre-check above and a same-shaped 400 from the server (e.g. a race
      // against a concurrent edit that slipped past the check) must say the identical sentence —
      // the brief's requirement, satisfied by routing both through the same translation key.
      if (isThresholdOrderError(err)) {
        setEnforcementValidationError(t('settings.errors.thresholdOrder'));
      } else {
        show(t('settings.errors.enforcementSaveFailed'), 'error');
      }
    } finally {
      setEnforcementSaving(false);
    }
  }

  function handleHoldEnforcementClick() {
    if (config === null) return;
    setPendingHoldEnforcement(!config.holdEnforcementEnabled);
    setHoldConfirmOpen(true);
  }

  async function handleConfirmHoldEnforcement() {
    setHoldEnforcementSaving(true);
    try {
      const updated = await updateCommissionConfig({ holdEnforcementEnabled: pendingHoldEnforcement });
      setConfig(updated);
      setHoldConfirmOpen(false);
      show(t('settings.messages.holdEnforcementSaved'), 'success');
    } catch {
      show(t('settings.errors.holdEnforcementSaveFailed'), 'error');
    } finally {
      setHoldEnforcementSaving(false);
    }
  }

  async function handleSaveFeatures() {
    setFeaturesSaving(true);
    try {
      const updated = await updateTechnicianClientConfig({ features: featuresDraft });
      setTechConfig(updated);
      show(t('settings.messages.featuresSaved'), 'success');
    } catch {
      show(t('settings.errors.featuresSaveFailed'), 'error');
    } finally {
      setFeaturesSaving(false);
    }
  }

  async function handleSaveCategory(categoryId: string) {
    const draft = categoryDrafts[categoryId] ?? '';
    const bps = parsePercentToBps(draft);
    if (bps === undefined || !isValidCommissionBps(bps)) {
      show(t('settings.rates.invalidRate'), 'error');
      return;
    }
    setCategorySavingId(categoryId);
    try {
      const updated = await updateCategoryCommission(categoryId, bps);
      setCategories((prev) => prev?.map((c) => (c.id === categoryId ? updated : c)) ?? prev);
      setCategoryDrafts((prev) => ({ ...prev, [categoryId]: formatBpsAsPercent(bps) }));
      show(t('settings.messages.categorySaved'), 'success');
    } catch {
      show(t('settings.errors.categorySaveFailed'), 'error');
    } finally {
      setCategorySavingId(null);
    }
  }

  async function handleClearCategory(categoryId: string) {
    setCategorySavingId(categoryId);
    try {
      const updated = await updateCategoryCommission(categoryId, null);
      setCategories((prev) => prev?.map((c) => (c.id === categoryId ? updated : c)) ?? prev);
      setCategoryDrafts((prev) => {
        const next = { ...prev };
        delete next[categoryId];
        return next;
      });
      show(t('settings.messages.categorySaved'), 'success');
    } catch {
      show(t('settings.errors.categorySaveFailed'), 'error');
    } finally {
      setCategorySavingId(null);
    }
  }

  if (!canManage) {
    return (
      <div className="p-[var(--space-6)]">
        <EmptyState
          eyebrow={t('settings.notAuthorized.eyebrow')}
          headline={t('settings.notAuthorized.headline')}
          copy={t('settings.notAuthorized.copy')}
        />
      </div>
    );
  }

  const configUpdatedByLine =
    config !== null
      ? t('settings.updatedBy', { actor: config.updatedBy, date: formatDate(config.updatedAt, locale) })
      : null;

  // Threshold impact (design doc §6 ruling): computed live from whatever `blockRupeesInput`
  // currently contains, against whichever dashboard rows resolved — never against the saved
  // config, so the operator sees the effect of what they are about to save. Renders nothing (not
  // a misleading zero) until rows have actually loaded.
  const candidateBlockPaise = rupeesToPaise(blockRupeesInput);
  const impact =
    dashboardRows !== undefined && candidateBlockPaise !== undefined
      ? thresholdImpact(dashboardRows, candidateBlockPaise)
      : null;

  return (
    <div className="p-[var(--space-6)] space-y-[var(--space-8)]">
      <h1 className="text-[length:var(--text-2xl)] font-bold text-[var(--color-text)]">
        {t('settings.heading')}
      </h1>

      <section aria-labelledby="settings-rates-heading" className="space-y-[var(--space-4)]">
        <h2
          id="settings-rates-heading"
          className="text-[length:var(--text-lg)] font-semibold text-[var(--color-text)]"
        >
          {t('settings.rates.heading')}
        </h2>
        <p className="text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
          {t('settings.rates.consequence')}
        </p>

        {config === null ? (
          <p className="text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
            {configError ?? t('settings.loading')}
          </p>
        ) : (
          <>
            <div className="flex items-end gap-[var(--space-3)]">
              <label
                htmlFor={globalRateId}
                className="flex flex-col gap-1 text-xs text-[var(--color-text-muted)]"
              >
                {t('settings.rates.globalLabel')}
                <input
                  id={globalRateId}
                  type="text"
                  inputMode="decimal"
                  value={globalRateInput}
                  onChange={(e) => {
                    setRateTouched(true);
                    setGlobalRateInput(e.target.value);
                  }}
                  className="w-32 px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-right font-mono tabular-nums text-[var(--color-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                />
              </label>
              <button
                type="button"
                onClick={() => void handleSaveGlobalRate()}
                disabled={rateSaving}
                className="px-4 py-2 rounded bg-[var(--color-brand)] text-[var(--color-brand-fg)] text-sm font-medium disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
              >
                {t('settings.rates.globalSave')}
              </button>
            </div>
            {configUpdatedByLine !== null && (
              <p className="text-xs text-[var(--color-text-faint)]">{configUpdatedByLine}</p>
            )}

            <div className="pt-[var(--space-3)] space-y-[var(--space-2)]">
              <h3 className="text-[length:var(--text-sm)] font-semibold text-[var(--color-text)]">
                {t('settings.rates.categoryTableHeading')}
              </h3>
              {categoriesError !== null && (
                <p className="text-xs text-[var(--color-warn)]">{categoriesError}</p>
              )}
              {categoriesError === null && categories === null && (
                <p className="text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
                  {t('settings.loading')}
                </p>
              )}
              {categories !== null && categories.length === 0 && (
                <p className="text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
                  {t('settings.rates.categoryTableEmpty')}
                </p>
              )}
              {categories !== null && categories.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-[length:var(--text-sm)]">
                    <thead>
                      <tr className="text-left text-xs text-[var(--color-text-muted)]">
                        <th scope="col">{t('settings.rates.columns.category')}</th>
                        <th scope="col" className="text-right">
                          {t('settings.rates.columns.effectiveRate')}
                        </th>
                        <th scope="col">{t('settings.rates.columns.status')}</th>
                        <th scope="col">{t('settings.rates.columns.override')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((category) => {
                        const isOverride = category.commissionBps !== undefined;
                        const effectiveBps = category.commissionBps ?? config.defaultCommissionBps;
                        const draft = categoryDrafts[category.id] ?? '';
                        const saving = categorySavingId === category.id;
                        return (
                          <tr key={category.id} className="border-t border-[var(--color-border)]">
                            <td className="py-[var(--space-2)] text-[var(--color-text)]">
                              {category.name}
                            </td>
                            <td className="text-right font-mono tabular-nums text-[var(--color-text)]">
                              {formatBpsAsPercent(effectiveBps)}%
                            </td>
                            <td className="text-[var(--color-text-muted)]">
                              {isOverride
                                ? t('settings.rates.statusOverride')
                                : t('settings.rates.statusInherited')}
                            </td>
                            <td>
                              <div className="flex items-center gap-[var(--space-2)]">
                                <input
                                  aria-label={t('settings.rates.columns.override')}
                                  type="text"
                                  inputMode="decimal"
                                  placeholder={formatBpsAsPercent(effectiveBps)}
                                  value={draft}
                                  onChange={(e) =>
                                    setCategoryDrafts((prev) => ({
                                      ...prev,
                                      [category.id]: e.target.value,
                                    }))
                                  }
                                  className="w-20 px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-right font-mono tabular-nums text-[var(--color-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                                />
                                <button
                                  type="button"
                                  onClick={() => void handleSaveCategory(category.id)}
                                  disabled={saving}
                                  className="px-2 py-1 rounded border border-[var(--color-border)] text-xs text-[var(--color-text)] disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                                >
                                  {t('settings.rates.setOverride')}
                                </button>
                                {isOverride && (
                                  <button
                                    type="button"
                                    onClick={() => void handleClearCategory(category.id)}
                                    disabled={saving}
                                    className="px-2 py-1 rounded border border-[var(--color-border)] text-xs text-[var(--color-text-muted)] disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                                  >
                                    {t('settings.rates.clearOverride')}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      <hr className="border-[var(--color-border)]" />

      <section aria-labelledby="settings-enforcement-heading" className="space-y-[var(--space-4)]">
        <h2
          id="settings-enforcement-heading"
          className="text-[length:var(--text-lg)] font-semibold text-[var(--color-text)]"
        >
          {t('settings.enforcement.heading')}
        </h2>

        {config === null ? (
          <p className="text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
            {configError ?? t('settings.loading')}
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-end gap-[var(--space-3)]">
              <label htmlFor={warnId} className="flex flex-col gap-1 text-xs text-[var(--color-text-muted)]">
                {t('settings.enforcement.warnLabel')}
                <input
                  id={warnId}
                  type="text"
                  inputMode="decimal"
                  value={warnRupeesInput}
                  onChange={(e) => {
                    setThresholdsTouched(true);
                    setWarnRupeesInput(e.target.value);
                  }}
                  className="w-32 px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-right font-mono tabular-nums text-[var(--color-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                />
              </label>
              <label htmlFor={blockId} className="flex flex-col gap-1 text-xs text-[var(--color-text-muted)]">
                {t('settings.enforcement.blockLabel')}
                <input
                  id={blockId}
                  type="text"
                  inputMode="decimal"
                  value={blockRupeesInput}
                  onChange={(e) => {
                    setThresholdsTouched(true);
                    setBlockRupeesInput(e.target.value);
                  }}
                  className="w-32 px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-right font-mono tabular-nums text-[var(--color-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                />
              </label>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">{t('settings.enforcement.appliesWithin')}</p>

            {rowsError !== null && <p className="text-xs text-[var(--color-warn)]">{rowsError}</p>}
            {impact !== null && (
              <p data-testid="threshold-impact" className="text-[length:var(--text-sm)] text-[var(--color-text)]">
                {impact.blockedCount === 0
                  ? t('settings.enforcement.impactNone', { amount: formatINR(candidateBlockPaise ?? 0, locale) })
                  : t('settings.enforcement.impact', {
                      amount: formatINR(candidateBlockPaise ?? 0, locale),
                      count: impact.blockedCount,
                      names: impact.sample.join(', '),
                    })}
              </p>
            )}

            {enforcementValidationError !== null && (
              <p role="alert" className="text-xs text-[var(--color-danger)]">
                {enforcementValidationError}
              </p>
            )}

            <label htmlFor={kycId} className="flex items-center gap-2 text-[length:var(--text-sm)] text-[var(--color-text)]">
              <input
                id={kycId}
                type="checkbox"
                checked={kycChecked}
                onChange={(e) => {
                  setKycTouched(true);
                  setKycChecked(e.target.checked);
                }}
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
              />
              {t('settings.enforcement.enforceKycLabel')}
            </label>

            <button
              type="button"
              onClick={() => void handleSaveEnforcement()}
              disabled={enforcementSaving}
              className="px-4 py-2 rounded bg-[var(--color-brand)] text-[var(--color-brand-fg)] text-sm font-medium disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
            >
              {t('settings.enforcement.save')}
            </button>

            <div className="pt-[var(--space-3)]">
              <label
                htmlFor={holdEnforcementId}
                className="flex items-center gap-2 text-[length:var(--text-sm)] text-[var(--color-text)]"
              >
                <input
                  id={holdEnforcementId}
                  type="checkbox"
                  checked={config.holdEnforcementEnabled}
                  // Clicking this checkbox must never toggle it directly — the whole point of the
                  // confirm step is that the value only changes after the operator has read the
                  // consequence and agreed to it. `preventDefault` on the click stops the browser
                  // from flipping `checked` before React ever sees a state change; `onChange` is a
                  // required no-op on a controlled input.
                  onClick={(e) => {
                    e.preventDefault();
                    handleHoldEnforcementClick();
                  }}
                  onChange={() => {}}
                  className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                />
                {t('settings.enforcement.holdEnforcementLabel')}
              </label>
            </div>
            {configUpdatedByLine !== null && (
              <p className="text-xs text-[var(--color-text-faint)]">{configUpdatedByLine}</p>
            )}
          </>
        )}
      </section>

      <hr className="border-[var(--color-border)]" />

      <section aria-labelledby="settings-features-heading" className="space-y-[var(--space-4)]">
        <h2
          id="settings-features-heading"
          className="text-[length:var(--text-lg)] font-semibold text-[var(--color-text)]"
        >
          {t('settings.features.heading')}
        </h2>

        {featuresError !== null && <p className="text-xs text-[var(--color-warn)]">{featuresError}</p>}
        {featuresError === null && techConfig === null && (
          <p className="text-[length:var(--text-sm)] text-[var(--color-text-muted)]">{t('settings.loading')}</p>
        )}
        {techConfig !== null && (
          <>
            <div className="flex flex-col gap-[var(--space-2)]">
              {(
                [
                  ['wallet', walletId, t('settings.features.wallet')],
                  ['duesBanner', duesBannerId, t('settings.features.duesBanner')],
                  ['upiQr', upiQrId, t('settings.features.upiQr')],
                  ['incentives', incentivesId, t('settings.features.incentives')],
                  ['addOnRequests', addOnRequestsId, t('settings.features.addOnRequests')],
                ] as const
              ).map(([key, id, label]) => (
                <label
                  key={key}
                  htmlFor={id}
                  className="flex items-center gap-2 text-[length:var(--text-sm)] text-[var(--color-text)]"
                >
                  <input
                    id={id}
                    type="checkbox"
                    checked={featuresDraft[key]}
                    onChange={(e) => {
                      setFeaturesTouched(true);
                      setFeaturesDraft((prev) => ({ ...prev, [key]: e.target.checked }));
                    }}
                    className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                  />
                  {label}
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void handleSaveFeatures()}
              disabled={featuresSaving}
              className="px-4 py-2 rounded bg-[var(--color-brand)] text-[var(--color-brand-fg)] text-sm font-medium disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
            >
              {t('settings.features.save')}
            </button>
            {techConfig.updatedBy !== undefined && techConfig.updatedAt !== undefined && (
              <p className="text-xs text-[var(--color-text-faint)]">
                {t('settings.updatedBy', {
                  actor: techConfig.updatedBy,
                  date: formatDate(techConfig.updatedAt, locale),
                })}
              </p>
            )}
          </>
        )}
      </section>

      <Dialog
        open={holdConfirmOpen}
        onClose={() => setHoldConfirmOpen(false)}
        title={
          pendingHoldEnforcement
            ? t('settings.enforcement.confirmEnableTitle')
            : t('settings.enforcement.confirmDisableTitle')
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setHoldConfirmOpen(false)}
              className="px-4 py-2 rounded border border-[var(--color-border)] text-sm text-[var(--color-text)]"
            >
              {t('settings.enforcement.confirmCancel')}
            </button>
            <button
              type="button"
              onClick={() => void handleConfirmHoldEnforcement()}
              disabled={holdEnforcementSaving}
              className="px-4 py-2 rounded bg-[var(--color-brand)] text-[var(--color-brand-fg)] text-sm font-medium disabled:opacity-40"
            >
              {t('settings.enforcement.confirmConfirm')}
            </button>
          </>
        }
      >
        <p>
          {pendingHoldEnforcement
            ? t('settings.enforcement.confirmEnableBody')
            : t('settings.enforcement.confirmDisableBody')}
        </p>
      </Dialog>

      <ToastRegion toast={toast} onDismiss={dismiss} />
    </div>
  );
}
