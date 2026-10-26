import { supabase } from '../lib/supabase';

const bucket = 'avatars';
const extensions = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export function getAvatarUrl(user) {
  const path = user?.user_metadata?.avatar_path;
  return path ? supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl : null;
}

export async function uploadAvatar(file) {
  if (!file || !extensions[file.type]) throw new Error('Choose a JPEG, PNG or WebP image.');
  if (!file.size || file.size > 5 * 1024 * 1024) throw new Error('Choose an image up to 5 MB.');

  const { data, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!data.user) throw new Error('Sign in to upload a photo.');

  const user = data.user;
  const path = `${user.id}/${crypto.randomUUID()}.${extensions[file.type]}`;
  const storage = supabase.storage.from(bucket);
  const { error: uploadError } = await storage.upload(path, file, { upsert: false, contentType: file.type });
  if (uploadError) throw uploadError;

  const { data: updated, error: updateError } = await supabase.auth.updateUser({ data: { avatar_path: path } });
  if (updateError) {
    await storage.remove([path]).catch(() => {});
    throw updateError;
  }

  // Keep the previous image until the new profile metadata has been saved.
  const previous = user.user_metadata?.avatar_path;
  let cleanupFailed = false;
  if (previous && previous.startsWith(`${user.id}/`) && previous !== path) {
    try {
      const { error } = await storage.remove([previous]);
      cleanupFailed = Boolean(error);
    } catch {
      cleanupFailed = true;
    }
  }
  return { user: updated.user, cleanupFailed };
}
