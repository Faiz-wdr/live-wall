'use server';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

let supabaseAdminClient: SupabaseClient | null = null;

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase admin environment variables. Please check your Vercel settings.');
  }

  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseAdminClient;
}

// Helper to check server-side cookie authentication
async function verifyAdminAuth() {
  const cookieStore = await cookies();
  const isAdminAuthenticated = cookieStore.get('livewall_admin_session')?.value === 'true';
  if (!isAdminAuthenticated) {
    throw new Error('Unauthorized administrative access');
  }
}

// Action: Update status of a post or announcement
export async function adminUpdatePostStatus(id: string, status: 'active' | 'hidden' | 'deleted') {
  await verifyAdminAuth();
  try {
    const { data, error } = await getSupabaseAdminClient()
      .from('posts')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to update post status' };
  }
}

// Action: Delete post permanently
export async function adminDeletePost(id: string) {
  await verifyAdminAuth();
  try {
    const { error } = await getSupabaseAdminClient()
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    return { error: err.message || 'Failed to delete post' };
  }
}

// Action: Create high-priority announcement
export async function adminCreateAnnouncement(message: string, displayName: string) {
  await verifyAdminAuth();
  try {
    const { data, error } = await getSupabaseAdminClient()
      .from('posts')
      .insert([
        {
          display_name: displayName,
          message,
          post_type: 'announcement',
          status: 'active',
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to create announcement' };
  }
}

// Action: Update admin settings
export async function adminUpdateSettings(settingsToUpsert: { key: string; value: string }[]) {
  await verifyAdminAuth();
  try {
    const promises = settingsToUpsert.map((setting) =>
      getSupabaseAdminClient()
        .from('settings')
        .upsert(
          { key: setting.key, value: setting.value, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        )
    );

    const results = await Promise.all(promises);
    const firstError = results.find((r) => r.error);
    if (firstError) {
      throw firstError.error;
    }

    return { error: null };
  } catch (err: any) {
    return { error: err.message || 'Failed to save settings' };
  }
}

// Action: Update message/display_name of a post (used by admin to edit announcements)
export async function adminUpdatePost(id: string, updates: { message?: string; display_name?: string }) {
  await verifyAdminAuth();
  try {
    const { data, error } = await getSupabaseAdminClient()
      .from('posts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to update post' };
  }
}

