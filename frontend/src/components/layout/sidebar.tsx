'use client';
import { useState, useRef, useEffect } from 'react';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Briefcase,
  TrendingUp,
  PiggyBank,
  Coins,
  Landmark,
  Building2,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Scale,
  Bitcoin,
  ScrollText,
  Banknote,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { useLedgerStore } from '@/lib/store';
import { cn } from '@/lib/formatters';
import { useSession, signOut } from 'next-auth/react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/ai-advisor', label: 'AI Advisor', icon: Sparkles },
  { href: '/dashboard/portfolio', label: 'Portfolio', icon: Briefcase },
  { href: '/dashboard/stocks', label: 'Stocks', icon: TrendingUp },
  { href: '/dashboard/mutual-funds', label: 'Mutual Funds', icon: PiggyBank },
  { href: '/dashboard/gold-silver', label: 'Gold & Silver', icon: Coins },
  { href: '/dashboard/fixed-deposits', label: 'Fixed Deposits', icon: Landmark },
  { href: '/dashboard/property', label: 'Property', icon: Building2 },
  { href: '/dashboard/crypto', label: 'Crypto', icon: Bitcoin },
  { href: '/dashboard/bonds', label: 'Bonds', icon: ScrollText },
  { href: '/dashboard/cash', label: 'Cash', icon: Banknote },
  { href: '/dashboard/liabilities', label: 'Liabilities', icon: CreditCard },
  { href: '/dashboard/tax-reports', label: 'Tax Reports', icon: FileText },
  { href: '/dashboard/compare', label: 'Compare Assets', icon: Scale },
];

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useLedgerStore((s) => s.sidebarCollapsed);
  const toggle = useLedgerStore((s) => s.toggleSidebar);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col bg-bg-surface border-r border-border-default',
        'transition-all duration-200 ease-out h-screen sticky top-0',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      <div className={cn('flex items-center h-16 border-b border-border-default', collapsed ? 'px-4 justify-center' : 'px-5')}>
        <Link href="/" className="flex items-center gap-2">
          {!collapsed && (
            <span className="font-brand text-[24px] text-text-primary mt-1">ARTHOVA</span>
          )}
        </Link>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-[6px] transition-colors duration-150 relative group',
                collapsed ? 'px-3 py-2.5 justify-center' : 'px-3 py-2.5',
                isActive
                  ? 'bg-bg-surface-2 text-text-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-2'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent-brass"
                  transition={{ duration: 0.2, ease: 'easeOut' as const }}
                />
              )}
              <item.icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.5} />
              {!collapsed && (
                <span className="text-[14px] font-medium">{item.label}</span>
              )}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-bg-surface-3 text-text-primary text-[12px] rounded-[6px] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50" style={{ boxShadow: 'var(--shadow-sm)' }}>
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border-default p-3 relative" ref={menuRef}>
        {showUserMenu && (
          <div className={cn(
            "absolute bottom-[calc(100%-8px)] mb-2 bg-bg-surface-2 border border-border-default rounded-[8px] p-1.5 shadow-xl z-50",
            collapsed ? "left-3 w-[200px]" : "left-3 right-3"
          )}>
            <Link 
              href="/dashboard/settings"
              onClick={() => setShowUserMenu(false)}
              className="flex items-center gap-2 w-full rounded-[6px] px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-bg-surface-3 transition-colors"
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span className="text-[13px] font-medium">Settings</span>
            </Link>
            <div 
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full cursor-pointer"
            >
              <button
                type="button"
                className="flex items-center gap-2 w-full rounded-[6px] px-3 py-2 mt-1 text-negative hover:bg-negative-bg transition-colors"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span className="text-[13px] font-medium">Log out</span>
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className={cn(
            'flex items-center gap-3 w-full rounded-[6px] p-2 hover:bg-bg-surface-2 transition-colors text-left',
            collapsed && 'justify-center'
          )}
        >
          <div className="w-8 h-8 rounded-full bg-accent-brass flex items-center justify-center shrink-0">
            <span className="text-bg-base font-bold text-[13px]">
              {session?.user?.name ? session.user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-text-primary truncate">{session?.user?.name || 'User'}</p>
              <p className="text-[11px] text-text-faint truncate">{session?.user?.email || 'user@example.com'}</p>
            </div>
          )}
        </button>
        
        <button
          onClick={toggle}
          className={cn(
            'flex items-center gap-2 w-full rounded-[6px] px-3 py-2 mt-2 text-text-faint hover:text-text-primary hover:bg-bg-surface-2 transition-colors duration-150',
            collapsed && 'justify-center'
          )}
          title="Collapse sidebar"
        >
          {collapsed ? <ChevronRight className="w-4 h-4 shrink-0" /> : <ChevronLeft className="w-4 h-4 shrink-0" />}
          {!collapsed && <span className="text-[12.5px]">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const mobileItems = navItems.slice(0, 5);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-surface border-t border-border-default z-50 px-2 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {mobileItems.map((item) => {
          const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-[6px] transition-colors',
                isActive ? 'text-accent-brass' : 'text-text-faint'
              )}
            >
              <item.icon className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
