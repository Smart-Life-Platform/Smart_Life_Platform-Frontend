const STORAGE_KEY = 'smart-life-theme';

// "system" and anything unknown count as light: the app was designed light first.
export function normalizeTheme(value) {
  return value === 'dark' ? 'dark' : 'light';
}

export function setDocumentTheme(theme) {
  document.documentElement.setAttribute('data-theme', normalizeTheme(theme));
}

export function readLocalTheme() {
  try {
    return normalizeTheme(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return 'light';
  }
}

export function applyTheme(theme) {
  const next = normalizeTheme(theme);
  setDocumentTheme(next);
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // storage can be unavailable (private mode); the theme still applies for this session
  }
}

// Apply the last used theme as soon as the app loads, so a refresh does not flash light.
if (typeof document !== 'undefined') setDocumentTheme(readLocalTheme());