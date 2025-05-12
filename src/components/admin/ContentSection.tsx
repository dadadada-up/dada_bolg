'use client';

import React from 'react';

interface ContentSectionProps {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ContentSection({ 
  title, 
  actions, 
  children, 
  className = '' 
}: ContentSectionProps) {
  return (
    <div className={`content-section ${className}`}>
      <div className="section-header">
        <h3 className="section-title">{title}</h3>
        {actions && <div className="section-actions">{actions}</div>}
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

interface ContentSectionActionProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export function ContentSectionAction({ 
  children, 
  onClick, 
  variant = 'primary' 
}: ContentSectionActionProps) {
  const buttonClass = variant === 'primary' ? 'primary-button' : 'secondary-button';
  
  return (
    <button className={buttonClass} onClick={onClick}>
      {children}
    </button>
  );
} 