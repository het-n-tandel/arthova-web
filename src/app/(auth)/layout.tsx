'use client';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <div className="p-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="font-brand text-[24px]">ARTHOVA</span>
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 pb-24">
        <div className="w-full max-w-[420px]">
          {children}
        </div>
      </div>
    </div>
  );
}
