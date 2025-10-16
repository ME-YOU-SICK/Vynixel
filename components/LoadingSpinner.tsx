
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-4 border-t-transparent border-indigo-400 rounded-full animate-spin"></div>
    </div>
  );
};

export default LoadingSpinner;
