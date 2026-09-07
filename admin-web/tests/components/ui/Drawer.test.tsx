import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Drawer } from '../../../src/components/ui/Drawer';

const noop = () => {};

describe('Drawer', () => {
  it('renders role=dialog with aria-modal and an accessible name', () => {
    render(
      <Drawer open onClose={noop} title="Order detail">
        body
      </Drawer>,
    );
    const d = screen.getByRole('dialog');
    expect(d).toHaveAttribute('aria-modal', 'true');
    expect(d).toHaveAccessibleName('Order detail');
  });

  it('closes on Escape', async () => {
    const onClose = vi.fn();
    render(
      <Drawer open onClose={onClose} title="T">
        body
      </Drawer>,
    );
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not close on Escape when a nested dialog is open above it', async () => {
    // Mirrors the existing OrderSlideOver + ConfirmModal guard: a drawer only
    // handles Escape when it is the last [role="dialog"] in the document.
    const onClose = vi.fn();
    render(
      <>
        <Drawer open onClose={onClose} title="Outer">
          a
        </Drawer>
        <Drawer open onClose={noop} title="Inner">
          b
        </Drawer>
      </>,
    );
    await userEvent.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders nothing when closed', () => {
    render(
      <Drawer open={false} onClose={noop} title="T">
        body
      </Drawer>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('calls onClose when the backdrop is clicked', async () => {
    const onClose = vi.fn();
    const { container } = render(
      <Drawer open onClose={onClose} title="T">
        body
      </Drawer>,
    );
    const backdrop = container.querySelector('[aria-hidden="true"]');
    expect(backdrop).not.toBeNull();
    await userEvent.click(backdrop as Element);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('renders footer content when provided', () => {
    render(
      <Drawer open onClose={noop} title="T" footer={<button type="button">Save</button>}>
        body
      </Drawer>,
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('defaults to the right side', () => {
    render(
      <Drawer open onClose={noop} title="T">
        body
      </Drawer>,
    );
    // side='right' is the only supported value today, but assert the prop is
    // accepted so future non-right values are an intentional type change.
    render(
      <Drawer open onClose={noop} title="T2" side="right">
        body2
      </Drawer>,
    );
    expect(screen.getAllByRole('dialog')).toHaveLength(2);
  });
});
