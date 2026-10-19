export function Badge({ children, variant = 'default', className = '', size = 'md' }) {
  const variants = {
    default: 'bg-gray-700 text-gray-300',
    primary: 'bg-indigo-500/20 text-indigo-300',
    success: 'bg-emerald-500/20 text-emerald-300',
    warning: 'bg-amber-500/20 text-amber-300',
    danger: 'bg-red-500/20 text-red-300',
    info: 'bg-blue-500/20 text-blue-300',
    outline: 'border border-gray-600 bg-transparent text-gray-400',
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };
  
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}