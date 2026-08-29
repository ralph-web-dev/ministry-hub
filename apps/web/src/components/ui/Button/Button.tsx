import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './Button.scss';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const classes = [
    'ui-btn',
    `ui-btn-${variant}`,
    `ui-btn-${size}`,
    fullWidth ? 'ui-btn-full-width' : '',
    isLoading ? 'ui-btn-loading' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="ui-btn-spinner" />
      ) : (
        leftIcon && <span className="ui-btn-icon left">{leftIcon}</span>
      )}
      <span className="ui-btn-text">{children}</span>
      {!isLoading && rightIcon && <span className="ui-btn-icon right">{rightIcon}</span>}
    </button>
  );
}
