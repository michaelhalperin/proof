import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { computeRecordHash, computeRecordHashLegacy } from "./hashing";
import type { PhotoHash } from "./hashing";
import { decodeInvisibleProof } from "./invisibleProof";

dayjs.extend(utc);

const BASE64URL =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

// Characters that some messaging apps insert but that should be ignored
// when matching the visible "✓ Prooffy · ..." line (NOT removed before invisible decode).
const ZERO_WIDTH_AND_CONTROL =
  /[\u200B-\u200F\u202A-\u202E\u2060\u2061\u2062\u2063\uFEFF]/g;

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
  /** Extra note variants to try when the primary note does not verify (e.g. PDF layout). */
  noteCandidates?: string[];
}

/**
 * Parse shared note text (from Share Note) into proof fields.
 * Supports: (1) invisible embedded proof (note only visible), (2) minimal "note\n\ndateKey timestamp hash", (3) legacy with Prooffy/DateKey:/Timestamp:/Hash:
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

  // Normalize lines for visible formats:
  // - keep original order
  // - remove zero-width/control chars that some apps sprinkle into the text
  //   (especially inside the compact token), so regex still matches
  // - strip common quote/bullet prefixes (">", "•", "-" etc.)
  // - trim trailing whitespace
  const lines = trimmed.split(/\n/).map((rawLine) => {
    const noZw = rawLine.replace(ZERO_WIDTH_AND_CONTROL, "");
    return noZw
      .replace(/^[>\u2022\u2023\u25E6\u2043\u2219\-\s"]+/, "")
      .replace(/\s+$/, "");
  });

  // Compact format: last line "✓ Prooffy · YYYY-MM-DD · <base64url token>"
  const compactMatch =
    lines.length > 0 &&
    lines[lines.length - 1].match(
      /^✓\s*Prooffy\s*·\s*(\d{4}-\d{2}-\d{2})\s*·\s*([A-Za-z0-9_-]+)\s*$/
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

  // Friendly format: last line "✓ Prooffy · YYYY-MM-DD · timestamp · hash-with-dashes"
  const friendlyMatch =
    lines.length > 0 &&
    lines[lines.length - 1].match(
      /^✓\s*Prooffy\s*·\s*(\d{4}-\d{2}-\d{2})\s*·\s*(\d{10,15})\s*·\s*([a-fA-F0-9\-]+)\s*$/
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

  // Legacy format: must contain "Prooffy" and "Hash:"
  if (!trimmed.includes("Prooffy") || !trimmed.includes("Hash:")) {
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
    !firstBlock.includes("Prooffy Record");
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
 * Parse text extracted from a Prooffy PDF (from Share as PDF or Share Photos PDF).
 * Looks for Date, Created, Integrity Hash, Timestamp, and optional Note.
 */
export function parseProofPdfText(text: string): ParsedProof | null {
  const raw = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!raw.includes("Prooffy") || !raw.includes("Integrity")) return null;

  // Hash may be split across lines (e.g. "5127d\n8f6"); allow optional whitespace
  const hashMatch = raw.match(/(?:Integrity\s+Hash|SHA-256)[^\w]*([a-fA-F0-9\s]{64,})/);
  const hashRaw = hashMatch ? hashMatch[1].replace(/\s/g, "").toLowerCase() : "";
  const hash = hashRaw.length === 64 && /^[a-f0-9]{64}$/.test(hashRaw) ? hashRaw : null;
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
  const noteCandidates: string[] = [];
  // PDF export often has note as first content before the "Prooffy — DateKey ..." line (no "Note:" label)
  if (!note) {
    const proofStart = raw.search(/\bProof\s*[—·\-]\s*.*DateKey|Prooffy\s+.*Integrity\s+Hash/i);
    if (proofStart > 0) {
      const beforeProof = raw.slice(0, proofStart).trim();
      const lines = beforeProof.split(/\n/).map((l) => l.trim()).filter(Boolean);
      const isPageMarker = (l: string) => /^[—\-]+\s*\d+\s+of\s+\d+\s+[—\-]+$/.test(l);
      // First line that isn't a page marker (e.g. "-- 1 of 3 --" or "— 1 of 3 —")
      const firstLine = lines.find((l) => !isPageMarker(l));
      if (firstLine) {
        note = firstLine.replace(/\s+/g, " ").replace(/\uFEFF/g, "").trim();
        // Try first line only; also try all non-marker lines joined (multi-line note)
        noteCandidates.push(note);
        const restLines = lines.filter((l) => !isPageMarker(l));
        if (restLines.length > 1) {
          noteCandidates.push(
            restLines
              .join("\n")
              .replace(/\s+/g, " ")
              .replace(/\uFEFF/g, "")
              .trim()
          );
        }
        noteCandidates.push(note + "\n");
      } else {
        note = beforeProof.replace(/\s+/g, " ").replace(/\uFEFF/g, "").trim();
        if (note) noteCandidates.push(note);
      }
    }
  }
  // Try to extract photo hashes if present (e.g. from a "Photo hashes" section)
  const photos: PhotoHash[] = [];
  const lines = raw.split("\n").map((l) => l.trim());
  const photosHeaderIndex = lines.findIndex((l) =>
    /^Photo hashes/i.test(l)
  );
  if (photosHeaderIndex >= 0) {
    for (let i = photosHeaderIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      if (/^Prooffy\b/i.test(line)) break;
      // Expected format (one per line): "<id> <mimeType> <sha256> <sortIndex>"
      const parts = line.split(/\s+/);
      if (parts.length < 4) continue;
      const [id, mimeType, sha256, sortIndexStr] = parts;
      const sortIndex = parseInt(sortIndexStr, 10);
      if (!id || !sha256 || Number.isNaN(sortIndex)) continue;
      photos.push({
        id,
        mimeType: mimeType || "image/jpeg",
        sha256,
        sortIndex,
      });
    }
  }

  return {
    dateKey,
    createdAt,
    note,
    hash,
    photos,
    ...(noteCandidates.length > 0 ? { noteCandidates } : {}),
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
