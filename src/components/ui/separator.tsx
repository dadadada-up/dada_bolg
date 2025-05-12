import React from 'react';

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

export function Separator({ 
  orientation = 'horizontal', 
  className = '', 
  ...props 
}: SeparatorProps) {
  const orientationClasses = {
    horizontal: 'h-[1px] w-full',
    vertical: 'h-full w-[1px]'
  };

  return (
    <div
      className={`shrink-0 bg-border ${orientationClasses[orientation]} ${className}`}
      {...props}
    />
  );
} 