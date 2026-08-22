import Link from 'next/link';
import { auth } from '@/auth';

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col">
      <header className="h-20 border-b border-border-default flex items-center justify-between px-6 lg:px-12 bg-bg-surface sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-3">
          <span className="font-brand text-[28px] tracking-tight">ARTHOVA</span>
        </Link>
        <div className="flex items-center gap-4">
          {session?.user ? (
            <Link href="/dashboard" className="text-[14px] font-medium text-bg-base bg-text-primary hover:bg-text-secondary px-5 py-2.5 rounded-[8px] transition-colors">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-[14px] font-medium text-text-secondary hover:text-text-primary transition-colors">Sign In</Link>
              <Link href="/register" className="text-[14px] font-medium text-bg-base bg-text-primary hover:bg-text-secondary px-5 py-2.5 rounded-[8px] transition-colors">Get Started</Link>
            </>
          )}
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t border-border-default py-12 px-6 lg:px-12 bg-bg-surface-2 text-center text-text-faint text-[13px]">
        &copy; {new Date().getFullYear()} ARTHOVA. All rights reserved.
      </footer>
    </div>
  );
}
