import React from 'react';
import './ToggleGroup.scss';

export interface ToggleOption {
  value: string;
  label: React.ReactNode;
}

export interface ToggleGroupProps {
  options: ToggleOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const ToggleGroup: React.FC<ToggleGroupProps> = ({
  options,
  value,
  onChange,
  className = '',
}) => {
  return (
    <div className={`ui-toggle-group ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`toggle-btn ${value === option.value ? 'active' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
