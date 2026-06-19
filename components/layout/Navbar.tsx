'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useUserIdentity } from '@/hooks/useUserIdentity';

export default function Navbar() {
  const pathname = usePathname();
  const { displayName, isInitialized } = useUserIdentity();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Monitor scroll for header background opacity
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/post', label: 'Submit Post' },
    { href: '/wall', label: 'Live Wall' },
    { href: '/admin', label: 'Admin Portal' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-background/80 backdrop-blur-md border-b border-white/5 py-4' : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-200">
              <span className="text-white font-extrabold text-lg tracking-wider">LW</span>
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-muted bg-clip-text text-transparent group-hover:text-primary transition-colors">
              Live<span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Wall</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors duration-200 relative py-1 px-2 rounded-md ${
                  isActive(link.href)
                    ? 'text-white bg-white/5'
                    : 'text-muted hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-primary to-accent rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          {/* User Display Badge */}
          <div className="hidden md:flex items-center gap-3">
            {isInitialized && displayName ? (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-white/5 shadow-inner">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-sm font-semibold text-text/90 tracking-wide">{displayName}</span>
              </div>
            ) : (
              <Link
                href="/post"
                className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-lg shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5"
              >
                Identify & Post
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-xl bg-surface border border-white/5 text-muted hover:text-white transition-colors focus:outline-none"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 glass border-b border-white/5 py-4 px-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-5 duration-200">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`py-2 px-3 rounded-lg text-base font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-white bg-white/5'
                    : 'text-muted hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          {isInitialized && displayName && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface border border-white/5 self-start">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm font-semibold text-text">{displayName}</span>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
