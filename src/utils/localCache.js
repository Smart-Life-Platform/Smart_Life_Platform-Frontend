import { invalidateBoardStatuses } from '../api/boardStatusesApi';

const CACHE_PREFIX = 'avenor_';
const OWNER_KEY = 'avenor_cache_owner';

function clearCacheKeys() {
  try {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(CACHE_PREFIX))
      .forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Storage can be unavailable (private mode); the in-memory cache is cleared below.
  }
}

/**
 * Drops every board-scoped cache: the board → status/category maps in localStorage
 * and the in-memory board status list. Called on sign-in and sign-out so one account
 * never inherits board data from another account used in the same browser.
 */
export function resetUserCaches() {
  clearCacheKeys();
  invalidateBoardStatuses();
}

/**
 * Clears the caches only when the account changed. `avenor_cache_owner` remembers
 * which user the cached data belongs to.
 */
export function syncUserCaches(userId) {
  const id = userId ? String(userId) : '';

  try {
    if (id && window.localStorage.getItem(OWNER_KEY) === id) return;
  } catch {
    invalidateBoardStatuses();
    return;
  }

  resetUserCaches();

  if (!id) return;

  try {
    window.localStorage.setItem(OWNER_KEY, id);
  } catch {
    // Ignore: the cache simply will not be reused.
  }
}
