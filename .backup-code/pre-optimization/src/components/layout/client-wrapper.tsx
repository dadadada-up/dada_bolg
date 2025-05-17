"use client";

import { MainLayout } from "@/components/layout/main-layout";

interface ClientWrapperProps {
  children: React.ReactNode;
}

export function ClientWrapper({ children }: ClientWrapperProps) {
  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
} 