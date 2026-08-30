import React from 'react';
import { IconChevronDown } from '@tabler/icons-react';
import './Select.scss';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', error, children, ...props }, ref) => {
    return (
      <div className={`ui-select-wrapper ${error ? 'error' : ''} ${className}`}>
        <select ref={ref} className="ui-select" {...props}>
          {children}
        </select>
        <div className="select-icon">
          <IconChevronDown size={16} stroke={2} />
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
