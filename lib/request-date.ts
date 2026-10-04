/** A requested date is a preference. Mimi confirms availability on WhatsApp. */
export function isRequestDate(value: string | undefined, now: number, minDays = 1, maxDays = 183) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return false;
  const today = new Date(now);
  const min = new Date(today.getFullYear(), today.getMonth(), today.getDate() + minDays);
  const max = new Date(today.getFullYear(), today.getMonth(), today.getDate() + maxDays);
  return date >= min && date <= max;
}
