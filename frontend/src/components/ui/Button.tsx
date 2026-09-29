import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-accent-ink shadow-soft hover:bg-accent/90 active:scale-[0.995] disabled:opacity-50',
  secondary:
    'bg-surface-2 border border-line text-ink hover:bg-surface-3 disabled:opacity-50',
  ghost:
    'bg-transparent border border-transparent text-ink-2 hover:text-ink hover:bg-surface-2 disabled:opacity-50',
  danger:
    'bg-danger text-white shadow-soft hover:bg-danger/90 disabled:opacity-50',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-2.5 text-meta rounded-control',
  md: 'h-9 px-3 text-body rounded-control',
  lg: 'h-11 px-4 text-section rounded-control',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type={props.type ?? 'button'}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span
          aria-hidden="true"
          className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"
        />
      )}
      {!isLoading && leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}
