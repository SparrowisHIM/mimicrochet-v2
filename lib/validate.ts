// Field rules shared by the custom order and checkout. Inputs filter as you type, and these
// decide what counts as done, so nothing invalid can reach Mimi.

/** Digits after +234, without the leading 0. "0801 234 5678" and "+234 801 234 5678" both become "8012345678". */
export function phoneDigits(raw: string) {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("234")) d = d.slice(3);
  if (d.startsWith("0")) d = d.slice(1);
  return d;
}

/** Nigerian mobile numbers: 70x, 80x, 81x, 90x or 91x, then 7 more digits. */
export const isNigerianMobile = (digits: string) => /^(70|80|81|90|91)\d{8}$/.test(digits);

/** "8012345678" → "801 234 5678" (also formats a partial number as it's typed). */
export const formatPhone = (digits: string) => [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 10)].filter(Boolean).join(" ");

export const fullPhone = (digits: string) => `+234 ${formatPhone(digits)}`;

/** What's wrong with a typed number, in words, or null when it's a real Nigerian mobile number. */
export function phoneProblem(typed: string) {
  if (/[^\d\s+()-]/.test(typed)) return "Use numbers only for your WhatsApp number.";
  const compact = typed.replace(/[\s()-]/g, "");
  if (compact.includes("+") && !/^\+234\d+$/.test(compact)) return "Use a Nigerian number starting with +234 or 0.";
  const digits = phoneDigits(typed);
  if (!digits) return "Add your WhatsApp number.";
  if (!/^[789]/.test(digits) || (digits.length > 1 && !/^[789][01]/.test(digits))) return "Nigerian mobile numbers start with 070, 080, 081, 090 or 091.";
  if (digits.length < 10) return "That number is too short. It should be 11 digits, like 0801 234 5678.";
  if (digits.length > 10) return "That number is too long. Check the digits and try again.";
  return isNigerianMobile(digits) ? null : "That doesn’t look like a Nigerian mobile number.";
}

/** Letters (any language), spaces, apostrophes, hyphens and full stops. */
export const nameChars = /[^\p{L}\p{M}' .-]/gu;
export const cleanName = (raw: string) => raw.replace(nameChars, "").replace(/\s{2,}/g, " ").slice(0, 60);
export const isName = (s: string) => /^[\p{L}\p{M}' .-]+$/u.test(s.trim()) && (s.match(/\p{L}/gu)?.length ?? 0) >= 2 && s.trim().length <= 60;

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(s.trim());

/** Free text that should say something: at least `min` characters and some letters. */
export const hasWords = (s: string, min = 2) => s.trim().length >= min && /\p{L}{2,}/u.test(s);
