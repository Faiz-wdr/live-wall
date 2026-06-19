'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRealtimePosts } from '@/hooks/useRealtimePosts';
import Link from 'next/link';

export default function AdminDashboard() {
  const { posts, loading: postsLoading } = useRealtimePosts();
  const [metrics, setMetrics] = useState({
    total: 0,
    active: 0,
    hidden: 0,
    announcements: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setLoading(true);
        // Query database directly to count total metrics
        const { data, error } = await supabase
          .from('posts')
          .select('status, post_type');

        if (error) throw error;

        const totals = {
          total: data?.length || 0,
          active: data?.filter((p) => p.status === 'active').length || 0,
          hidden: data?.filter((p) => p.status === 'hidden').length || 0,
          announcements: data?.filter((p) => p.post_type === 'announcement').length || 0,
        };

        setMetrics(totals);
      } catch (err) {
        console.error('Error fetching dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, [posts]); // Refresh metrics whenever posts update in real-time

  const metricCards = [
    {
      title: 'Total Posts',
      value: loading ? '...' : metrics.total,
      color: 'border-white/5 bg-surface/30',
      text: 'text-white',
      icon: (
        <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
        </svg>
      ),
    },
    {
      title: 'Active Posts',
      value: loading ? '...' : metrics.active,
      color: 'border-success/20 bg-success/5',
      text: 'text-success',
      icon: (
        <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Hidden Posts',
      value: loading ? '...' : metrics.hidden,
      color: 'border-warning/20 bg-warning/5',
      text: 'text-warning',
      icon: (
        <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
        </svg>
      ),
    },
    {
      title: 'Announcements',
      value: loading ? '...' : metrics.announcements,
      color: 'border-primary/20 bg-primary/5',
      text: 'text-primary',
      icon: (
        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">System Dashboard</h1>
        <p className="text-sm text-muted mt-1">Event status metrics and real-time statistics</p>
      </div>

      {/* Grid of Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((card, idx) => (
          <div
            key={idx}
            className={`p-6 rounded-2xl border flex flex-col gap-2 relative overflow-hidden ${card.color}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">{card.title}</span>
              {card.icon}
            </div>
            <span className={`text-3xl font-black ${card.text}`}>{card.value}</span>
          </div>
        ))}
      </div>

      {/* Recent Feed Table / Quick Access */}
      <div className="glass rounded-3xl border border-white/5 p-6 sm:p-8 flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Recent Submissions</h2>
            <p className="text-xs text-muted">Latest posts from the audience</p>
          </div>
          <Link
            href="/admin/posts"
            className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
          >
            Manage all posts
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {postsLoading ? (
          <div className="text-center py-6 text-sm text-muted">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted">No posts to display.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="pb-3 text-xs font-bold text-muted uppercase tracking-wider">User</th>
                  <th className="pb-3 text-xs font-bold text-muted uppercase tracking-wider">Type</th>
                  <th className="pb-3 text-xs font-bold text-muted uppercase tracking-wider">Message</th>
                  <th className="pb-3 text-xs font-bold text-muted uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {posts.slice(0, 5).map((post) => (
                  <tr key={post.id} className="hover:bg-white/2">
                    <td className="py-4 text-xs sm:text-sm font-semibold text-accent">
                      {post.display_name}
                    </td>
                    <td className="py-4 text-xs font-bold text-text/80">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wide ${
                          post.post_type === 'announcement'
                            ? 'bg-primary/20 text-primary border border-primary/25'
                            : 'bg-white/5 text-muted border border-white/5'
                        }`}
                      >
                        {post.post_type}
                      </span>
                    </td>
                    <td className="py-4 text-xs sm:text-sm text-text/90 max-w-xs truncate">
                      {post.message || <span className="text-muted/40 italic">Image upload</span>}
                    </td>
                    <td className="py-4 text-xs text-muted">
                      {new Date(post.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
