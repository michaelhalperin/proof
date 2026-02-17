/**
 * Embed verification data (dateKey, timestamp, hash) in zero-width Unicode
 * so the user only sees the note; pasting into Verify still works.
 */

const ZW_0 = "\u200B"; // zero-width space
const ZW_1 = "\u200C"; // zero-width non-joiner
const DELIMITER = ZW_0 + ZW_1 + ZW_0 + ZW_1 + ZW_0 + ZW_1 + ZW_0 + ZW_1;

function encodePayload(payload: string): string {
  let out = "";
  for (let i = 0; i < payload.length; i++) {
    const code = payload.charCodeAt(i);
    for (let b = 7; b >= 0; b--) {
      out += (code >> b) & 1 ? ZW_1 : ZW_0;
    }
  }
  return out;
}

function decodePayload(encoded: string): string | null {
  const bits = encoded.replace(new RegExp(`[^${ZW_0}${ZW_1}]`, "g"), "");
  if (bits.length % 8 !== 0) return null;
  const bytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | (bits[i + j] === ZW_1 ? 1 : 0);
    }
    bytes.push(byte);
  }
  return String.fromCharCode(...bytes);
}

/**
 * Returns the invisible suffix to append to the note: delimiter + encoded(dateKey|createdAt|hash).
 * The shared string is note + this suffix; the user only sees the note.
 */
export function encodeInvisibleProof(
  dateKey: string,
  createdAt: number,
  hash: string
): string {
  const payload = `${dateKey}|${createdAt}|${hash}`;
  return DELIMITER + encodePayload(payload);
}

/**
 * If the text contains embedded proof data, returns { visibleNote, dateKey, createdAt, hash }.
 * visibleNote is the text without the invisible suffix (trimmed). Otherwise returns null.
 */
export function decodeInvisibleProof(text: string): {
  visibleNote: string;
  dateKey: string;
  createdAt: number;
  hash: string;
} | null {
  const idx = text.indexOf(DELIMITER);
  if (idx === -1) return null;
  const visibleNote = text.slice(0, idx).trim();
  const encoded = text.slice(idx + DELIMITER.length);
  const decoded = decodePayload(encoded);
  if (!decoded) return null;
  const parts = decoded.split("|");
  if (parts.length !== 3) return null;
  const [dateKey, tsStr, hash] = parts;
  const createdAt = parseInt(tsStr, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || Number.isNaN(createdAt) || !/^[a-fA-F0-9]{64}$/.test(hash)) {
    return null;
  }
  return {
    visibleNote,
    dateKey,
    createdAt,
    hash: hash.toLowerCase(),
  };
}
