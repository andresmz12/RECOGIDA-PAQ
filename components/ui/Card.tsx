import React from 'react';

type CardVariant = 'default' | 'elevated' | 'filled';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-white border border-slate-200',
  elevated: 'bg-white border border-slate-200 shadow-md',
  filled: 'bg-slate-50 border border-slate-200',
};

const paddingStyles = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function Card({
  variant = 'default',
  padding = 'md',
  children,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      {...props}
      className={`
        rounded-xl transition-all duration-300
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${className}
      `.trim()}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

export function CardHeader({
  title,
  description,
  children,
  className = '',
  ...props
}: CardHeaderProps) {
  return (
    <div
      {...props}
      className={`pb-4 border-b border-slate-200 ${className}`.trim()}
    >
      {title && (
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      )}
      {description && (
        <p className="text-sm text-slate-600 mt-1">{description}</p>
      )}
      {children}
    </div>
  );
}

interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardBody({
  children,
  className = '',
  ...props
}: CardBodyProps) {
  return (
    <div
      {...props}
      className={`py-4 ${className}`.trim()}
    >
      {children}
    </div>
  );
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardFooter({
  children,
  className = '',
  ...props
}: CardFooterProps) {
  return (
    <div
      {...props}
      className={`pt-4 border-t border-slate-200 flex items-center justify-between gap-2 ${className}`.trim()}
    >
      {children}
    </div>
  );
}
