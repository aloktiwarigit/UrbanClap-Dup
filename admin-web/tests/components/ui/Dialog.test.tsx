import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Dialog } from '../../../src/components/ui/Dialog';

const noop = () => {};

describe('Dialog', () => {
  it('renders role=dialog with aria-modal and an accessible name', () => {
    render(
      <Dialog open onClose={noop} title="Record payment">
        body
      </Dialog>,
    );
    const d = screen.getByRole('dialog');
    expect(d).toHaveAttribute('aria-modal', 'true');
    expect(d).toHaveAccessibleName('Record payment');
  });

  it('closes on Escape', async () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose} title="T">
        body
      </Dialog>,
    );
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes only the innermost dialog on Escape, by identity not by count', async () => {
    // Mirrors the existing ConfirmModal-inside-OrderSlideOver guard: only the
    // topmost (last-in-DOM-order) [role="dialog"] reacts to Escape. Both
    // halves of the contract matter: the inner dialog (last node) must
    // still close, and the outer dialog (not the last node) must not. A
    // guard that merely counts [role="dialog"] nodes and bails whenever
    // there is more than one would suppress BOTH and pass a test that only
    // checked the outer half.
    const onOuterClose = vi.fn();
    const onInnerClose = vi.fn();
    render(
      <>
        <Dialog open onClose={onOuterClose} title="Outer">
          a
        </Dialog>
        <Dialog open onClose={onInnerClose} title="Inner">
          b
        </Dialog>
      </>,
    );
    await userEvent.keyboard('{Escape}');
    expect(onInnerClose).toHaveBeenCalledOnce();
    expect(onOuterClose).not.toHaveBeenCalled();
  });

  it('renders nothing when closed', () => {
    render(
      <Dialog open={false} onClose={noop} title="T">
        body
      </Dialog>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('calls onClose when the backdrop is clicked', async () => {
    const onClose = vi.fn();
    const { container } = render(
      <Dialog open onClose={onClose} title="T">
        body
      </Dialog>,
    );
    const backdrop = container.querySelector('[aria-hidden="true"]');
    expect(backdrop).not.toBeNull();
    await userEvent.click(backdrop as Element);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('renders footer content when provided', () => {
    render(
      <Dialog open onClose={noop} title="T" footer={<button type="button">Confirm</button>}>
        body
      </Dialog>,
    );
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });

  it('accepts an explicit titleId', () => {
    render(
      <Dialog open onClose={noop} title="T" titleId="my-title-id">
        body
      </Dialog>,
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'my-title-id');
  });
});
