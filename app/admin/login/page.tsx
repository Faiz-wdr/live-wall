'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Short artificial delay to mimic checking
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (password === 'div546') {
      // Set session cookie valid for 1 day
      document.cookie = 'livewall_admin_session=true; path=/; max-age=86400';
      router.push('/admin/dashboard');
      router.refresh();
    } else {
      setError('Invalid administrator password.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden px-4">
      {/* Ambient backgrounds */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-accent/5 blur-[90px] pointer-events-none animate-pulse-slow" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-white transition-colors mb-6 group"
        >
          <svg
            className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Live Wall
        </Link>

        {/* Form Card */}
        <div className="glass p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col gap-6">
          <div className="text-center">
            {/* Logo Icon */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
              <span className="text-white font-black text-xl">LW</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Admin Console</h1>
            <p className="text-sm text-muted mt-1">Provide access password to enter controls</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-xs font-bold text-muted uppercase tracking-wider">
                Admin Password
              </label>
              <input
                type="password"
                id="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-white/5 focus:border-primary/50 rounded-xl text-white placeholder-muted/30 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all text-sm font-medium"
              />
            </div>

            {/* Error Notification */}
            {error && (
              <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-xs text-danger font-semibold">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent text-white font-bold text-sm shadow-md shadow-primary/10 hover:shadow-primary/20 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? 'Verifying...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
