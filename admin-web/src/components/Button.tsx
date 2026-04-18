import type { ButtonHTMLAttributes, CSSProperties } from 'react';

export type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
} & ButtonHTMLAttributes<HTMLButtonElement>;

const sizeStyles: Record<NonNullable<ButtonProps['size']>, CSSProperties> = {
  sm: { padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--text-sm)' },
  md: { padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-base)' },
  lg: { padding: 'var(--space-3) var(--space-6)', fontSize: 'var(--text-lg)' },
};

const variantStyles: Record<NonNullable<ButtonProps['variant']>, CSSProperties> = {
  primary: { background: 'var(--color-brand)', color: 'var(--color-brand-fg)', border: '1px solid transparent' },
  secondary: { background: 'var(--color-surface-alt)', color: 'var(--color-text)', border: '1px solid var(--color-border)' },
  ghost: { background: 'transparent', color: 'var(--color-text)', border: '1px solid transparent' },
};

export function Button({
  variant = 'primary',
  size = 'md',
  style,
  disabled,
  ...rest
}: ButtonProps) {
  const merged: CSSProperties = {
    borderRadius: 'var(--radius-md)',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'opacity var(--duration-base) var(--ease-out)',
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...style,
  };
  return <button disabled={disabled} style={merged} {...rest} />;
}
