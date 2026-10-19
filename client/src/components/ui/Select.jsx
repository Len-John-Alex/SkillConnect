import { forwardRef } from 'react';

export const Select = forwardRef(({ 
  label, 
  error, 
  helperText,
  options = [],
  className = '',
  id,
  placeholder = 'Select an option',
  ...props 
}, ref) => {
  const inputId = id || (label ? `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}` : undefined);
  
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={inputId}
        className={`w-full px-4 py-2.5 bg-gray-800/60 border rounded-xl text-white
          focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all
          ${error ? 'border-red-500' : 'border-gray-700'} ${className}`}
        {...props}
      >
        {placeholder && !options.some((opt) => opt.value === '') && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      {helperText && !error && <p className="text-gray-600 text-xs mt-1">{helperText}</p>}
    </div>
  );
});

Select.displayName = 'Select';