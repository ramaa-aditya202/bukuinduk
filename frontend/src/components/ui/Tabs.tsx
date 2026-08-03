'use client';

import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';

export interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTabId?: string;
  className?: string;
}

export default function Tabs({ tabs, defaultTabId, className }: TabsProps) {
  const [activeTabId, setActiveTabId] = useState(defaultTabId || tabs[0]?.id);

  if (!tabs.length) return null;

  const activeContent = tabs.find((t) => t.id === activeTabId)?.content;

  return (
    <div className={className}>
      <div className="tab-nav overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={cn(
              'tab-item whitespace-nowrap',
              activeTabId === tab.id && 'tab-item-active'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="py-6 animate-fade-in">
        {activeContent}
      </div>
    </div>
  );
}
