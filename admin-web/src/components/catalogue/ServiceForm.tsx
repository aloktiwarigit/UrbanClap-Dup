'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { components, operations } from '@/api/generated/schema';
import { useAdminAuth } from '@/lib/auth/context';

export type AdminService = components['schemas']['AdminService'];

type CreateServiceBody = NonNullable<
  operations['adminCreateService']['requestBody']
>['content']['application/json'];

type UpdateServiceBody = NonNullable<
  operations['adminUpdateService']['requestBody']
>['content']['application/json'];

export interface ServiceFormProps {
  categoryId: string;
  initial?: AdminService;
  onSubmit: (data: CreateServiceBody | UpdateServiceBody) => Promise<void>;
  onCancel: () => void;
}

export function ServiceForm({ categoryId, initial, onSubmit, onCancel }: ServiceFormProps) {
  const t = useTranslations('catalogue');
  const { auth } = useAdminAuth();
  // Fix round 3 (task 9): mirrors the API's own field-level guard exactly
  // (`commissionBpsForbidden` in catalogue-admin.ts checks `admin.role !== 'super-admin'`), not a
  // capability, so the two can never drift independently. An ops-manager should not see a control
  // they are not permitted to use — rendering it and then 403ing on submit would be worse than
  // not offering it.
  const canSetCommission = auth?.role === 'super-admin';
  const [id, setId] = useState(initial?.id ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [nameHi, setNameHi] = useState(initial?.nameHi ?? '');
  const [shortDescription, setShortDescription] = useState(initial?.shortDescription ?? '');
  const [shortDescriptionHi, setShortDescriptionHi] = useState(initial?.shortDescriptionHi ?? '');
  const [heroImageUrl, setHeroImageUrl] = useState(initial?.heroImageUrl ?? '');
  const [basePrice, setBasePrice] = useState(String(initial?.basePrice ?? ''));
  const [durationMinutes, setDurationMinutes] = useState(String(initial?.durationMinutes ?? ''));
  // Fix round 3: no more '2250' default. An empty field means "no change" on edit and "inherit
  // the category/global rate" on create — both are expressed by omitting the key entirely, never
  // by sending a value nobody typed. Seeded from `initial?.commissionBps` on edit so the
  // "unchanged" comparison in handleSubmit has something real to compare against.
  const [commissionBps, setCommissionBps] = useState(
    initial?.commissionBps !== undefined ? String(initial.commissionBps) : '',
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = initial !== undefined;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const basePriceNum = parseInt(basePrice, 10);
    const durationNum = parseInt(durationMinutes, 10);

    if (isNaN(basePriceNum) || isNaN(durationNum)) {
      setError(t('serviceForm.validationError'));
      return;
    }

    // Fix round 3 (task 9, I-4 regression): `commissionBps` is validated and included only when
    // three things are all true — the field is rendered at all (`canSetCommission`, i.e. the
    // signed-in admin is a super-admin), the operator actually typed something into it (an empty
    // field means "no change" on edit / "inherit" on create, never a value to send), and that
    // value differs from what the service already has (`initial?.commissionBps`). This closes two
    // problems at once:
    //   1. The API's field-level guard (`commissionBpsForbidden` in catalogue-admin.ts) 403s any
    //      non-super-admin request carrying the key at all — so an ops-manager editing a service's
    //      name or price must never send it, whatever residual state this field happens to hold.
    //   2. Independently of authorization: before this fix, every edit re-sent whatever number was
    //      showing (defaulted to 2250 on create) even when the operator never looked at the
    //      commission field, so a stale or rounded figure could be silently rewritten by an edit
    //      that had nothing to do with rates. Sending the key only on an actual, deliberate change
    //      removes that risk regardless of who is submitting.
    let commissionPatch: { commissionBps: number } | Record<string, never> = {};
    if (canSetCommission) {
      const trimmedCommission = commissionBps.trim();
      if (trimmedCommission !== '') {
        const commissionNum = parseInt(trimmedCommission, 10);
        if (isNaN(commissionNum)) {
          setError(t('serviceForm.validationError'));
          return;
        }
        if (commissionNum < 1500 || commissionNum > 3500) {
          setError(t('serviceForm.commissionRangeError'));
          return;
        }
        if (commissionNum !== initial?.commissionBps) {
          commissionPatch = { commissionBps: commissionNum };
        }
      }
    }

    // P0-3: this form owns exactly these five fields plus the conditional commissionBps above.
    //
    // On EDIT it must send only them. The update body is a partial patch, so every
    // field omitted here is preserved server-side. Previously this sent `includes`,
    // `faq`, `addOns` and `photoStages` as empty arrays — because the schema wrongly
    // required them — and the server merged those in, wiping the service's content on
    // every price change. `photoStages` drives the technician guided-photo flow
    // (E06-S02), so a completed job silently lost its evidence chain.
    const edited = {
      name,
      shortDescription,
      heroImageUrl,
      basePrice: basePriceNum,
      durationMinutes: durationNum,
      ...commissionPatch,
      // nameHi / shortDescriptionHi are `.min(1)` server-side. An empty string is
      // omitted rather than sent, so a blank Hindi field neither wipes nor rejects.
      ...(nameHi.trim() !== '' ? { nameHi: nameHi.trim() } : {}),
      ...(shortDescriptionHi.trim() !== '' ? { shortDescriptionHi: shortDescriptionHi.trim() } : {}),
    };

    const data: CreateServiceBody | UpdateServiceBody = isEdit
      ? edited
      : {
          ...edited,
          id,
          categoryId,
          // CREATE still requires the content arrays — a brand-new service genuinely
          // has none yet. Editors for them land with the rate-editor completion story.
          includes: [] as string[],
          faq: [] as { question: string; answer: string }[],
          addOns: [] as { id: string; name: string; price: number; triggerCondition: string }[],
          photoStages: [] as { id: string; label: string; required: boolean }[],
        };

    setSubmitting(true);
    try {
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('serviceForm.submissionError'));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxWidth: '480px' }}>
      {!isEdit && (
        <div>
          <label htmlFor="svc-id" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
            {t('serviceForm.idLabel')}
          </label>
          <input
            id="svc-id"
            className="input"
            type="text"
            required
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder={t('serviceForm.idPlaceholder')}
          />
        </div>
      )}

      <div>
        <label htmlFor="svc-name" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
          {t('serviceForm.nameLabel')}
        </label>
        <input
          id="svc-name"
          className="input"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('serviceForm.namePlaceholder')}
        />
      </div>

      <div>
        <label htmlFor="svc-name-hi" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
          {t('serviceForm.nameHiLabel')}
        </label>
        <input
          id="svc-name-hi"
          className="input"
          type="text"
          lang="hi"
          value={nameHi}
          onChange={(e) => setNameHi(e.target.value)}
          placeholder={t('serviceForm.nameHiPlaceholder')}
        />
      </div>

      <div>
        <label htmlFor="svc-desc" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
          {t('serviceForm.descriptionLabel')}
        </label>
        <input
          id="svc-desc"
          className="input"
          type="text"
          required
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          placeholder={t('serviceForm.descriptionPlaceholder')}
        />
      </div>

      <div>
        <label htmlFor="svc-desc-hi" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
          {t('serviceForm.descriptionHiLabel')}
        </label>
        <input
          id="svc-desc-hi"
          className="input"
          type="text"
          lang="hi"
          value={shortDescriptionHi}
          onChange={(e) => setShortDescriptionHi(e.target.value)}
          placeholder={t('serviceForm.descriptionHiPlaceholder')}
        />
      </div>

      <div>
        <label htmlFor="svc-hero" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
          {t('serviceForm.heroImageLabel')}
        </label>
        <input
          id="svc-hero"
          className="input"
          type="url"
          required
          value={heroImageUrl}
          onChange={(e) => setHeroImageUrl(e.target.value)}
          placeholder={t('serviceForm.heroImagePlaceholder')}
        />
      </div>

      <div>
        <label htmlFor="svc-price" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
          {t('serviceForm.priceLabel')}
        </label>
        <input
          id="svc-price"
          className="input"
          type="number"
          required
          min={0}
          value={basePrice}
          onChange={(e) => setBasePrice(e.target.value)}
          placeholder={t('serviceForm.pricePlaceholder')}
        />
      </div>

      <div>
        <label htmlFor="svc-duration" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
          {t('serviceForm.durationLabel')}
        </label>
        <input
          id="svc-duration"
          className="input"
          type="number"
          required
          min={1}
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(e.target.value)}
          placeholder={t('serviceForm.durationPlaceholder')}
        />
      </div>

      {canSetCommission && (
        <div>
          <label htmlFor="svc-commission" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
            {t('serviceForm.commissionLabel')}
          </label>
          <input
            id="svc-commission"
            className="input"
            type="number"
            min={1500}
            max={3500}
            value={commissionBps}
            onChange={(e) => setCommissionBps(e.target.value)}
            placeholder={t('serviceForm.commissionPlaceholder')}
          />
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: 'var(--space-1) 0 0 0' }}>
            {t('serviceForm.commissionHint')}
          </p>
        </div>
      )}

      {error !== null && (
        <p style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)', margin: 0 }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: 'var(--space-2) var(--space-4)',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-brand)',
            color: 'var(--color-brand-fg)',
            border: 'none',
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? t('serviceForm.savingState') : isEdit ? t('serviceForm.updateButton') : t('serviceForm.createButton')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: 'var(--space-2) var(--space-4)',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface-alt)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            cursor: 'pointer',
          }}
        >
          {t('serviceForm.cancelButton')}
        </button>
      </div>
    </form>
  );
}
