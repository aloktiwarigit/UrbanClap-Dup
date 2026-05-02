import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

const setMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
vi.mock('../app/actions/theme', () => ({ setThemeCookie: setMock }));

describe('<ThemeToggle />', () => {
  beforeEach(() => {
    setMock.mockClear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('renders both options with the active one underlined', () => {
    render(
      <ThemeProvider initialTheme="dark">
        <ThemeToggle />
      </ThemeProvider>,
    );
    expect(screen.getByRole('radio', { name: /dark/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /light/i })).toHaveAttribute('aria-checked', 'false');
  });

  it('flips data-theme on the document on click and calls the Server Action', () => {
    render(
      <ThemeProvider initialTheme="dark">
        <ThemeToggle />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByRole('radio', { name: /light/i }));
    expect(document.documentElement.dataset['theme']).toBe('light');
    expect(screen.getByRole('radio', { name: /light/i })).toHaveAttribute('aria-checked', 'true');
    expect(setMock).toHaveBeenCalledWith('light');
  });
});
