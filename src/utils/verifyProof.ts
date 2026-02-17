import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { computeRecordHash, computeRecordHashLegacy } from "./hashing";
import type { PhotoHash } from "./hashing";
import { decodeInvisibleProof } from "./invisibleProof";

dayjs.extend(utc);

const BASE64URL =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function decodeCompactProofToken(token: string): { createdAt: number; hash: string } | null {
  const clean = token.replace(/\s/g, "");
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
  const buf = new Uint8Array(bytes);
  if (buf.length < 43) return null;
  const b = buf.subarray(0, 43);
  const hi = (b[3] << 24) | (b[4] << 16) | (b[5] << 8) | b[6];
  const lo = (b[7] << 24) | (b[8] << 16) | (b[9] << 8) | b[10];
  const createdAt = hi * 0x100000000 + lo;
  const hash = Array.from(b.subarray(11, 43))
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
  return { createdAt, hash };
}

export interface ParsedProof {
  dateKey: string;
  createdAt: number;
  note: string;
  hash: string;
  photos: PhotoHash[];
}

/**
 * Parse shared note text (from Share Note) into proof fields.
 * Supports: (1) invisible embedded proof (note only visible), (2) minimal "note\n\ndateKey timestamp hash", (3) legacy with Proof/DateKey:/Timestamp:/Hash:
 */
export function parseSharedNoteText(text: string): ParsedProof | null {
  const trimmed = text.trim();

  // Invisible format: verification data in zero-width chars after the note
  const invisible = decodeInvisibleProof(trimmed);
  if (invisible) {
    return {
      dateKey: invisible.dateKey,
      createdAt: invisible.createdAt,
      note: invisible.visibleNote,
      hash: invisible.hash,
      photos: [],
    };
  }

  const lines = trimmed.split(/\n/);

  // Compact format: last line "✓ Proof · YYYY-MM-DD · <base64url token>"
  const compactMatch =
    lines.length > 0 &&
    lines[lines.length - 1].match(
      /^✓\s*Proof\s*·\s*(\d{4}-\d{2}-\d{2})\s*·\s*([A-Za-z0-9_-]+)\s*$/
    );
  if (compactMatch) {
    const decoded = decodeCompactProofToken(compactMatch[2]);
    if (decoded) {
      const noteRaw = lines.slice(0, -1).join("\n").trim();
      return {
        dateKey: compactMatch[1],
        createdAt: decoded.createdAt,
        note: noteRaw,
        hash: decoded.hash,
        photos: [],
      };
    }
  }

  // Friendly format: last line "✓ Proof · YYYY-MM-DD · timestamp · hash-with-dashes"
  const friendlyMatch =
    lines.length > 0 &&
    lines[lines.length - 1].match(
      /^✓\s*Proof\s*·\s*(\d{4}-\d{2}-\d{2})\s*·\s*(\d{10,15})\s*·\s*([a-fA-F0-9\-]+)\s*$/
    );
  if (friendlyMatch) {
    const dateKey = friendlyMatch[1];
    const createdAt = parseInt(friendlyMatch[2], 10);
    const hashRaw = friendlyMatch[3].replace(/-/g, "").toLowerCase();
    if (Number.isNaN(createdAt) || hashRaw.length !== 64 || !/^[a-f0-9]{64}$/.test(hashRaw))
      return null;
    const noteRaw = lines.slice(0, -1).join("\n").trim();
    return {
      dateKey,
      createdAt,
      note: noteRaw,
      hash: hashRaw,
      photos: [],
    };
  }

  // Minimal format: last line is "YYYY-MM-DD <timestamp> <64-char hex>"
  const minimalLineMatch =
    lines.length > 0 &&
    lines[lines.length - 1].match(/^(\d{4}-\d{2}-\d{2})\s+(\d{10,15})\s+([a-fA-F0-9]{64})$/);
  if (minimalLineMatch) {
    const dateKey = minimalLineMatch[1];
    const createdAt = parseInt(minimalLineMatch[2], 10);
    const hash = minimalLineMatch[3].toLowerCase();
    if (Number.isNaN(createdAt)) return null;
    const noteRaw = lines.slice(0, -1).join("\n").trim();
    return {
      dateKey,
      createdAt,
      note: noteRaw,
      hash,
      photos: [],
    };
  }

  // Legacy format: must contain "Proof" and "Hash:"
  if (!trimmed.includes("Proof") || !trimmed.includes("Hash:")) {
    return null;
  }

  const hashMatch = trimmed.match(/\bHash:\s*([a-fA-F0-9]{64})\s*$/m);
  const hash = hashMatch ? hashMatch[1].trim() : null;
  if (!hash) return null;

  const tsMatch = trimmed.match(/Timestamp:\s*(\d+)/);
  if (!tsMatch) return null;
  const createdAt = parseInt(tsMatch[1], 10);
  if (Number.isNaN(createdAt)) return null;

  const dateKeyMatch = trimmed.match(/DateKey:\s*(\d{4}-\d{2}-\d{2})/);
  const dateKey = dateKeyMatch
    ? dateKeyMatch[1]
    : dayjs(createdAt).format("YYYY-MM-DD");

  const hashIndex = trimmed.indexOf("Hash:");
  const beforeHash = trimmed.slice(0, hashIndex).trim();
  const parts = beforeHash.split(/\n\n/);
  const firstBlock = (parts[0] || "").trim();
  const isNoteFirst =
    firstBlock.length > 0 &&
    !firstBlock.includes("DateKey:") &&
    !firstBlock.includes("Proof Record");
  const noteRaw = isNoteFirst ? firstBlock : parts.length >= 3 ? parts[2] : "";
  const note = noteRaw.trim();

  return {
    dateKey,
    createdAt,
    note: noteRaw || note,
    hash,
    photos: [],
  };
}

/**
 * Note variants to try when the trimmed note doesn't match.
 * Old app versions computed the hash with untrimmed note (e.g. trailing newline).
 */
function getNoteVariants(note: string): string[] {
  const t = note.trim();
  const variants: string[] = [t];
  if (t !== note) variants.push(note);
  const lineEndings = ["\n", "\r", "\r\n", "\n\r", "\n\n"];
  for (const le of lineEndings) {
    if (!variants.includes(t + le)) variants.push(t + le);
    if (!variants.includes(le + t)) variants.push(le + t);
  }
  if (!variants.includes(t + " ")) variants.push(t + " ");
  if (!variants.includes(" " + t)) variants.push(" " + t);
  const withNbsp = t.replace(/\u00A0/g, " ").replace(/ /g, "\u00A0");
  if (withNbsp !== t && !variants.includes(withNbsp)) variants.push(withNbsp);
  return [...new Set(variants)];
}

/**
 * Verify proof: recompute hash and compare.
 * Tries multiple dateKey and note variants so old shares (pre-trim fix) still verify.
 */
export async function verifyProof(
  dateKey: string,
  createdAt: number,
  note: string,
  photos: PhotoHash[],
  claimedHash: string
): Promise<{ valid: boolean; computedHash: string }> {
  const claimed = claimedHash.trim().toLowerCase();
  const dateKeyCandidates: string[] = [dateKey];
  const dateKeyLocal = dayjs(createdAt).format("YYYY-MM-DD");
  const dateKeyUtc = dayjs.utc(createdAt).format("YYYY-MM-DD");
  if (!dateKeyCandidates.includes(dateKeyLocal)) dateKeyCandidates.push(dateKeyLocal);
  if (!dateKeyCandidates.includes(dateKeyUtc)) dateKeyCandidates.push(dateKeyUtc);
  const noteCandidates = getNoteVariants(note);
  const createdAtCandidates: number[] = [createdAt];
  if (createdAt > 1e12) createdAtCandidates.push(Math.floor(createdAt / 1000));
  if (createdAt < 1e12) createdAtCandidates.push(createdAt * 1000);

  const hashFns = [computeRecordHash, computeRecordHashLegacy];
  for (const ts of createdAtCandidates) {
    const dkFromTs = dayjs(ts).format("YYYY-MM-DD");
    const dateKeysForTs = [dkFromTs, ...dateKeyCandidates.filter((dk) => dk !== dkFromTs)];
    for (const dk of dateKeysForTs) {
      for (const noteVariant of noteCandidates) {
        for (const hashFn of hashFns) {
          const computedHash = await hashFn(
            dk,
            ts,
            noteVariant,
            photos
          );
          if (computedHash.toLowerCase() === claimed) {
            return { valid: true, computedHash };
          }
        }
      }
    }
  }
  const computedHash = await computeRecordHash(
    dateKey,
    createdAt,
    note.trim(),
    photos
  );
  return { valid: false, computedHash };
}

/**
 * Parse text extracted from a Proof PDF (from Share as PDF or Share Photos PDF).
 * Looks for Date, Created, Integrity Hash, Timestamp, and optional Note.
 */
export function parseProofPdfText(text: string): ParsedProof | null {
  const raw = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!raw.includes("Proof") || !raw.includes("Integrity")) return null;

  const hashMatch = raw.match(/(?:Integrity\s+Hash|SHA-256)[^\w]*([a-fA-F0-9]{64})/);
  const hash = hashMatch ? hashMatch[1].trim() : null;
  if (!hash) return null;

  const tsMatch = raw.match(/Timestamp[^\d]*(\d{10,15})/);
  if (!tsMatch) return null;
  const createdAt = parseInt(tsMatch[1], 10);
  if (Number.isNaN(createdAt)) return null;

  const dateKey = dayjs(createdAt).format("YYYY-MM-DD");

  let note = "";
  const noteSection = raw.match(/(?:Note|note)\s*([\s\S]*?)(?=Integrity|Photos|Hash|$)/i);
  if (noteSection && noteSection[1]) {
    note = noteSection[1].replace(/\s+/g, " ").trim();
  }

  return {
    dateKey,
    createdAt,
    note,
    hash,
    photos: [],
  };
}

/**
 * Parse photo hashes from manual entry (one SHA-256 hex per line, 64 chars).
 */
export function parsePhotoHashesInput(input: string): PhotoHash[] {
  const lines = input
    .trim()
    .split(/\n/)
    .map((s) => s.trim().replace(/\s/g, ""));
  const photoHashes: PhotoHash[] = [];
  lines.forEach((line, index) => {
    if (/^[a-fA-F0-9]{64}$/.test(line)) {
      photoHashes.push({
        id: `photo-${index}`,
        mimeType: "image/jpeg",
        sha256: line.toLowerCase(),
        sortIndex: index,
      });
    }
  });
  return photoHashes;
}
