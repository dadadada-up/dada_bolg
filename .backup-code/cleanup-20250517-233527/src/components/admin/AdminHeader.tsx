'use client';

import React from 'react';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function AdminHeader({ title, subtitle, children }: AdminHeaderProps) {
  return (
    <header className="admin-header">
      <div>
        <h2 className="page-title">{title}</h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      
      <div className="header-actions">
        {children}
      </div>
    </header>
  );
} 