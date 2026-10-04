import test from "node:test";
import assert from "node:assert/strict";
import { phoneDigits, phoneProblem, isName, isEmail } from "../lib/validate.ts";
import { isRequestDate } from "../lib/request-date.ts";
import { nigerianStates, isNigerianState, isLgaOf } from "../lib/nigeria.ts";

test("phone validation rejects letters, excess digits and foreign prefixes", () => {
  for (const number of ["hello", "08012345678abc", "080123456789", "+448012345678", "080123", "00000000000"]) assert.ok(phoneProblem(number), number);
  for (const number of ["0801 234 5678", "+234 801 234 5678", "8012345678"]) {
    assert.equal(phoneProblem(number), null, number);
    assert.equal(phoneDigits(number), "8012345678");
  }
});
test("names accept punctuation and unicode, but not numeric garbage", () => {
  for (const name of ["Mimi", "Ọlá", "Anne-Marie", "O'Neil"]) assert.equal(isName(name), true);
  for (const name of ["12", "Mimi123", "@@", " "]) assert.equal(isName(name), false);
  assert.equal(isEmail("mimi@example.com"), true);
  assert.equal(isEmail("not an email"), false);
});
test("delivery requires a state and an area that belongs to it", () => {
  assert.equal(nigerianStates.length, 37);
  assert.equal(isNigerianState("Berlin"), false);
  assert.equal(isNigerianState("FCT Abuja"), true);
  assert.equal(isLgaOf("Lagos", "Ikeja"), true);
  assert.equal(isLgaOf("Rivers", "Ikeja"), false);
});
test("requested dates reject past, malformed, impossible and distant dates", () => {
  const now = new Date(2026, 9, 4, 12).getTime();
  for (const value of [undefined, "", "2026-10-04", "2026-09-30", "2026-02-30", "2027-10-04", "tomorrow"]) assert.equal(isRequestDate(value, now), false, value);
  assert.equal(isRequestDate("2026-10-05", now), true);
  assert.equal(isRequestDate("2026-10-20", now), true);
});
