import { supabase } from '../lib/supabase';

export const AVATAR_BUCKET = 'avatars';
export const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

const extensions = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const SESSION_MISSING_MESSAGE =
  'Your session has no Supabase login, so the photo cannot be stored. Sign out and sign in again.';

function toFriendlyError(error) {
  if (error?.name === 'AuthSessionMissingError') return new Error(SESSION_MISSING_MESSAGE);
  return error;
}

/**
 * Storage and user metadata belong to Supabase, so a Supabase session is required.
 * Email/password accounts get one during sign-in (see AuthContext); this guard turns
 * the raw "Auth session missing!" error into an instruction the user can act on.
 */
async function requireSupabaseUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw toFriendlyError(error);
  if (!data.user) throw new Error(SESSION_MISSING_MESSAGE);
  return data.user;
}

export function getAvatarUrl(user) {
  const path = user?.user_metadata?.avatar_path;
  if (!path) return null;

  return supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function uploadAvatar(file) {
  if (!file || !extensions[file.type]) {
    throw new Error('Choose a JPEG, PNG or WebP image.');
  }
  if (!file.size || file.size > MAX_AVATAR_SIZE) {
    throw new Error('Choose an image up to 5 MB.');
  }

  const user = await requireSupabaseUser();
  const path = `${user.id}/${crypto.randomUUID()}.${extensions[file.type]}`;
  const storage = supabase.storage.from(AVATAR_BUCKET);
  const { error: uploadError } = await storage.upload(path, file, {
    upsert: false,
    contentType: file.type,
  });
  if (uploadError) throw uploadError;

  const { data: updated, error: updateError } = await supabase.auth.updateUser({
    data: { avatar_path: path },
  });
  if (updateError) {
    await storage.remove([path]).catch(() => {});
    throw toFriendlyError(updateError);
  }

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

export async function deleteAvatar() {
  const user = await requireSupabaseUser();
  const previous = user.user_metadata?.avatar_path;
  const { data: updated, error: updateError } = await supabase.auth.updateUser({
    data: { avatar_path: null },
  });
  if (updateError) throw toFriendlyError(updateError);

  let cleanupFailed = false;
  if (previous && previous.startsWith(`${user.id}/`)) {
    try {
      const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([previous]);
      cleanupFailed = Boolean(error);
    } catch {
      cleanupFailed = true;
    }
  }

  return { user: updated.user, cleanupFailed };
}
