export function setTimezoneCookie(timezone) {
  if (!timezone) return;
  document.cookie = `timezone=${encodeURIComponent(timezone)}; path=/; max-age=31536000; SameSite=Lax`;
}