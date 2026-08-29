import type { HTMLAttributes, ReactNode } from 'react';
import './Card.scss';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  bordered?: boolean;
  children: ReactNode;
}

export function Card({
  hoverable = false,
  bordered = true,
  className = '',
  children,
  ...props
}: CardProps) {
  const classes = [
    'ui-card',
    bordered ? 'ui-card-bordered' : '',
    hoverable ? 'ui-card-hoverable' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`ui-card-header ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardBody({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`ui-card-body ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`ui-card-footer ${className}`} {...props}>
      {children}
    </div>
  );
}
