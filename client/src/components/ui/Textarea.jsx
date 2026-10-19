import { forwardRef } from 'react';

export const Textarea = forwardRef(({ 
  label, 
  error, 
  helperText,
  className = '',
  id,
  rows = 4,
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
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={`w-full px-4 py-2.5 bg-gray-800/60 border rounded-xl text-white placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all
          ${error ? 'border-red-500' : 'border-gray-700'} ${className}`}
        {...props}
      />
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      {helperText && !error && <p className="text-gray-600 text-xs mt-1">{helperText}</p>}
    </div>
  );
});

Textarea.displayName = 'Textarea';