import * as Print from "expo-print";
import * as FileSystem from "expo-file-system/legacy";
import { Record, Photo } from "../db/database";

export async function generatePDF(
  record: Record,
  photos: Photo[],
  photoUris: string[]
): Promise<string> {
  let imagesHtml = "";
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const base64 = await FileSystem.readAsStringAsync(photo.fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const mimeType = photo.mimeType || "image/jpeg";
    imagesHtml += `
      <div style="margin: 20px 0; text-align: center;">
        <img src="data:${mimeType};base64,${base64}" style="max-width: 100%; height: auto; page-break-inside: avoid;" />
      </div>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            color: #333;
          }
          .note {
            white-space: pre-wrap;
            font-size: 18px;
            line-height: 1.5;
            margin-bottom: 24px;
          }
          .photos {
            margin-top: 16px;
            font-size: 11px;
            color: #777;
          }
          .photos-title {
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-weight: 600;
            margin-bottom: 4px;
          }
          .photos-list {
            font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
            font-size: 10px;
            white-space: pre-wrap;
            word-break: break-all;
          }
          .footer {
            margin-top: 32px;
            padding-top: 12px;
            border-top: 1px solid #eee;
            font-size: 10px;
            color: #999;
            text-align: center;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        ${
          record.note
            ? `<div class="note">${escapeHtml(record.note)}</div>`
            : ""
        }

        ${
          photos.length > 0
            ? `<div style="margin: 20px 0;">${imagesHtml}</div>`
            : ""
        }

        ${
          photos.length > 0
            ? `<div class="photos">
                 <div class="photos-title">Photo hashes</div>
                 <pre class="photos-list">
${photos
  .map(
    (p) =>
      `${escapeHtml(p.id)} ${escapeHtml(
        p.mimeType || "image/jpeg"
      )} ${escapeHtml(p.sha256)} ${p.sortIndex}`
  )
  .join("\n")}
                 </pre>
               </div>`
            : ""
        }

        <div class="footer">
          Proof — DateKey ${record.dateKey} · Timestamp ${record.createdAt} · Integrity Hash ${record.recordHash}
        </div>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  return uri;
}

export async function sharePDF(
  pdfUri: string,
  dateKey: string
): Promise<string> {
  const fileName = `proof-${dateKey}.pdf`;
  const newUri = FileSystem.documentDirectory + fileName;

  // Copy to a more accessible location with proper name
  await FileSystem.copyAsync({
    from: pdfUri,
    to: newUri,
  });

  return newUri;
}

/**
 * Generate a minimal PDF containing only the given images (no record metadata).
 * Used when sharing photos without a record context.
 */
export async function generateImagesOnlyPDF(
  photoUris: string[]
): Promise<string> {
  const imagesHtml = await buildImagesHtml(photoUris);
  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: system-ui; max-width: 800px; margin: 20px auto; padding: 20px;">
        ${imagesHtml}
      </body>
    </html>
  `;
  const { uri } = await Print.printToFileAsync({ html });
  return uri;
}

/**
 * Generate a proof PDF: record metadata (date, created, integrity hash) + images.
 * Makes the shared file verifiable as a Proof record.
 */
export async function generateProofPhotosPDF(
  photoUris: string[],
  record: Record
): Promise<string> {
  const imagesHtml = await buildImagesHtml(photoUris);
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #333; }
          .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #eee; font-size: 10px; color: #999; text-align: center; word-break: break-all; }
        </style>
      </head>
      <body>
        <div style="margin: 20px 0;">${imagesHtml}</div>
        <div class="footer">
          Proof — DateKey ${record.dateKey} · Timestamp ${record.createdAt} · Integrity Hash ${record.recordHash}
        </div>
      </body>
    </html>
  `;
  const { uri } = await Print.printToFileAsync({ html });
  return uri;
}

async function buildImagesHtml(photoUris: string[]): Promise<string> {
  let html = "";
  for (let i = 0; i < photoUris.length; i++) {
    const uri = photoUris[i].replace("file://", "");
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    html += `
      <div style="margin: 20px 0; text-align: center;">
        <img src="data:image/jpeg;base64,${base64}" style="max-width: 100%; height: auto; page-break-inside: avoid;" />
      </div>
    `;
  }
  return html;
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
