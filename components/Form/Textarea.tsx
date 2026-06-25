import React, { useEffect, useRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  helperText?: string;
  label?: string;
  required?: boolean;
  autoResize?: boolean;
}

export default function Textarea({
  error,
  helperText,
  label,
  required = false,
  autoResize = false,
  className = '',
  disabled = false,
  value,
  onChange,
  ...props
}: TextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoResize && ref.current) {
      const textarea = ref.current;
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, [value, autoResize]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (autoResize) {
      const textarea = e.target;
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
    onChange?.(e);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}

      <textarea
        ref={ref}
        disabled={disabled}
        value={value}
        onChange={handleChange}
        className={`
          w-full px-3 py-2.5 rounded-lg border-2 text-slate-900 text-sm font-medium
          placeholder-slate-400 transition-all duration-200 resize-none
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
          disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
          disabled:border-slate-200
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-200'}
          ${className}
        `.trim()}
        {...props}
      />

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
