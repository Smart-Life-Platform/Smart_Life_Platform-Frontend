const BASE_URL = 'https://date.nager.at/api/v3/PublicHolidays';
const COUNTRY = 'UA';
const cache = new Map();

export function fetchHolidays(year) {
  if (!cache.has(year)) {
    const request = fetch(`${BASE_URL}/${year}/${COUNTRY}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Holidays request failed (${response.status})`);
        return response.json();
      })
      .then((list) => list.map(({ date, localName }) => ({ date, name: localName })))
      .catch((error) => {
        cache.delete(year);
        throw error;
      });
    cache.set(year, request);
  }
  return cache.get(year);
}