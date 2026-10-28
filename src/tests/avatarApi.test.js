import { supabase } from '../lib/supabase';
import { deleteAvatar, uploadAvatar } from '../api/avatarApi';

jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn(), updateUser: jest.fn() },
    storage: { from: jest.fn() },
  },
}));

const storage = { upload: jest.fn(), remove: jest.fn() };
const file = new File(['image'], 'photo.png', { type: 'image/png' });

beforeEach(() => {
  jest.resetAllMocks();
  Object.defineProperty(global, 'crypto', {
    configurable: true,
    value: { randomUUID: () => 'new-photo' },
  });
  supabase.storage.from.mockReturnValue(storage);
  supabase.auth.getUser.mockResolvedValue({
    data: { user: { id: 'owner', user_metadata: { avatar_path: 'owner/old.png' } } },
  });
  storage.upload.mockResolvedValue({ error: null });
  storage.remove.mockResolvedValue({ error: null });
  supabase.auth.updateUser.mockResolvedValue({
    data: { user: { id: 'owner' } },
    error: null,
  });
});

test('rejects unsupported files before contacting Supabase', async () => {
  await expect(uploadAvatar(new File(['text'], 'file.txt', { type: 'text/plain' }))).rejects.toThrow('JPEG');
  expect(supabase.auth.getUser).not.toHaveBeenCalled();
});

test('rejects files larger than 5 MB before contacting Supabase', async () => {
  const largeFile = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' });
  await expect(uploadAvatar(largeFile)).rejects.toThrow('5 MB');
  expect(supabase.auth.getUser).not.toHaveBeenCalled();
});

test('saves new photo before removing the previous image', async () => {
  await uploadAvatar(file);
  expect(storage.upload).toHaveBeenCalledWith(
    'owner/new-photo.png',
    file,
    expect.objectContaining({ upsert: false }),
  );
  expect(supabase.auth.updateUser).toHaveBeenCalledWith({
    data: { avatar_path: 'owner/new-photo.png' },
  });
  expect(storage.remove).toHaveBeenCalledWith(['owner/old.png']);
  expect(storage.remove.mock.invocationCallOrder[0])
    .toBeGreaterThan(supabase.auth.updateUser.mock.invocationCallOrder[0]);
});

test('rolls back the new file when saving metadata fails and preserves the old photo', async () => {
  supabase.auth.updateUser.mockResolvedValue({ error: new Error('Metadata failed') });
  await expect(uploadAvatar(file)).rejects.toThrow('Metadata failed');
  expect(storage.remove).toHaveBeenCalledTimes(1);
  expect(storage.remove).toHaveBeenCalledWith(['owner/new-photo.png']);
});

test('does not delete paths outside the current user folder', async () => {
  supabase.auth.getUser.mockResolvedValue({
    data: { user: { id: 'owner', user_metadata: { avatar_path: 'other/photo.png' } } },
  });
  await uploadAvatar(file);
  expect(storage.remove).not.toHaveBeenCalled();
});

test('clears metadata before removing the current photo', async () => {
  await deleteAvatar();

  expect(supabase.auth.updateUser).toHaveBeenCalledWith({
    data: { avatar_path: null },
  });
  expect(storage.remove).toHaveBeenCalledWith(['owner/old.png']);
  expect(storage.remove.mock.invocationCallOrder[0])
    .toBeGreaterThan(supabase.auth.updateUser.mock.invocationCallOrder[0]);
});
