export function qaEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return /^[a-z0-9][a-z0-9._+-]{0,63}@odu\.local$/.test(email) ? email : null;
}
export function deliveryEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) && !email.endsWith('.local') ? email : null;
}
