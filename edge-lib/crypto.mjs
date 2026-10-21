// 暗号処理（Web Crypto API のみ使用：Netlify Edge Functions / Node.js 共通）
const enc = new TextEncoder();
const dec = new TextDecoder();

export function b64urlEncode(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function b64urlDecode(str) {
  const s = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
export const textToB64url = (t) => b64urlEncode(enc.encode(t));
export const b64urlToText = (b) => dec.decode(b64urlDecode(b));

export function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  let diff = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) diff |= (a.charCodeAt(i % a.length) || 0) ^ (b.charCodeAt(i % b.length) || 0);
  return diff === 0;
}

async function hmacKey(secret) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}
export async function hmac(secret, data) {
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(data));
  return b64urlEncode(sig);
}
export async function sha256Hex(text) {
  const d = await crypto.subtle.digest("SHA-256", enc.encode(text));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// パスワードのハッシュ（PBKDF2-SHA256）
export const DEFAULT_ITERATIONS = 20000;
export async function hashPassword(password, saltB64url, iterations = DEFAULT_ITERATIONS) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: b64urlDecode(saltB64url), iterations }, key, 256);
  return b64urlEncode(bits);
}
export function randomB64url(n = 16) {
  return b64urlEncode(crypto.getRandomValues(new Uint8Array(n)));
}
// 会員向けの初期パスワード（紛らわしい文字を除いた 16 文字 ≒ 79bit）
export function generatePassword() {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  const r = crypto.getRandomValues(new Uint8Array(16));
  let s = "";
  for (let i = 0; i < 16; i++) { s += chars[r[i] % chars.length]; if (i % 4 === 3 && i < 15) s += "-"; }
  return s;
}

// 署名付きセッション
export async function signSession(secret, payload) {
  const body = textToB64url(JSON.stringify(payload));
  return `${body}.${await hmac(secret, body)}`;
}
export async function verifySession(secret, token, nowSec) {
  if (!token || typeof token !== "string" || token.length > 2048) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expect = await hmac(secret, body);
  if (!timingSafeEqual(sig, expect)) return null;
  let p;
  try { p = JSON.parse(b64urlToText(body)); } catch { return null; }
  if (!p || typeof p.sub !== "string" || typeof p.exp !== "number" || p.exp <= nowSec) return null;
  return p;
}
