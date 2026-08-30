import React from 'react';
import './Input.scss';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', startIcon, endIcon, error, ...props }, ref) => {
    return (
      <div className={`ui-input-wrapper ${error ? 'error' : ''} ${className}`}>
        {startIcon && <div className="input-icon start">{startIcon}</div>}
        <input 
          ref={ref} 
          className={`ui-input ${startIcon ? 'has-start-icon' : ''} ${endIcon ? 'has-end-icon' : ''}`}
          {...props} 
        />
        {endIcon && <div className="input-icon end">{endIcon}</div>}
      </div>
    );
  }
);

Input.displayName = 'Input';
