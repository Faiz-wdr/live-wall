import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface Post {
  id: string;
  display_name: string;
  message: string | null;
  image_url: string | null;
  post_type: 'user' | 'announcement';
  status: 'active' | 'hidden' | 'deleted';
  likes_count: number;
  created_at: string;
  expires_at: string | null;
  updated_at: string;
}

export function useRealtimePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch active posts initially
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setPosts(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();

    // Subscribe to realtime updates on the posts table
    const channel = supabase
      .channel('public:posts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;

          setPosts((prevPosts) => {
            if (eventType === 'INSERT') {
              const insertedPost = newRecord as Post;
              if (insertedPost.status === 'active') {
                // Prepend or append depending on layout (usually prepend for wall/list)
                return [insertedPost, ...prevPosts];
              }
              return prevPosts;
            }

            if (eventType === 'UPDATE') {
              const updatedPost = newRecord as Post;
              if (updatedPost.status !== 'active') {
                // If it's hidden or deleted, remove it from active list
                return prevPosts.filter((post) => post.id !== updatedPost.id);
              }
              // If it's active, update it in place or insert if not present
              const exists = prevPosts.some((post) => post.id === updatedPost.id);
              if (exists) {
                return prevPosts.map((post) =>
                  post.id === updatedPost.id ? updatedPost : post
                );
              } else {
                return [updatedPost, ...prevPosts];
              }
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

  // Create post helper
  const createPost = async (postData: {
    display_name: string;
    message?: string;
    image_url?: string;
    post_type?: 'user' | 'announcement';
    expires_at?: string | null;
  }) => {
    try {
      const { data, error: insertError } = await supabase
        .from('posts')
        .insert([
          {
            display_name: postData.display_name,
            message: postData.message || null,
            image_url: postData.image_url || null,
            post_type: postData.post_type || 'user',
            status: 'active',
            expires_at: postData.expires_at || null,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Failed to create post' };
    }
  };

  // Update post helper (used by Admin)
  const updatePost = async (id: string, updates: Partial<Post>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('posts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Failed to update post' };
    }
  };

  // Delete post helper (used by Admin)
  const deletePost = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Failed to delete post' };
    }
  };

  // Increment likes helper using public RPC function
  const likePost = async (id: string) => {
    try {
      const { error: rpcError } = await supabase.rpc('increment_likes', {
        post_id: id,
      });
      if (rpcError) throw rpcError;
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Failed to like post' };
    }
  };

  return {
    posts,
    loading,
    error,
    createPost,
    updatePost,
    deletePost,
    likePost,
    refetch: fetchPosts,
  };
}
