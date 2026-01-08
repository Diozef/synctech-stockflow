import React from 'react';
import { cn } from '@/lib/utils';
import { TrialBanner } from '@/components/TrialBanner';

interface MobileLayoutProps {
  children: React.ReactNode;
  className?: string;
  showHeader?: boolean;
  header?: React.ReactNode;
}

export function MobileLayout({ 
  children, 
  className,
  showHeader = false,
  header 
}: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <TrialBanner />
      {showHeader && header && (
        <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b">
          {header}
        </header>
      )}
      <main className={cn("px-4 py-6 pb-24", className)}>
        {children}
      </main>
    </div>
  );
}
