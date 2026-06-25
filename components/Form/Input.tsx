import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  helperText?: string;
  label?: string;
  required?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export default function Input({
  error,
  helperText,
  label,
  required = false,
  icon,
  iconPosition = 'left',
  className = '',
  type = 'text',
  disabled = false,
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {icon}
          </div>
        )}

        <input
          type={type}
          disabled={disabled}
          className={`
            w-full px-3 py-2.5 rounded-lg border-2 text-slate-900 text-sm font-medium
            placeholder-slate-400 transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
            disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
            disabled:border-slate-200
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-200'}
            ${icon && iconPosition === 'left' ? 'pl-10' : ''}
            ${icon && iconPosition === 'right' ? 'pr-10' : ''}
            ${className}
          `.trim()}
          {...props}
        />

        {icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {icon}
          </div>
        )}
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
