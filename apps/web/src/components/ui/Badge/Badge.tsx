import type { HTMLAttributes, ReactNode } from 'react';
import './Badge.scss';

export type BadgeVariant = 'success' | 'danger' | 'warning' | 'neutral' | 'primary' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  pill?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export function Badge({
  variant = 'neutral',
  size = 'md',
  dot = false,
  pill = true,
  icon,
  children,
  className = '',
  ...props
}: BadgeProps) {
  const classes = [
    'ui-badge',
    `ui-badge-${variant}`,
    `ui-badge-${size}`,
    pill ? 'ui-badge-pill' : 'ui-badge-rounded',
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} {...props}>
      {dot && <span className="ui-badge-dot" />}
      {icon && <span className="ui-badge-icon">{icon}</span>}
      <span className="ui-badge-text">{children}</span>
    </span>
  );
}
