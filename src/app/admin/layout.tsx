'use client';

import { AdminLayout } from '@/components/layout/admin-layout';
import '@/styles/admin.css';

export default function AdminAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminLayout>
          {children}
    </AdminLayout>
  );
} 