import express, { Request, Response } from "express";
import multer from "multer";
import { PDFParse } from "pdf-parse";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

router.post(
  "/pdf",
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file || !req.file.buffer) {
        res.status(400).json({ error: "No PDF file uploaded" });
        return;
      }

      const buffer = req.file.buffer as Buffer;
      const fileName = req.file.originalname || "unknown";
      console.log("[verify/pdf] Received file:", fileName, "size:", buffer.length);

      let text: string;
      let parser: PDFParse | null = null;
      try {
        parser = new PDFParse({ data: new Uint8Array(buffer) });
        const result = await parser.getText();
        text = (result?.text && typeof result.text === "string" ? result.text : String(result?.text ?? "")).trim();
      } catch (parseErr) {
        console.error("[verify/pdf] pdf-parse error:", parseErr);
        const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
        res.status(500).json({
          error: "Failed to extract text from PDF",
          detail: process.env.NODE_ENV !== "production" ? msg : undefined,
        });
        return;
      } finally {
        if (parser) {
          try {
            await parser.destroy();
          } catch {
            // ignore
          }
        }
      }

      console.log("[verify/pdf] Extracted text length:", text.length, "preview:", text.slice(0, 300));

      if (!text) {
        res.status(400).json({
          error:
            "No text in PDF. If this is a screenshot or image-only PDF, use the Enter details tab and type the Hash and Date from the PDF.",
        });
        return;
      }

      res.json({ text });
    } catch (error) {
      console.error("[verify/pdf] Error:", error);
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({
        error: "Failed to extract text from PDF",
        detail: process.env.NODE_ENV !== "production" ? msg : undefined,
      });
    }
  },
);

export default router;

