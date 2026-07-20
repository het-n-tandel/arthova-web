'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock } from 'lucide-react';
import { cn } from '@/lib/formatters';
import { registerUser } from '../actions';

export default function RegisterPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedBroker, setBroker] = useState<string | null>(null);

  const strength = password.length === 0 ? -1 : password.length < 6 ? 0 : password.length < 10 ? 1 : 2;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const res = await registerUser(formData);
    
    if (res?.error) {
      setError(res.error);
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="bg-bg-surface border border-border-default rounded-[16px] p-8 shadow-2xl">
      <h1 className="font-display text-[28px] text-text-primary mb-2">Create Account</h1>
      <p className="text-text-secondary text-[14px] mb-8">Join ARTHOVA and unify your portfolio.</p>

      {error && <div className="bg-negative-bg border border-negative text-negative px-4 py-2.5 rounded-[8px] text-[13px] mb-4 font-medium">{error}</div>}

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-text-primary">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
            <input required name="email" type="email" placeholder="name@example.com" className="w-full bg-bg-base border border-border-default rounded-[8px] pl-10 pr-4 py-2.5 text-[14px] text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent-brass focus:ring-1 focus:ring-accent-brass transition-all" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-text-primary">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
            <input 
              required 
              name="password"
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-bg-base border border-border-default rounded-[8px] pl-10 pr-4 py-2.5 text-[14px] text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent-brass focus:ring-1 focus:ring-accent-brass transition-all" 
            />
          </div>
          {strength > -1 && (
            <div className="flex gap-1 mt-2">
              <div className={cn("h-1 flex-1 rounded-full", strength >= 0 ? "bg-negative" : "bg-bg-surface-2")} />
              <div className={cn("h-1 flex-1 rounded-full", strength >= 1 ? "bg-warning" : "bg-bg-surface-2")} />
              <div className={cn("h-1 flex-1 rounded-full", strength >= 2 ? "bg-positive" : "bg-bg-surface-2")} />
            </div>
          )}
        </div>

        <div className="pt-4 pb-2 border-t border-border-default space-y-3 mt-4">
          <div className="flex flex-col">
            <label className="text-[13px] font-medium text-text-primary">Connect Demat Account <span className="text-text-faint font-normal">(Optional)</span></label>
            <p className="text-[12px] text-text-faint mt-0.5">Automatically sync your portfolio from your broker.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {['Zerodha', 'Groww', 'Upstox', 'Angel One'].map(broker => (
              <button 
                key={broker} 
                type="button" 
                onClick={() => setBroker(selectedBroker === broker ? null : broker)}
                className={cn(
                  "border rounded-[8px] py-2 text-[13px] font-medium transition-all duration-200",
                  selectedBroker === broker 
                    ? "border-accent-brass bg-accent-brass/10 text-accent-brass shadow-[0_0_0_1px_var(--accent-brass)]" 
                    : "border-border-default text-text-secondary bg-bg-base hover:border-text-faint hover:text-text-primary"
                )}
              >
                {broker}
              </button>
            ))}
          </div>
          <input type="hidden" name="dematBroker" value={selectedBroker || ''} />
        </div>

        <button type="submit" className="w-full bg-accent-brass text-bg-base hover:bg-accent-brass-dim py-2.5 rounded-[8px] font-medium text-[14px] transition-colors mt-6">
          Create Account
        </button>
      </form>

      <p className="text-center text-[13px] text-text-secondary mt-8">
        Already have an account? <Link href="/login" className="text-text-primary hover:text-accent-brass font-medium">Sign in</Link>
      </p>
    </div>
  );
}
