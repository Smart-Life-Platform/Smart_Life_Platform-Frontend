export const PRIORITY_NAMES = ['low', 'medium', 'high', 'critical'];

/**
 * The API stores priority as a choice name: "low" | "medium" | "high" | "critical".
 * Sending a 1-based number (1..4) is rejected with `"2" is not a valid choice`, and
 * values coming from older tasks or from /tasks/priorities/ can be numeric, so both
 * shapes are accepted here and always resolved to the name.
 */
export function priorityName(value) {
  if (value === undefined || value === null || value === '') return null;
  const text = String(value).trim().toLowerCase();
  if (/^\d+$/.test(text)) return PRIORITY_NAMES[Number(text) - 1] || null;
  return PRIORITY_NAMES.includes(text) ? text : null;
}
