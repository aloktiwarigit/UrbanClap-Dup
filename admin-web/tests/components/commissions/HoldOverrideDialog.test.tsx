import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HoldOverrideDialog } from '../../../src/components/commissions/HoldOverrideDialog';

// Codex round 3 (P2): a successful save closes this dialog from the *parent* (flipping `open` to
// false) rather than through `handleClose` — `Dialog` renders nothing while `open` is false, but
// `HoldOverrideDialog` itself stays mounted holding the previous date/reason/touched state. Reopen
// for the same (or another) technician and the old values reappeared, submittable by accident. The
// fix resets on the `open` transition itself, matching `RemittanceDrawer`'s own open effect.

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const dictionary: Record<string, string> = {
      'detail.override.dialogTitle': 'Set hold override',
      'detail.override.untilLabel': 'Override until',
      'detail.override.untilRequired': 'A date is required.',
      'detail.override.reasonLabel': 'Reason',
      'detail.override.reasonRequired': 'A reason is required.',
      'detail.override.save': 'Save override',
      'detail.override.cancel': 'Cancel',
    };
    return dictionary[key] ?? `[${key}]`;
  },
}));

const noop = () => {};

describe('HoldOverrideDialog', () => {
  it('resets fields and touched-validation state after an external close (parent flips open to false)', () => {
    const onSubmit = vi.fn();
    const { rerender } = render(
      <HoldOverrideDialog open onClose={noop} onSubmit={onSubmit} />,
    );

    // Fill in both fields.
    fireEvent.change(screen.getByLabelText(/override until/i), { target: { value: '2026-09-30' } });
    fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: 'Repeated late remittances' } });

    // Save, which the *parent* honours by flipping `open` to false directly — never calling
    // `onClose`/`handleClose`. This component is not unmounted.
    fireEvent.click(screen.getByRole('button', { name: /save override/i }));
    expect(onSubmit).toHaveBeenCalledWith({
      until: expect.stringContaining('2026-09-30') as string,
      reason: 'Repeated late remittances',
    });
    rerender(<HoldOverrideDialog open={false} onClose={noop} onSubmit={onSubmit} />);

    // Reopen — for the same or a different technician, the caller re-renders with `open` true again.
    rerender(<HoldOverrideDialog open onClose={noop} onSubmit={onSubmit} />);

    expect(screen.getByLabelText(/override until/i)).toHaveValue('');
    expect(screen.getByLabelText(/reason/i)).toHaveValue('');
    // No leftover touched-validation state either — submitting blank fields on the fresh open must
    // not immediately flash stale errors that were never re-triggered on this render.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not carry validation-error state (touched) into a reopen after an external close', () => {
    const onSubmit = vi.fn();
    const { rerender } = render(
      <HoldOverrideDialog open onClose={noop} onSubmit={onSubmit} />,
    );

    // Trigger validation errors by saving with both fields blank (sets reasonTouched/untilTouched).
    fireEvent.click(screen.getByRole('button', { name: /save override/i }));
    expect(screen.getAllByRole('alert')).toHaveLength(2);
    expect(onSubmit).not.toHaveBeenCalled();

    // External close (parent-driven, not Cancel/handleClose) then reopen.
    rerender(<HoldOverrideDialog open={false} onClose={noop} onSubmit={onSubmit} />);
    rerender(<HoldOverrideDialog open onClose={noop} onSubmit={onSubmit} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('still resets on a normal Cancel-driven close and reopen (no regression)', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <HoldOverrideDialog open onClose={onClose} onSubmit={noop} />,
    );
    fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: 'Some reason' } });
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledOnce();

    rerender(<HoldOverrideDialog open={false} onClose={onClose} onSubmit={noop} />);
    rerender(<HoldOverrideDialog open onClose={onClose} onSubmit={noop} />);

    expect(screen.getByLabelText(/reason/i)).toHaveValue('');
  });
});
