'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Mail, Lock, Building } from 'lucide-react';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    
    if (res?.error) {
      setError('Invalid email or password');
    } else {
      router.push('/dashboard');
      router.refresh(); // Ensure RSC layout updates
    }
  };

  const handleDematLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push('/dashboard'); // Mock Demat login
  };

  return (
    <div className="bg-bg-surface border border-border-default rounded-[16px] p-8 shadow-2xl">
      <h1 className="font-display text-[28px] text-text-primary mb-2">Welcome back</h1>
      <p className="text-text-secondary text-[14px] mb-8">Sign in to your ARTHOVA terminal.</p>

      {error && <div className="bg-negative-bg border border-negative text-negative px-4 py-2.5 rounded-[8px] text-[13px] mb-4 font-medium">{error}</div>}

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-text-primary">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
            <input required name="email" type="email" placeholder="name@example.com" className="w-full bg-bg-base border border-border-default rounded-[8px] pl-10 pr-4 py-2.5 text-[14px] text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent-brass focus:ring-1 focus:ring-accent-brass transition-all" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-text-primary flex justify-between">
            Password
            <Link href="#" className="text-accent-brass hover:text-accent-brass-dim">Forgot?</Link>
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
            <input required name="password" type="password" placeholder="••••••••" className="w-full bg-bg-base border border-border-default rounded-[8px] pl-10 pr-4 py-2.5 text-[14px] text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent-brass focus:ring-1 focus:ring-accent-brass transition-all" />
          </div>
        </div>

        <button type="submit" className="w-full bg-text-primary text-bg-base hover:bg-text-secondary py-2.5 rounded-[8px] font-medium text-[14px] transition-colors mt-2">
          Sign In
        </button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border-default"></div>
        </div>
        <div className="relative flex justify-center text-[12px]">
          <span className="bg-bg-surface px-2 text-text-faint">Or sign in with (Optional)</span>
        </div>
      </div>

      <button onClick={handleDematLogin} className="w-full flex items-center justify-center gap-2 bg-bg-surface-2 hover:bg-bg-surface-3 border border-border-default py-2.5 rounded-[8px] font-medium text-[14px] text-text-primary transition-colors">
        <Building className="w-4 h-4 text-info-indigo" />
        Demat Account Connect
      </button>

      <p className="text-center text-[13px] text-text-secondary mt-8">
        Don't have an account? <Link href="/register" className="text-text-primary hover:text-accent-brass font-medium">Create one</Link>
      </p>
    </div>
  );
}
