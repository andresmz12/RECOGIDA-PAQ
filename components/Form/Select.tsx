import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  helperText?: string;
  label?: string;
  required?: boolean;
  options: Array<{ value: string | number; label: string }>;
  placeholder?: string;
}

export default function Select({
  error,
  helperText,
  label,
  required = false,
  options,
  placeholder = 'Seleccionar...',
  className = '',
  disabled = false,
  ...props
}: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          disabled={disabled}
          className={`
            w-full px-3 py-2.5 rounded-lg border-2 text-slate-900 text-sm font-medium
            placeholder-slate-400 transition-all duration-200 appearance-none
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
            disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
            disabled:border-slate-200 bg-white cursor-pointer pr-10
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-200'}
            ${className}
          `.trim()}
          {...props}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {error && (
        <div className="mt-1.5 flex items-center gap-1 text-sm text-red-600 font-medium">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18.101 12.93l-.9-1.464A1.948 1.948 0 0018 10.414V5a4 4 0 00-4-4H6a4 4 0 00-4 4v5.414c0 .474.107.94.31 1.352l-.9 1.464a1 1 0 00.82 1.58h16.96a1 1 0 00.82-1.58zM7 16a2 2 0 11-4 0 2 2 0 014 0zm6-2a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {helperText && !error && (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
}
