// Order rules shared by the browser and the server. The private tracking code in an order's link
// (/t/k7x2p9ab): 8 characters from an alphabet without the look-alikes i, l, o, 0 and 1, so it's easy
// to read out (the database checks the same shape, db/migrations/001_orders.sql). And the deposit split.

export const codeAlphabet = "abcdefghjkmnpqrstuvwxyz23456789";
export const codeLength = 8;

const codeShape = /^[a-hj-km-np-z2-9]{8}$/;
export const isOrderCode = (code: string) => codeShape.test(code);

/** Custom orders start with a 60% deposit and the other 40% when it's ready, or the full price up front. */
export const depositOf = (price: number) => Math.round(price * 0.6);

/** A new code from a secure random source: pass one that returns a whole number below `n`. */
export function makeCode(randomBelow: (n: number) => number) {
  let code = "";
  for (let i = 0; i < codeLength; i++) code += codeAlphabet[randomBelow(codeAlphabet.length)];
  return code;
}
