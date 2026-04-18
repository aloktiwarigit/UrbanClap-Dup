import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../src/lib/useTheme';

describe('useTheme', () => {
  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  it('initializes to light when html lacks .dark class', () => {
    document.documentElement.classList.remove('dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
  });

  it('initializes to dark when html already has .dark class', () => {
    document.documentElement.classList.add('dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');
  });

  it('toggle flips theme and adds .dark class', () => {
    document.documentElement.classList.remove('dark');
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggle());
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggle from dark returns to light and removes .dark class', () => {
    document.documentElement.classList.add('dark');
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggle());
    expect(result.current.theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('silently swallows localStorage errors (private mode)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
    document.documentElement.classList.remove('dark');
    const { result } = renderHook(() => useTheme());
    // toggle triggers the useEffect which calls localStorage.setItem — should not throw
    expect(() => act(() => result.current.toggle())).not.toThrow();
    vi.restoreAllMocks();
  });
});
