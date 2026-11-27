/**
 * Minimal locale switch for messages produced by the API layer.
 * The interface copy is English; these strings follow the language of the browser so a
 * Ukrainian user still reads a Ukrainian error and everyone else gets English.
 */
const MESSAGES = {
  sessionExpired: {
    en: 'Your session has expired. Redirecting to the login page.',
    uk: 'Сесія завершилася. Перенаправлення на сторінку входу.',
  },
  insufficientRights: {
    en: 'You do not have permission for this action.',
    uk: 'Недостатньо прав для цієї операції.',
  },
  serverRejected: {
    en: 'The server rejected the request.',
    uk: 'Сервер відхилив запит.',
  },
  apiUnavailable: {
    en: 'Could not connect to the API.',
    uk: 'Не вдалося підключитися до API.',
  },
};

export const prefersUkrainian = () => {
  if (typeof navigator === 'undefined') return false;
  const languages = navigator.languages && navigator.languages.length
    ? navigator.languages
    : [navigator.language];
  return languages.some((language) => String(language || '').toLowerCase().startsWith('uk'));
};

export function localeMessage(key) {
  const entry = MESSAGES[key];
  if (!entry) return '';
  return prefersUkrainian() ? entry.uk : entry.en;
}
