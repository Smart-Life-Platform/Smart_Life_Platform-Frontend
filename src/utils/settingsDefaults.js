export const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/Kyiv', label: 'Eastern European Time (Kyiv)' },
  { value: 'Europe/Warsaw', label: 'Central European Time (Warsaw)' },
  { value: 'Europe/Berlin', label: 'Central European Time (Berlin)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (London)' },
  { value: 'America/New_York', label: 'Eastern Time (New York)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (Los Angeles)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (Tokyo)' },
];

export const DAYS = [
  ['mon', 'Monday'],
  ['tue', 'Tuesday'],
  ['wed', 'Wednesday'],
  ['thu', 'Thursday'],
  ['fri', 'Friday'],
  ['sat', 'Saturday'],
  ['sun', 'Sunday'],
];

function buildWeek({ weekday, weekend }) {
  const week = {};
  DAYS.forEach(([key], index) => {
    const slot = index >= 5 ? weekend : weekday;
    week[key] = { on: Boolean(slot), start: slot ? slot[0] : '09:00', end: slot ? slot[1] : '17:00' };
  });
  return week;
}

export const DEFAULT_SETTINGS = {
  calendars: { primaryEnabled: true, holidaysEnabled: false, primaryType: 'work' },
  preferences: { aiEnabled: true, schedulingWeeks: 1, intervals: [0, 15, 30, 45] },
  hours: {
    working: buildWeek({ weekday: ['09:00', '17:00'], weekend: null }),
    personal: buildWeek({ weekday: ['18:00', '22:00'], weekend: ['09:00', '22:00'] }),
  },
};

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function mergeDeep(base, patch) {
  const result = { ...base };
  Object.entries(patch || {}).forEach(([key, value]) => {
    result[key] = isPlainObject(value) && isPlainObject(base?.[key]) ? mergeDeep(base[key], value) : value;
  });
  return result;
}

// The saved timezone may be missing from the short list (e.g. the default "UTC" or an old value).
export function timezoneOptions(current) {
  if (!current || TIMEZONES.some((tz) => tz.value === current)) return TIMEZONES;
  return [...TIMEZONES, { value: current, label: current }];
}

export function validateWeek(week) {
  for (const [key, label] of DAYS) {
    const slot = week[key];
    if (slot.on && (!slot.start || !slot.end || slot.start >= slot.end)) {
      return `${label}: end time must be later than start time.`;
    }
  }
  return '';
}