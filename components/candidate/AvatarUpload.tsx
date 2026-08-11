'use client';

// A profile photo, uploaded to the avatars bucket (public, image-only, 2 MB
// cap -- see supabase/create-avatar-bucket.sql) and written to
// candidate_profiles.avatar_url. Controlled by the parent (profile page,
// dashboard) so it always shows the same avatar_url the rest of that page's
// form/state already has, rather than fetching its own copy.
//
// Falls back to the same letter-initial circle used elsewhere in the app
// (Navbar.tsx, CandidateSearch.tsx) when there is no photo yet.

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Camera, Loader2 } from 'lucide-react';

const SIZE_CLASSES = {
  sm: 'w-12 h-12 text-base',
  lg: 'w-20 h-20 text-2xl',
} as const;

export default function AvatarUpload({
  userId,
  avatarUrl,
  fullName,
  onUploaded,
  size = 'lg',
  editable = true,
}: {
  userId: string;
  avatarUrl: string | null;
  fullName: string;
  onUploaded?: (url: string) => void;
  size?: 'sm' | 'lg';
  editable?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const sizeClass = SIZE_CLASSES[size];
  const initial = fullName.trim().charAt(0).toUpperCase() || '?';

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2 MB.');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setError('Service unavailable.');
      return;
    }

    setUploading(true);

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${userId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(storagePath, file, { upsert: false });

    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(storagePath);

    const { error: dbError } = await supabase
      .from('candidate_profiles')
      .update({ avatar_url: urlData.publicUrl })
      .eq('user_id', userId);

    setUploading(false);
    if (dbError) {
      setError(`Could not save photo: ${dbError.message}`);
      return;
    }

    onUploaded?.(urlData.publicUrl);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="flex items-center gap-4">
      <div className={`relative shrink-0 ${sizeClass} rounded-full overflow-hidden bg-brand-100 flex items-center justify-center`}>
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={fullName || 'Profile photo'} className="w-full h-full object-cover" />
        ) : (
          <span className="font-bold text-brand-600">{initial}</span>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          </div>
        )}
      </div>

      {editable && (
        <div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            <Camera className="w-3.5 h-3.5" />
            {avatarUrl ? 'Change photo' : 'Add photo'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
          {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
        </div>
      )}
    </div>
  );
}
