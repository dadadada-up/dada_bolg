import React from 'react';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive';
}

export function Alert({ 
  variant = 'default', 
  className = '', 
  ...props 
}: AlertProps) {
  const variantClasses = {
    default: 'bg-background border border-input text-foreground',
    destructive: 'bg-destructive/10 border border-destructive text-destructive'
  };

  return (
    <div
      className={`relative rounded-lg px-4 py-3 ${variantClasses[variant]} ${className}`}
      role="alert"
      {...props}
    />
  );
}

interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function AlertTitle({ className = '', ...props }: AlertTitleProps) {
  return (
    <h5
      className={`mb-1 font-medium leading-none tracking-tight ${className}`}
      {...props}
    />
  );
}

interface AlertDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function AlertDescription({ className = '', ...props }: AlertDescriptionProps) {
  return (
    <p
      className={`text-sm text-muted-foreground ${className}`}
      {...props}
    />
  );
} 