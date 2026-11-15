export function windowLabel(weeks) {
  return `${weeks} week${weeks > 1 ? 's' : ''}`;
}

// Dates in the past are always allowed (so overdue tasks can still be edited).
export function isWithinWindow(dateString, weeks) {
  if (!dateString) return true;
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return true;
  const limit = new Date();
  limit.setHours(23, 59, 59, 999);
  limit.setDate(limit.getDate() + weeks * 7);
  return date <= limit;
}

// Rounds "HH:MM" to the nearest allowed minute. With all four intervals selected the time is left as is.
export function snapTime(time, intervals) {
  if (!time || !Array.isArray(intervals) || intervals.length === 0 || intervals.length >= 4) return time;
  const [hours, minutes] = time.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;

  const sorted = [...intervals].sort((a, b) => a - b);
  const candidates = [...sorted, sorted[0] + 60];
  let best = candidates[0];
  candidates.forEach((candidate) => {
    if (Math.abs(candidate - minutes) < Math.abs(best - minutes)) best = candidate;
  });

  let total = hours * 60 + best;
  if (total >= 24 * 60) total = hours * 60 + sorted[sorted.length - 1];
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}