import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number;
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 32,
  message = 'Loading...',
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-center h-96 ${className}`}>
      <Loader2 className="animate-spin text-blue-500" style={{ width: size, height: size }} />
      {message && (
        <span className="ml-2 text-slate-500 dark:text-slate-400">{message}</span>
      )}
    </div>
  );
};

export default LoadingSpinner;
