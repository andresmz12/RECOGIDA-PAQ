import React from 'react';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
}

const sizeStyles = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'w-full',
};

export default function Container({
  size = 'lg',
  children,
  className = '',
  ...props
}: ContainerProps) {
  return (
    <div
      {...props}
      className={`
        mx-auto px-4 sm:px-6 lg:px-8
        ${sizeStyles[size]}
        ${className}
      `.trim()}
    >
      {children}
    </div>
  );
}
