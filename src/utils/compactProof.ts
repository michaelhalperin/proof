/**
 * Encode dateKey + timestamp + hash into one minimal base64url token (~58 chars).
 * Payload: 3 bytes date (y-2000, m, d) + 8 bytes timestamp + 32 bytes hash = 43 bytes.
 */

const BASE64URL =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function encodeBase64Url(bytes: Uint8Array): string {
  let result = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    result += BASE64URL[a >> 2];
    result += BASE64URL[((a & 3) << 4) | (b >> 4)];
    result += i + 1 < bytes.length ? BASE64URL[((b & 15) << 2) | (c >> 6)] : "";
    result += i + 2 < bytes.length ? BASE64URL[c & 63] : "";
  }
  return result;
}

function decodeBase64Url(str: string): Uint8Array | null {
  const clean = str.replace(/\s/g, "");
  const pad = (4 - (clean.length % 4)) % 4;
  const padded = clean + "=".repeat(pad === 4 ? 0 : pad);
  const bytes: number[] = [];
  for (let i = 0; i < padded.length; i += 4) {
    const i0 = BASE64URL.indexOf(padded[i]);
    const i1 = BASE64URL.indexOf(padded[i + 1]);
    const i2 = padded[i + 2] === "=" ? -1 : BASE64URL.indexOf(padded[i + 2]);
    const i3 = padded[i + 3] === "=" ? -1 : BASE64URL.indexOf(padded[i + 3]);
    if (i0 < 0 || i1 < 0) return null;
    bytes.push((i0 << 2) | (i1 >> 4));
    if (i2 >= 0) bytes.push(((i1 & 15) << 4) | (i2 >> 2));
    if (i3 >= 0) bytes.push(((i2 & 3) << 6) | i3);
  }
  return new Uint8Array(bytes);
}

function hexToBytes(hex: string): Uint8Array | null {
  const clean = hex.replace(/\s/g, "").toLowerCase();
  if (clean.length !== 64 || !/^[a-f0-9]{64}$/.test(clean)) return null;
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function encodeCompactProof(
  dateKey: string,
  createdAt: number,
  hash: string
): string | null {
  const hashBytes = hexToBytes(hash);
  if (!hashBytes) return null;
  const m = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = parseInt(m[1], 10) - 2000;
  const month = parseInt(m[2], 10);
  const day = parseInt(m[3], 10);
  if (y < 0 || y > 255 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const buf = new Uint8Array(3 + 8 + 32);
  buf[0] = y;
  buf[1] = month;
  buf[2] = day;
  const hi = Math.floor(createdAt / 0x100000000);
  const lo = createdAt >>> 0;
  buf[3] = (hi >> 24) & 0xff;
  buf[4] = (hi >> 16) & 0xff;
  buf[5] = (hi >> 8) & 0xff;
  buf[6] = hi & 0xff;
  buf[7] = (lo >> 24) & 0xff;
  buf[8] = (lo >> 16) & 0xff;
  buf[9] = (lo >> 8) & 0xff;
  buf[10] = lo & 0xff;
  buf.set(hashBytes, 11);
  return encodeBase64Url(buf);
}

export function decodeCompactProof(token: string): {
  dateKey: string;
  createdAt: number;
  hash: string;
} | null {
  const bytes = decodeBase64Url(token);
  if (!bytes || bytes.length < 43) return null;
  const buf = bytes.subarray(0, 43);
  const y = buf[0] + 2000;
  const month = buf[1];
  const day = buf[2];
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dateKey = `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const hi = (buf[3] << 24) | (buf[4] << 16) | (buf[5] << 8) | buf[6];
  const lo = (buf[7] << 24) | (buf[8] << 16) | (buf[9] << 8) | buf[10];
  const createdAt = hi * 0x100000000 + lo;
  const hash = bytesToHex(buf.subarray(11, 43));
  return { dateKey, createdAt, hash };
}
