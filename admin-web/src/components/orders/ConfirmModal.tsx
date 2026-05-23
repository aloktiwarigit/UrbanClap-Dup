'use client';
import { useEffect, useState } from 'react';
import FocusLock from 'react-focus-lock';
import { useTranslations } from 'next-intl';

interface ExtraInput {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  disabled?: boolean;
  helperText?: string;
}

interface ConfirmModalProps {
  title: string;
  onCancel: () => void;
  onConfirm: (reason: string) => Promise<void>;
  loading: boolean;
  inputLabel?: string;
  inputMinLength?: number;
  extraInput?: ExtraInput;
}

export function ConfirmModal({
  title,
  onCancel,
  onConfirm,
  loading,
  inputLabel,
  inputMinLength = 5,
  extraInput,
}: ConfirmModalProps) {
  const t = useTranslations('orders');
  const resolvedInputLabel = inputLabel ?? t('confirmModal.reasonLabel');
  const [value, setValue] = useState('');

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  const isDisabled =
    loading ||
    value.length < inputMinLength ||
    (extraInput !== undefined && (extraInput.disabled === true || extraInput.value.trim() === ''));

  return (
    <FocusLock returnFocus>
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
    >
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h2 id="confirm-modal-title" className="text-lg font-semibold text-gray-800 mb-3">
          {title}
        </h2>

        {extraInput && (
          <div className="mb-3">
            <label className="block text-sm text-gray-600 mb-1">{extraInput.label}</label>
            {extraInput.options ? (
              <select
                aria-label={extraInput.label}
                value={extraInput.value}
                onChange={e => extraInput.onChange(e.target.value)}
                disabled={extraInput.disabled}
                className="w-full rounded border border-gray-300 p-2 text-sm"
              >
                <option value="">{extraInput.placeholder ?? t('confirmModal.selectPlaceholder', { label: extraInput.label })}</option>
                {extraInput.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                aria-label={extraInput.label}
                type="text"
                value={extraInput.value}
                onChange={e => extraInput.onChange(e.target.value)}
                disabled={extraInput.disabled}
                className="w-full rounded border border-gray-300 p-2 text-sm"
                placeholder={extraInput.placeholder ?? extraInput.label}
              />
            )}
            {extraInput.helperText && (
              <p className="mt-1 text-xs text-gray-500">{extraInput.helperText}</p>
            )}
          </div>
        )}

        <label className="block text-sm text-gray-600 mb-1">{resolvedInputLabel}</label>
        <textarea
          aria-label={resolvedInputLabel}
          rows={3}
          value={value}
          onChange={e => setValue(e.target.value)}
          className="w-full rounded border border-gray-300 p-2 text-sm resize-none"
          placeholder={t('confirmModal.minCharactersHint', { min: inputMinLength })}
        />

        <div className="flex gap-3 justify-end mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
          >
            {t('confirmModal.cancelButton')}
          </button>
          <button
            onClick={() => void onConfirm(value)}
            disabled={isDisabled}
            className="btn btn-primary"
          >
            {loading ? t('confirmModal.submitButton.loading') : t('confirmModal.submitButton.label')}
          </button>
        </div>
      </div>
    </div>
    </FocusLock>
  );
}
