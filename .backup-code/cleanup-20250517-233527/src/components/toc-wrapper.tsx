"use client";

import { TableOfContents } from "@/components/table-of-contents";

interface TocWrapperProps {
  headings: Array<{ level: number; text: string; slug: string }>;
  activeId?: string | null;
  onHeadingClick?: () => void;
}

export function TocWrapper({ 
  headings, 
  activeId = null, 
  onHeadingClick
}: TocWrapperProps) {
  if (headings.length === 0) {
    return null;
  }
  
  return (
    <div className="sticky top-20">
      <h3 className="font-semibold mb-4">目录</h3>
      <TableOfContents 
        headings={headings}
        activeId={activeId}
        onHeadingClick={onHeadingClick}
      />
    </div>
  );
} 