// The private tracking code in an order's link (/t/k7x2p9ab): 8 characters from an alphabet without
// the look-alikes i, l, o, 0 and 1, so it's easy to read out. Shared by the browser (phone-only
// orders, pasted links), the server (new orders) and the database check in db/migrations/001_orders.sql.

export const codeAlphabet = "abcdefghjkmnpqrstuvwxyz23456789";
export const codeLength = 8;

const codeShape = /^[a-hj-km-np-z2-9]{8}$/;
export const isOrderCode = (code: string) => codeShape.test(code);

/** A new code from a secure random source: pass one that returns a whole number below `n`. */
export function makeCode(randomBelow: (n: number) => number) {
  let code = "";
  for (let i = 0; i < codeLength; i++) code += codeAlphabet[randomBelow(codeAlphabet.length)];
  return code;
}
