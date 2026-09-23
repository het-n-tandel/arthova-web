'use client';
import Link from 'next/link';

import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen auth-mesh-bg text-text-primary flex flex-col justify-between overflow-hidden">
      {/* Subtle Financial Vector Grid */}
      <div className="absolute inset-0 auth-grid-overlay opacity-80 pointer-events-none" />

      {/* Ambient Radial Gradient Lights */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[340px] bg-emerald-500/15 rounded-full blur-[110px] pointer-events-none animate-pulse-slow" />
      <div className="absolute top-1/3 -left-20 w-[420px] h-[420px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none animate-float-reverse" />
      <div className="absolute -bottom-24 -right-16 w-[520px] h-[520px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />

      {/* Top Header */}
      <header className="relative z-10 w-full px-6 py-6 md:px-12 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="p-1 rounded-xl bg-white/5 border border-white/10 shadow-md group-hover:scale-105 group-hover:border-emerald-500/40 transition-all duration-200">
            <Image 
              src="/logo.jpg" 
              alt="Arthova" 
              width={30} 
              height={30} 
              className="rounded-lg shadow-sm" 
            />
          </div>
          <span className="font-brand text-[22px] tracking-wide text-text-primary group-hover:text-emerald-500 transition-colors">
            ARTHOVA
          </span>
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 md:py-12">
        <div className="w-full flex justify-center">
          {children}
        </div>
      </main>

      {/* Clean Institutional Footer */}
      <footer className="relative z-10 w-full px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-text-faint border-t border-white/[0.04]">
        <span>&copy; {new Date().getFullYear()} ARTHOVA Institutional Suite. All rights reserved.</span>
        <div className="flex items-center gap-4 mt-2 sm:mt-0 font-mono text-[11px]">
          <span>AES-256 ENCRYPTED</span>
          <span>•</span>
          <span>ISO 27001 COMPLIANT</span>
        </div>
      </footer>
    </div>
  );
}
