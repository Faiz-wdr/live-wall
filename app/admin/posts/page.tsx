'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Post } from '@/hooks/useRealtimePosts';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { adminUpdatePostStatus, adminDeletePost, adminCreateAnnouncement, adminUpdatePost, adminDeleteExpiredPosts } from '@/app/admin/actions';

const announcementSchema = z.object({
  message: z.string().min(1, 'Announcement message is required').max(280, 'Cannot exceed 280 characters'),
  displayName: z.string().min(1, 'Author display name is required'),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const activeAnnouncement = posts.find((p) => p.post_type === 'announcement' && p.status === 'active');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      message: '',
      displayName: '📢 Announcement',
    },
  });

  useEffect(() => {
    if (activeAnnouncement) {
      reset({
        message: activeAnnouncement.message || '',
        displayName: activeAnnouncement.display_name || '📢 Announcement',
      });
    } else {
      reset({
        message: '',
        displayName: '📢 Announcement',
      });
    }
  }, [activeAnnouncement, reset]);

  // Fetch all posts (active, hidden, deleted) for admin view
  const fetchAllPosts = async () => {
    try {
      setLoading(true);
      // Clean up database first
      await adminDeleteExpiredPosts();

      const { data, error: fetchErr } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setPosts(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPosts();

    // Subscribe to all changes in the database
    const channel = supabase
      .channel('admin:posts_all')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          setPosts((prevPosts) => {
            if (eventType === 'INSERT') {
              const insertedPost = newRecord as Post;
              return [insertedPost, ...prevPosts];
            }
            if (eventType === 'UPDATE') {
              const updatedPost = newRecord as Post;
              return prevPosts.map((post) =>
                post.id === updatedPost.id ? updatedPost : post
              );
            }
            if (eventType === 'DELETE') {
              return prevPosts.filter((post) => post.id !== oldRecord.id);
            }
            return prevPosts;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Update status (hide / unhide / restore)
  const handleUpdateStatus = async (id: string, newStatus: 'active' | 'hidden') => {
    try {
      const { error: updateErr } = await adminUpdatePostStatus(id, newStatus);
      if (updateErr) throw new Error(updateErr);
      
      setSuccessMsg(`Post status updated to ${newStatus}`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  // Delete post permanently
  const handleDeletePost = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Post',
      message: 'Are you sure you want to permanently delete this post? This action is irreversible and cannot be undone.',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          const { error: deleteErr } = await adminDeletePost(id);
          if (deleteErr) throw new Error(deleteErr);
          
          setSuccessMsg('Post deleted successfully');
          setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err: any) {
          setError(err.message || 'Failed to delete post');
        }
      }
    });
  };

  // Handle announcement submission
  const onSubmitAnnouncement = async (values: AnnouncementFormValues) => {
    try {
      setError(null);
      if (activeAnnouncement) {
        // Edit current active announcement
        const { error: updateErr } = await adminUpdatePost(activeAnnouncement.id, {
          message: values.message,
          display_name: values.displayName,
        });
        if (updateErr) throw new Error(updateErr);
        setSuccessMsg('Announcement updated successfully!');
      } else {
        // Create new announcement
        const { error: insertErr } = await adminCreateAnnouncement(values.message, values.displayName);
        if (insertErr) throw new Error(insertErr);
        setSuccessMsg('Announcement posted to LiveWall!');
      }
      setShowAnnouncementForm(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to process announcement');
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Post Management</h1>
          <p className="text-sm text-muted mt-1">Review feed entries, publish announcements, or moderate posts</p>
        </div>
        <button
          onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
          className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-sm shadow-md transition-all cursor-pointer"
        >
          {showAnnouncementForm ? 'Cancel' : activeAnnouncement ? 'Edit Announcement' : 'New Announcement'}
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/20 text-sm text-success font-semibold shadow-[0_0_15px_rgba(16,185,129,0.1)] animate-in fade-in slide-in-from-top-2 duration-300">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-danger/10 border border-danger/20 text-sm text-danger font-semibold shadow-[0_0_15px_rgba(239,68,68,0.1)] animate-in fade-in slide-in-from-top-2 duration-300">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Write Announcement Drawer/Form */}
      {showAnnouncementForm && (
        <div className="glass p-6 rounded-3xl border border-white/10 shadow-xl flex flex-col gap-4 animate-in fade-in duration-200">
          <h2 className="text-lg font-bold text-white">
            {activeAnnouncement ? 'Edit Current Announcement' : 'Create Announcement'}
          </h2>
          <form onSubmit={handleSubmit(onSubmitAnnouncement)} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 flex flex-col gap-2">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Author Name</label>
                <input
                  type="text"
                  {...register('displayName')}
                  className="w-full px-4 py-3 bg-surface border border-white/5 focus:border-primary/50 rounded-xl text-white text-sm"
                />
                {errors.displayName && (
                  <span className="text-xs text-danger font-medium">{errors.displayName.message}</span>
                )}
              </div>
              <div className="md:col-span-2 flex flex-col gap-2">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Announcement Message</label>
                <input
                  type="text"
                  placeholder="Enter high-priority announcement..."
                  {...register('message')}
                  className="w-full px-4 py-3 bg-surface border border-white/5 focus:border-primary/50 rounded-xl text-white text-sm"
                />
                {errors.message && (
                  <span className="text-xs text-danger font-medium">{errors.message.message}</span>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent text-white font-bold text-sm shadow-md transition-all self-end cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : activeAnnouncement ? 'Update Announcement' : 'Publish Announcement'}
            </button>
          </form>
        </div>
      )}

      {/* Main Table */}
      <div className="glass rounded-3xl border border-white/5 p-6 sm:p-8">
        {loading ? (
          <div className="text-center py-10 text-muted">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-10 text-muted">No posts available.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="pb-3 text-xs font-bold text-muted uppercase tracking-wider">Preview</th>
                  <th className="pb-3 text-xs font-bold text-muted uppercase tracking-wider">Author</th>
                  <th className="pb-3 text-xs font-bold text-muted uppercase tracking-wider">Message</th>
                  <th className="pb-3 text-xs font-bold text-muted uppercase tracking-wider">Type</th>
                  <th className="pb-3 text-xs font-bold text-muted uppercase tracking-wider">Status</th>
                  <th className="pb-3 text-xs font-bold text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {posts
                  .filter((post) => {
                    if (post.post_type === 'announcement') return true;
                    if (!post.expires_at) return true;
                    return new Date(post.expires_at).getTime() > Date.now();
                  })
                  .map((post) => (
                  <tr key={post.id} className="hover:bg-white/2">
                    {/* Preview Image */}
                    <td className="py-4 pr-4">
                      {post.image_url ? (
                        <div className="w-16 h-10 rounded-lg overflow-hidden border border-white/5 bg-black/20">
                          <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <span className="text-xs text-muted/30 italic">No Image</span>
                      )}
                    </td>

                    {/* Author */}
                    <td className="py-4 text-xs sm:text-sm font-semibold text-accent pr-4">
                      {post.display_name}
                    </td>

                    {/* Message */}
                    <td className="py-4 text-xs sm:text-sm text-text/90 max-w-sm truncate pr-4">
                      {post.message || <span className="text-muted/40 italic">Image upload</span>}
                    </td>

                    {/* Type */}
                    <td className="py-4 pr-4">
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

                    {/* Status */}
                    <td className="py-4 pr-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wide ${
                          post.status === 'active'
                            ? 'bg-success/20 text-success border border-success/25'
                            : post.status === 'hidden'
                            ? 'bg-warning/20 text-warning border border-warning/25'
                            : 'bg-danger/20 text-danger border border-danger/25'
                        }`}
                      >
                        {post.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4">
                      <div className="flex gap-2">
                        {post.status === 'active' ? (
                          <button
                            onClick={() => handleUpdateStatus(post.id, 'hidden')}
                            className="px-3 py-1.5 rounded-lg border border-white/5 text-xs text-warning hover:bg-warning/10 hover:border-warning/20 transition-all font-semibold cursor-pointer"
                          >
                            Hide
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(post.id, 'active')}
                            className="px-3 py-1.5 rounded-lg border border-white/5 text-xs text-success hover:bg-success/10 hover:border-success/20 transition-all font-semibold cursor-pointer"
                          >
                            Restore
                          </button>
                        )}
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="px-3 py-1.5 rounded-lg border border-white/5 text-xs text-danger hover:bg-danger/10 hover:border-danger/20 transition-all font-semibold cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4">
            <div
              onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
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
                <h3 className="text-lg font-bold text-white">{confirmModal.title}</h3>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                {confirmModal.message}
              </p>
              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-xl bg-surface hover:bg-surface-hover text-muted hover:text-white transition-all text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmModal.onConfirm}
                  className="px-4 py-2 rounded-xl bg-danger hover:bg-danger-dark text-white transition-all text-xs font-bold shadow-md shadow-danger/10 cursor-pointer"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  </div>
  );
}

