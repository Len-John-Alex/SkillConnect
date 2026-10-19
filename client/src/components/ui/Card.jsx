export function Card({ children, className = '', variant = 'default' }) {
  const variants = {
    default: 'bg-gray-900/60 border border-gray-800',
    elevated: 'bg-gray-900/80 border border-gray-700 shadow-xl shadow-black/20',
    outlined: 'bg-transparent border border-gray-700',
  };
  
  return (
    <div className={`rounded-2xl ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 border-b border-gray-800 ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 border-t border-gray-800 bg-gray-900/30 rounded-b-2xl ${className}`}>
      {children}
    </div>
  );
}