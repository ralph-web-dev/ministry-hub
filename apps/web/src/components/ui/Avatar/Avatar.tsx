import React from 'react';
import './Avatar.scss';

export interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, alt, fallback, size = 'md', className = '' }, ref) => {
    return (
      <div 
        ref={ref} 
        className={`ui-avatar avatar-${size} ${className}`}
      >
        {src ? (
          <img src={src} alt={alt || 'Avatar'} />
        ) : (
          <span className="avatar-initials">{fallback?.substring(0, 2).toUpperCase() || '?'}</span>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';
