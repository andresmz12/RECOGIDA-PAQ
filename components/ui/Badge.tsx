import React from 'react';

type BadgeVariant = 'solid' | 'outline' | 'subtle';
type BadgeColor = 'indigo' | 'slate' | 'red' | 'green' | 'amber' | 'blue';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  color?: BadgeColor;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const colorStyles: Record<BadgeColor, Record<BadgeVariant, string>> = {
  indigo: {
    solid: 'bg-indigo-600 text-white',
    outline: 'bg-white border border-indigo-600 text-indigo-600',
    subtle: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  },
  slate: {
    solid: 'bg-slate-600 text-white',
    outline: 'bg-white border border-slate-600 text-slate-600',
    subtle: 'bg-slate-50 text-slate-700 border border-slate-200',
  },
  red: {
    solid: 'bg-red-600 text-white',
    outline: 'bg-white border border-red-600 text-red-600',
    subtle: 'bg-red-50 text-red-700 border border-red-200',
  },
  green: {
    solid: 'bg-green-600 text-white',
    outline: 'bg-white border border-green-600 text-green-600',
    subtle: 'bg-green-50 text-green-700 border border-green-200',
  },
  amber: {
    solid: 'bg-amber-600 text-white',
    outline: 'bg-white border border-amber-600 text-amber-600',
    subtle: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  blue: {
    solid: 'bg-blue-600 text-white',
    outline: 'bg-white border border-blue-600 text-blue-600',
    subtle: 'bg-blue-50 text-blue-700 border border-blue-200',
  },
};

const sizeStyles = {
  sm: 'px-2 py-1 text-xs font-medium',
  md: 'px-3 py-1.5 text-sm font-medium',
};

export default function Badge({
  variant = 'solid',
  color = 'indigo',
  size = 'md',
  icon,
  children,
  className = '',
  ...props
}: BadgeProps) {
  return (
    <span
      {...props}
      className={`
        inline-flex items-center gap-1.5 rounded-full
        ${colorStyles[color][variant]}
        ${sizeStyles[size]}
        ${className}
      `.trim()}
    >
      {icon}
      {children}
    </span>
  );
}
