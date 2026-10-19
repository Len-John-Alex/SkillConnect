import { Link } from 'react-router-dom';
import { Button } from './Button';

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  className = '' 
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      {icon && <div className="text-5xl mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-500 max-w-sm mb-6">{description}</p>
      {action && (
        action.to ? (
          <Link
            to={action.to}
            className={`inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 px-5 py-2.5 text-sm ${
              action.variant === 'secondary'
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 focus:ring-gray-500'
                : action.variant === 'danger'
                ? 'bg-red-600 hover:bg-red-500 text-white focus:ring-red-500'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white focus:ring-indigo-500'
            } ${action.className || ''}`}
            onClick={action.onClick}
          >
            {action.children || action.label}
          </Link>
        ) : (
          <Button {...action}>
            {action.children || action.label}
          </Button>
        )
      )}
    </div>
  );
}

export function ErrorState({ 
  title = 'Something went wrong', 
  message, 
  onRetry,
  className = '' 
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {message && <p className="text-gray-500 max-w-sm mb-6">{message}</p>}
      {onRetry && (
        <Button onClick={onRetry} variant="primary">
          Try Again
        </Button>
      )}
    </div>
  );
}