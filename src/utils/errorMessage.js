/**
 * Turns whatever an API rejection carries into text a person can read.
 *
 * Django REST Framework answers errors in several shapes — a plain string, `detail`,
 * `error`, `non_field_errors`, or a map of field → messages. Passing such an object to
 * `new Error()` stringifies it to "[object Object]", which is what the Google Calendar
 * card used to show under its description.
 */

const readString = (value) => {
  if (typeof value !== 'string') return '';
  const text = value.trim();
  // The very bug this module exists for: an object stringified into an Error message.
  return text && text !== '[object Object]' ? text : '';
};

/** Best-effort message from a response body. Returns `fallback` ('' by default) when empty. */
export function messageFromPayload(payload, fallback = '') {
  const direct = readString(payload);
  if (direct) {
    // Django's debug page or a proxy error page is not a message for the user.
    return /^<[a-z!]/i.test(direct) ? fallback : direct;
  }
  if (!payload || typeof payload !== 'object') {
    return payload === 0 ? '0' : fallback;
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const text = messageFromPayload(item);
      if (text) return text;
    }
    return fallback;
  }

  const preferred = payload.detail ?? payload.error ?? payload.message ?? payload.non_field_errors;
  const preferredText = messageFromPayload(preferred);
  if (preferredText) return preferredText;

  for (const value of Object.values(payload)) {
    const text = messageFromPayload(value);
    if (text) return text;
  }
  return fallback;
}

/** Never returns "[object Object]": a thrown value, an Error or a response body. */
export function errorText(error, fallback = 'Something went wrong.') {
  if (error === null || error === undefined || error === '') return fallback;
  if (typeof error === 'string') return readString(error) || fallback;
  if (typeof error === 'object') {
    const message = readString(error.message);
    if (message) return message;
    return messageFromPayload(error, fallback);
  }
  return String(error);
}
