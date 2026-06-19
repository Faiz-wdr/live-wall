'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { adminUpdateSettings } from '@/app/admin/actions';

const settingsSchema = z.object({
  postExpiryDuration: z.number().min(1, 'Duration must be at least 1 minute').max(10080, 'Cannot exceed 7 days (10080 minutes)'),
  maxImageSize: z.number().min(1, 'Max size must be at least 1MB').max(50, 'Cannot exceed 50MB'),
  enableModeration: z.boolean(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      postExpiryDuration: 60,
      maxImageSize: 5,
      enableModeration: false,
    },
  });

  // Fetch settings from Supabase table on mount (Select is allowed publicly)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('settings')
          .select('key, value');

        if (error) throw error;

        if (data) {
          data.forEach((item) => {
            if (item.key === 'post_expiry_duration') {
              setValue('postExpiryDuration', parseInt(item.value || '60', 10));
            }
            if (item.key === 'max_image_size') {
              setValue('maxImageSize', parseInt(item.value || '5', 10));
            }
            if (item.key === 'enable_moderation') {
              setValue('enableModeration', item.value === 'true');
            }
          });
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [setValue]);

  const onSubmit = async (values: SettingsFormValues) => {
    try {
      setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      // Save each setting to Supabase using Server Action (safe service role bypass)
      const settingsToUpsert = [
        { key: 'post_expiry_duration', value: String(values.postExpiryDuration) },
        { key: 'max_image_size', value: String(values.maxImageSize) },
        { key: 'enable_moderation', value: String(values.enableModeration) },
      ];

      const { error: saveErr } = await adminUpdateSettings(settingsToUpsert);
      if (saveErr) throw new Error(saveErr);

      setSuccessMsg('System settings saved successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-muted">Retrieving settings...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">System Settings</h1>
        <p className="text-sm text-muted mt-1">Configure event rules, wall expiry values, and media limits</p>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-sm text-success font-semibold flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-sm text-danger font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit(onSubmit)} className="glass p-6 sm:p-8 rounded-3xl border border-white/5 flex flex-col gap-6">
        {/* Post Expiry Duration */}
        <div className="flex flex-col gap-2">
          <label htmlFor="postExpiryDuration" className="text-sm font-bold text-text">
            Post Expiry Duration (Minutes)
          </label>
          <input
            type="number"
            id="postExpiryDuration"
            {...register('postExpiryDuration', { valueAsNumber: true })}
            className="w-full px-4 py-3 bg-surface border border-white/5 focus:border-primary/50 rounded-xl text-white text-sm"
          />
          <p className="text-[11px] text-muted">Time in minutes after which posts are archived or automatically hidden from the wall.</p>
          {errors.postExpiryDuration && (
            <span className="text-xs text-danger font-medium">{errors.postExpiryDuration.message}</span>
          )}
        </div>

        {/* Max Image Size */}
        <div className="flex flex-col gap-2">
          <label htmlFor="maxImageSize" className="text-sm font-bold text-text">
            Max Image Size (MB)
          </label>
          <input
            type="number"
            id="maxImageSize"
            {...register('maxImageSize', { valueAsNumber: true })}
            className="w-full px-4 py-3 bg-surface border border-white/5 focus:border-primary/50 rounded-xl text-white text-sm"
          />
          <p className="text-[11px] text-muted">Maximum allowed file size for image uploads.</p>
          {errors.maxImageSize && (
            <span className="text-xs text-danger font-medium">{errors.maxImageSize.message}</span>
          )}
        </div>

        {/* Enable Moderation */}
        <div className="flex items-center justify-between border-t border-white/5 pt-6 mt-2">
          <div className="flex flex-col gap-1 pr-4">
            <label htmlFor="enableModeration" className="text-sm font-bold text-text">
              Enable Post Moderation
            </label>
            <p className="text-[11px] text-muted">When enabled, user submissions must be manually approved in the post management panel before appearing on the wall.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="enableModeration"
              {...register('enableModeration')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-surface border border-white/10 rounded-full peer peer-focus:ring-1 peer-focus:ring-primary/30 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-muted after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-checked:after:bg-white" />
          </label>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="mt-4 py-3 px-6 rounded-xl bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent text-white font-bold text-sm shadow-md transition-all self-start flex items-center gap-2 cursor-pointer"
        >
          {saving && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {saving ? 'Saving Settings...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
