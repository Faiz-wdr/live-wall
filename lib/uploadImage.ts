import { supabase } from './supabase';

export async function uploadImage(file: File): Promise<{ url: string | null; error: string | null }> {
  try {
    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    // Upload to bucket 'post-images'
    const { error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data } = supabase.storage
      .from('post-images')
      .getPublicUrl(filePath);

    if (!data || !data.publicUrl) {
      throw new Error('Could not get public URL for uploaded file');
    }

    return { url: data.publicUrl, error: null };
  } catch (err: any) {
    return { url: null, error: err.message || 'Image upload failed' };
  }
}
