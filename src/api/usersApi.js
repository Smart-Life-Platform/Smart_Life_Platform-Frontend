import { apiClient } from './apiClient';

const cache = new Map();

/**
 * Board members only carry a `user` id, so the profile (name, email, avatar) is
 * resolved per id and cached for the session.
 * `GET /api/auth/users/{id}/` — returns null when the endpoint is not available,
 * in which case the UI falls back to initials.
 */
export const getUserProfile = async (id) => {
  if (!id) return null;
  if (cache.has(id)) return cache.get(id);

  const request = apiClient
    .get(`/auth/users/${id}/`)
    .then((response) => response.data)
    .catch(() => null);

  cache.set(id, request);
  return request;
};

export const resetUserProfiles = () => cache.clear();
