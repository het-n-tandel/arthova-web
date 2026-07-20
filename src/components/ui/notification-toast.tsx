'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, TrendingUp, Info } from 'lucide-react';
import { cn } from '@/lib/formatters';
import { useLedgerStore, type Notification } from '@/lib/store';

const iconMap = {
  warning: AlertTriangle,
  positive: TrendingUp,
  brass: TrendingUp,
  info: Info,
};

const borderColorMap = {
  warning: 'var(--warning)',
  positive: 'var(--positive)',
  brass: 'var(--accent-brass)',
  info: 'var(--info-indigo)',
};

export function NotificationToastContainer() {
  const notifications = useLedgerStore((s) => s.notifications);
  const dismiss = useLedgerStore((s) => s.dismissNotification);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-[380px] max-w-[calc(100vw-2rem)]">
      <AnimatePresence mode="popLayout">
        {notifications.slice(0, 3).map((notif) => (
          <NotificationToast key={notif.id} notification={notif} onDismiss={() => dismiss(notif.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function NotificationToast({ notification, onDismiss }: { notification: Notification; onDismiss: () => void }) {
  const [progress, setProgress] = useState(100);
  const Icon = iconMap[notification.type];
  const borderColor = borderColorMap[notification.type];

  useEffect(() => {
    const duration = 6000;
    const interval = 50;
    const decrement = (interval / duration) * 100;
    
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p <= 0) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return p - decrement;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' as const }}
      className="bg-bg-surface-3 rounded-[12px] overflow-hidden relative"
      style={{ boxShadow: 'var(--shadow-md)', borderLeft: `4px solid ${borderColor}` }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Icon className="w-5 h-5 mt-0.5 shrink-0" style={{ color: borderColor }} />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-text-primary">{notification.title}</p>
            <p className="text-[12px] text-text-secondary mt-1 line-clamp-2">{notification.message}</p>
          </div>
          <button onClick={onDismiss} className="text-text-faint hover:text-text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="h-[2px] bg-bg-surface-2">
        <div
          className="h-full transition-all ease-linear"
          style={{ width: `${progress}%`, backgroundColor: borderColor, transitionDuration: '50ms' }}
        />
      </div>
    </motion.div>
  );
}
