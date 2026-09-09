import { describe, it, expect } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';

import { ToastRegion, useToast } from '../../../src/components/ui/Toast';

describe('ToastRegion', () => {
  it('renders role="status" (polite) for a success toast', () => {
    render(<ToastRegion toast={{ message: 'Saved', tone: 'success' }} onDismiss={() => {}} />);
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('renders role="alert" (assertive) for an error toast', () => {
    render(<ToastRegion toast={{ message: 'Failed to save', tone: 'error' }} onDismiss={() => {}} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to save');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('renders nothing when toast is null', () => {
    render(<ToastRegion toast={null} onDismiss={() => {}} />);
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('useToast', () => {
  it('starts with no toast', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toast).toBeNull();
  });

  it('show() sets a toast with the given message and tone', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.show('Payout recorded', 'success');
    });
    expect(result.current.toast).toEqual({ message: 'Payout recorded', tone: 'success' });
  });

  it('dismiss() clears the toast', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.show('Something broke', 'error');
    });
    expect(result.current.toast).not.toBeNull();
    act(() => {
      result.current.dismiss();
    });
    expect(result.current.toast).toBeNull();
  });
});
