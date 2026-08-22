'use client';

import { MotionConfig } from 'framer-motion';

import { Sidebar, MobileNav } from './sidebar';
import { TopNav } from './top-nav';
import { NotificationToastContainer } from '../ui/notification-toast';
import { usePriceStream } from '@/lib/hooks/use-price-stream';

export function PageShell({ children }: { children: React.ReactNode }) {
  usePriceStream();

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-6 pb-20 md:pb-6">
            {children}
          </div>
        </main>
      </div>
      <MobileNav />
      <NotificationToastContainer />
    </div>
    </MotionConfig>
  );
}
