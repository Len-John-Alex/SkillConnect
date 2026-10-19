export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4',
  };
  
  return (
    <div className={`inline-block ${sizes[size]} border-indigo-400 border-t-transparent rounded-full animate-spin ${className}`} />
  );
}

export function LoadingOverlay({ message = 'Loading...' }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-950/90 backdrop-blur-sm">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-300 text-sm">{message}</p>
    </div>
  );
}

export function Skeleton({ className = '', variant = 'text' }) {
  const variants = {
    text: 'h-4 bg-gray-700 rounded animate-pulse',
    circular: 'w-12 h-12 bg-gray-700 rounded-full animate-pulse',
    rectangular: 'w-full h-32 bg-gray-700 rounded-xl animate-pulse',
    card: 'space-y-3 animate-pulse',
  };
  
  if (variant === 'card') {
    return (
      <div className={className}>
        <div className="h-6 bg-gray-700 rounded w-3/4" />
        <div className="h-4 bg-gray-700 rounded w-1/2" />
        <div className="h-4 bg-gray-700 rounded w-1/3" />
      </div>
    );
  }
  
  return <div className={`${variants[variant]} ${className}`} />;
}