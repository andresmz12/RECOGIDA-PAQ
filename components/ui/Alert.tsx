import React from 'react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: AlertType;
  title?: string;
  message?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  children?: React.ReactNode;
}

const typeStyles: Record<AlertType, { container: string; border: string; bg: string; icon: string }> = {
  success: {
    container: 'text-green-700',
    border: 'border-l-4 border-green-500',
    bg: 'bg-green-50',
    icon: '✓',
  },
  error: {
    container: 'text-red-700',
    border: 'border-l-4 border-red-500',
    bg: 'bg-red-50',
    icon: '✕',
  },
  warning: {
    container: 'text-amber-700',
    border: 'border-l-4 border-amber-500',
    bg: 'bg-amber-50',
    icon: '⚠',
  },
  info: {
    container: 'text-blue-700',
    border: 'border-l-4 border-blue-500',
    bg: 'bg-blue-50',
    icon: 'ⓘ',
  },
};

export default function Alert({
  type = 'info',
  title,
  message,
  dismissible = false,
  onDismiss,
  children,
  className = '',
  ...props
}: AlertProps) {
  const [isVisible, setIsVisible] = React.useState(true);

  const style = typeStyles[type];

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <div
      {...props}
      className={`
        ${style.border} ${style.bg} ${style.container}
        rounded-lg p-4 flex items-start gap-3
        ${className}
      `.trim()}
      role="alert"
    >
      <div className="flex-shrink-0 text-lg font-bold">
        {style.icon}
      </div>

      <div className="flex-1">
        {title && (
          <h4 className="font-semibold text-sm">{title}</h4>
        )}
        {message && (
          <p className="text-sm mt-1">{message}</p>
        )}
        {children}
      </div>

      {dismissible && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-lg font-bold opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Descartar"
        >
          ✕
        </button>
      )}
    </div>
  );
}
