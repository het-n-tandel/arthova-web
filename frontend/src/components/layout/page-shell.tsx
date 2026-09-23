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
      <div className="flex h-screen overflow-hidden relative bg-bg-base">
        {/* Ambient Refraction Background Gradients */}
        <div 
          className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-60 dark:opacity-75"
          aria-hidden="true"
        >
          {/* Top-right vibrant emerald/mint aura */}
          <div className="absolute -top-[15%] right-[5%] w-[650px] h-[650px] rounded-full bg-gradient-to-br from-emerald-500/20 via-teal-400/15 to-transparent blur-[110px]" />
          {/* Bottom-left vibrant cyan/indigo aura */}
          <div className="absolute top-[35%] -left-[10%] w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-sky-400/20 via-indigo-500/10 to-transparent blur-[120px]" />
          {/* Subtle warm amber touch for golden asset shimmer */}
          <div className="absolute -bottom-[10%] right-[30%] w-[450px] h-[450px] rounded-full bg-gradient-to-t from-amber-400/10 via-emerald-500/5 to-transparent blur-[130px]" />
        </div>

        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
          <TopNav />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-7 pb-24 md:pb-8">
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
