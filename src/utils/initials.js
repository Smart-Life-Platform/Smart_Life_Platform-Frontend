/** Two-letter monogram used by the small avatars (assignee on a card, member rows). */
export function initialsOf(name, fallback = '?') {
  const letters = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return letters || fallback;
}
