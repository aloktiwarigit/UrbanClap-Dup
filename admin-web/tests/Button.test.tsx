import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../src/components/Button';

describe('Button', () => {
  it('renders with default variant=primary and size=md', () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole('button', { name: /click me/i });
    expect(btn).toBeDefined();
    // jsdom renders inline style values as literal strings
    expect(btn.style.background).toContain('--color-brand');
    expect(btn.style.fontSize).toContain('--text-base');
  });

  it('variant=primary applies --color-brand background', () => {
    render(<Button variant="primary">X</Button>);
    expect(screen.getByRole('button').style.background).toContain('--color-brand');
  });

  it('variant=secondary applies --color-surface-alt background', () => {
    render(<Button variant="secondary">X</Button>);
    expect(screen.getByRole('button').style.background).toContain('--color-surface-alt');
  });

  it('variant=ghost applies transparent background', () => {
    render(<Button variant="ghost">X</Button>);
    expect(screen.getByRole('button').style.background).toBe('transparent');
  });

  it('size=sm applies --text-sm font-size', () => {
    render(<Button size="sm">X</Button>);
    expect(screen.getByRole('button').style.fontSize).toContain('--text-sm');
  });

  it('size=md applies --text-base font-size', () => {
    render(<Button size="md">X</Button>);
    expect(screen.getByRole('button').style.fontSize).toContain('--text-base');
  });

  it('size=lg applies --text-lg font-size', () => {
    render(<Button size="lg">X</Button>);
    expect(screen.getByRole('button').style.fontSize).toContain('--text-lg');
  });

  it('disabled=true sets the disabled attribute', () => {
    render(<Button disabled>X</Button>);
    const btn = screen.getByRole('button');
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it('disabled=true sets cursor=not-allowed', () => {
    render(<Button disabled>X</Button>);
    expect(screen.getByRole('button').style.cursor).toBe('not-allowed');
  });

  it('disabled=true sets opacity=0.5', () => {
    render(<Button disabled>X</Button>);
    // jsdom stores numeric opacity as string
    expect(screen.getByRole('button').style.opacity).toBe('0.5');
  });

  it('enabled button has pointer cursor and opacity=1', () => {
    render(<Button>X</Button>);
    const btn = screen.getByRole('button');
    expect(btn.style.cursor).toBe('pointer');
    expect(btn.style.opacity).toBe('1');
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>X</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onClick when disabled and clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick} disabled>X</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(0);
  });

  it('merges custom style overrides without losing token-based background', () => {
    render(<Button style={{ marginTop: '10px' }}>X</Button>);
    const btn = screen.getByRole('button');
    expect(btn.style.marginTop).toBe('10px');
    // custom style comes after variant styles in spread, but marginTop should not clobber background
    expect(btn.style.background).toContain('--color-brand');
  });

  it('passes arbitrary HTML button attributes (e.g. type=submit)', () => {
    render(<Button type="submit">Submit</Button>);
    const btn = screen.getByRole('button');
    expect((btn as HTMLButtonElement).type).toBe('submit');
  });
});
