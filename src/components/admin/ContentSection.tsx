'use client';

import React from 'react';

interface ContentSectionProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function ContentSection({ title, children, actions, className = '' }: ContentSectionProps) {
  return (
    <section className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium">{title}</h2>
        {actions && <div className="flex items-center space-x-2">{actions}</div>}
      </div>
      <div className="p-4">
        {children}
      </div>
    </section>
  );
}

export function ContentSectionAction({ 
  children, 
  onClick, 
  className = ''
}: { 
  children: React.ReactNode; 
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded ${className}`}
    >
      {children}
    </button>
  );
} 