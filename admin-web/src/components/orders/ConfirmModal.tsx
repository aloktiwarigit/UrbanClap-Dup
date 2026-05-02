'use client';
import { useState } from 'react';

interface ExtraInput {
  label: string;
  value: string;
  onChange: (v: string) => void;
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
  inputLabel = 'Reason',
  inputMinLength = 5,
  extraInput,
}: ConfirmModalProps) {
  const [value, setValue] = useState('');

  const isDisabled =
    loading ||
    value.length < inputMinLength ||
    (extraInput !== undefined && extraInput.value.trim() === '');

  return (
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
            <input
              aria-label={extraInput.label}
              type="text"
              value={extraInput.value}
              onChange={e => extraInput.onChange(e.target.value)}
              className="w-full rounded border border-gray-300 p-2 text-sm"
              placeholder={extraInput.label}
            />
          </div>
        )}

        <label className="block text-sm text-gray-600 mb-1">{inputLabel}</label>
        <textarea
          aria-label={inputLabel}
          rows={3}
          value={value}
          onChange={e => setValue(e.target.value)}
          className="w-full rounded border border-gray-300 p-2 text-sm resize-none"
          placeholder={`Min ${inputMinLength} characters`}
        />

        <div className="flex gap-3 justify-end mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => void onConfirm(value)}
            disabled={isDisabled}
            className="btn btn-primary"
          >
            {loading ? 'Processing…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
