'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Mail, Lock, Building, ShieldCheck, Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const res = await signIn('credentials', {
        email: trimmedEmail,
        password,
        redirect: false,
      });
      
      if (res?.error) {
        setError('Invalid email or password');
        setLoading(false);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleDematLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push('/dashboard');
  };

  return (
    <div className="w-full max-w-[440px] relative">
      {/* Decorative Outer Aura */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-sky-500/20 blur-xl opacity-75 pointer-events-none" />

      <div className="relative overflow-hidden rounded-2xl bg-bg-surface/70 backdrop-blur-2xl p-8 sm:p-9 shadow-2xl border border-white/10 dark:border-white/[0.08]">
        {/* Subtle interior glow */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Secure Authentication
          </span>
        </div>

        <h1 className="font-display text-[30px] font-bold text-text-primary tracking-tight text-gradient-emerald mt-1">
          Welcome back
        </h1>
        <p className="text-text-secondary text-[13.5px] mt-1 mb-7 leading-relaxed">
          Sign in to access your unified portfolio & quant analytics engine.
        </p>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/25 text-rose-300 px-4 py-3 rounded-xl text-[13px] mb-5 font-medium flex items-center gap-2 animate-in fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12.5px] font-medium text-text-primary">Email address</label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint group-focus-within:text-emerald-400 transition-colors" />
              <input 
                required 
                name="email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com" 
                className="w-full bg-bg-base/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-[14px] text-text-primary placeholder:text-text-faint focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[12.5px] font-medium text-text-primary">Password</label>
              <Link href="#" className="text-[12px] text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint group-focus-within:text-emerald-400 transition-colors" />
              <input 
                required 
                name="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full bg-bg-base/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-[14px] text-text-primary placeholder:text-text-faint focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold py-2.5 rounded-xl text-[14px] shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Terminal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="relative my-7">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/[0.08]" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
            <span className="bg-bg-surface/90 px-3 text-text-faint font-mono">Or quick connect</span>
          </div>
        </div>

        <button 
          onClick={handleDematLogin} 
          type="button"
          className="w-full flex items-center justify-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-white/20 py-2.5 rounded-xl font-medium text-[13.5px] text-text-primary transition-all duration-200 group cursor-pointer"
        >
          <Building className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span>Connect Broker / Demat Account</span>
        </button>

        <p className="text-center text-[13px] text-text-secondary mt-7">
          New to ARTHOVA?{' '}
          <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-medium hover:underline transition-colors">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
