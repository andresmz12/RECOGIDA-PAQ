interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  required?: boolean;
}

export default function Label({ children, required = false, className = '', ...props }: LabelProps) {
  return (
    <label
      {...props}
      className={`block text-sm font-medium text-slate-700 mb-2 ${className}`.trim()}
    >
      {children}
      {required && <span className="text-red-600 ml-1">*</span>}
    </label>
  );
}
