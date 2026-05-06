import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string, params?: Record<string, unknown>) => {
    if (key === 'buttonNSelected' && params?.count !== undefined) {
      return `[${ns}.${key}:${params.count}]`;
    }
    return `[${ns}.${key}]`;
  },
}));

import { StatusFilterMenu } from '../../../src/components/orders/StatusFilterMenu';

const STATUSES = ['SEARCHING', 'ASSIGNED', 'COMPLETED'];

function renderMenu(selected: string[] = [], onChange = vi.fn()) {
  return render(
    <StatusFilterMenu
      statuses={STATUSES}
      selected={selected}
      onChange={onChange}
    />,
  );
}

describe('StatusFilterMenu', () => {
  it('renders the trigger button with "no filter" copy when nothing selected', () => {
    renderMenu([]);
    expect(
      screen.getByRole('button', { name: /buttonNoneSelected/ }),
    ).toBeDefined();
  });

  it('renders the trigger with "N selected" copy when statuses are selected', () => {
    renderMenu(['SEARCHING', 'ASSIGNED']);
    expect(
      screen.getByRole('button', { name: /buttonNSelected:2/ }),
    ).toBeDefined();
  });

  it('opens the menu and shows a checkbox per status when clicked', () => {
    renderMenu([]);
    fireEvent.click(screen.getByRole('button', { name: /buttonNoneSelected/ }));

    // checkboxes for each status
    expect(screen.getByRole('checkbox', { name: 'SEARCHING' })).toBeDefined();
    expect(screen.getByRole('checkbox', { name: 'ASSIGNED' })).toBeDefined();
    expect(screen.getByRole('checkbox', { name: 'COMPLETED' })).toBeDefined();
  });

  it('reflects the `selected` prop in checkbox checked state', () => {
    renderMenu(['ASSIGNED']);
    fireEvent.click(screen.getByRole('button', { name: /buttonNSelected:1/ }));
    expect((screen.getByRole('checkbox', { name: 'ASSIGNED' }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole('checkbox', { name: 'SEARCHING' }) as HTMLInputElement).checked).toBe(false);
  });

  it('calls onChange with the new selection when a checkbox is toggled and Apply is pressed', () => {
    const onChange = vi.fn();
    renderMenu([], onChange);
    fireEvent.click(screen.getByRole('button', { name: /buttonNoneSelected/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'ASSIGNED' }));
    fireEvent.click(screen.getByRole('button', { name: /applyButton/ }));
    expect(onChange).toHaveBeenCalledWith(['ASSIGNED']);
  });

  it('clears all selections via the Clear all button', () => {
    const onChange = vi.fn();
    renderMenu(['SEARCHING', 'ASSIGNED'], onChange);
    fireEvent.click(screen.getByRole('button', { name: /buttonNSelected:2/ }));
    fireEvent.click(screen.getByRole('button', { name: /clearButton/ }));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
