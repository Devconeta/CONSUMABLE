import React from 'react';

type SpinnerSize = 'sm' | 'md' | 'lg';
type SpinnerColor = 'blue' | 'white' | 'gray' | 'indigo' | 'black';

interface SpinnerProps {
  size?: SpinnerSize;
  color?: SpinnerColor;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', color = 'black' }) => {
  const sizeClasses: Record<SpinnerSize, string> = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const colorClasses: Record<SpinnerColor, string> = {
    blue: 'border-blue-500',
    white: 'border-white',
    gray: 'border-gray-500',
    indigo: 'border-indigo-500',
    black: 'border-black',
  };

  return (
    <div className="flex justify-center items-center">
      <div
        className={`
          ${sizeClasses[size]}
          ${colorClasses[color]}
          border-4
          border-t-transparent
          rounded-full
          animate-spin
        `}
      />
    </div>
  );
};

export default Spinner;
