'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const handleSignOut = () => {
    setShowSignOutConfirm(true);
  };

  const executeSignOut = () => {
    // Clear the admin session cookie by setting its max-age to 0
    document.cookie = 'livewall_admin_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/admin/login');
    router.refresh();
  };

  const navItems = [
    {
      href: '/admin/dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      ),
    },
    {
      href: '/admin/posts',
      label: 'Post Management',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      href: '/admin/settings',
      label: 'System Settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row relative">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      {/* Sidebar Nav */}
      <aside
        className={`fixed md:sticky top-0 left-0 bottom-0 z-40 w-64 bg-surface border-r border-white/5 p-6 flex flex-col justify-between transform transition-transform duration-300 md:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
              <span className="text-white font-extrabold text-sm">LW</span>
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white">LiveWall Admin</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-muted hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* User Card & Sign Out */}
        <div className="flex flex-col gap-4 border-t border-white/5 pt-6">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Signed In As</span>
            <span className="text-xs text-text font-semibold truncate">
              System Administrator
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-white/5 text-xs text-muted hover:text-white hover:bg-danger/10 hover:border-danger/25 transition-all font-bold cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Administrative Container */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-surface border-b border-white/5 relative z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-background border border-white/5 text-muted hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
              <span className="text-white font-extrabold text-[10px]">LW</span>
            </div>
            <span className="font-extrabold text-sm text-white">Admin Console</span>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 rounded-lg bg-background border border-white/5 text-muted hover:text-danger transition-colors"
            title="Sign Out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </header>

        {/* Content Wrapper */}
        <main className="flex-grow p-6 md:p-10">{children}</main>
      </div>

      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Custom Sign Out Confirmation Modal */}
      <AnimatePresence>
        {showSignOutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4">
            <div
              onClick={() => setShowSignOutConfirm(false)}
              className="absolute inset-0 cursor-default"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass w-full max-w-sm p-6 rounded-2xl border border-white/10 shadow-2xl relative z-10 flex flex-col gap-4"
            >
              <div className="flex items-center gap-3 text-warning">
                <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-lg font-bold text-white">Sign Out</h3>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Are you sure you want to sign out of the administrative control panel?
              </p>
              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowSignOutConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-surface hover:bg-surface-hover text-muted hover:text-white transition-all text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeSignOut}
                  className="px-4 py-2 rounded-xl bg-danger hover:bg-danger-dark text-white transition-all text-xs font-bold shadow-md shadow-danger/10 cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
