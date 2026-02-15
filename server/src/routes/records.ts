import express, { Request, Response } from "express";
import { Record } from "../models/Record";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = express.Router();

/** All record routes require authentication */
router.use(requireAuth);

function userId(req: AuthRequest): string {
  return req.user!.id;
}

// Get all records (for authenticated user)
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const records = await Record.find({ userId: userId(req) }).sort({ dateKey: -1 });

    const recordsData = records.map((record) => ({
      dateKey: record.dateKey,
      createdAt: record.createdAt,
      note: record.note,
      recordHash: record.recordHash,
      algo: record.algo,
      tags: record.tags,
      location: record.location,
      pinned: record.pinned || false,
    }));

    res.json({ records: recordsData });
  } catch (error) {
    console.error("Error getting all records:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all pinned records (must be before /:dateKey)
router.get("/pinned/all", async (req: AuthRequest, res: Response) => {
  try {
    const records = await Record.find({ userId: userId(req), pinned: true }).sort({
      dateKey: -1,
    });

    const recordsData = records.map((record) => ({
      dateKey: record.dateKey,
      createdAt: record.createdAt,
      note: record.note,
      recordHash: record.recordHash,
      algo: record.algo,
      tags: record.tags,
      location: record.location,
      pinned: record.pinned || false,
    }));

    res.json({ records: recordsData });
  } catch (error) {
    console.error("Error getting pinned records:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get a single record by dateKey
router.get("/:dateKey", async (req: AuthRequest, res: Response) => {
  try {
    const { dateKey } = req.params;
    const record = await Record.findOne({ userId: userId(req), dateKey });

    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    const recordData = {
      dateKey: record.dateKey,
      createdAt: record.createdAt,
      note: record.note,
      recordHash: record.recordHash,
      algo: record.algo,
      tags: record.tags,
      location: record.location,
      pinned: record.pinned || false,
    };

    const photos = record.photos || [];
    res.json({ record: recordData, photos });
  } catch (error) {
    console.error("Error getting record:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Check if record exists
router.get("/:dateKey/exists", async (req: AuthRequest, res: Response) => {
  try {
    const { dateKey } = req.params;
    const record = await Record.findOne({ userId: userId(req), dateKey });
    res.json({ exists: !!record });
  } catch (error) {
    console.error("Error checking record existence:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create a new record
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { record, photos } = req.body;
    const uid = userId(req);

    const existing = await Record.findOne({ userId: uid, dateKey: record.dateKey });
    if (existing) {
      return res.status(409).json({ error: "Record already exists" });
    }

    const newRecord = new Record({
      userId: uid,
      dateKey: record.dateKey,
      createdAt: record.createdAt,
      note: record.note,
      recordHash: record.recordHash,
      algo: record.algo,
      tags: record.tags,
      location: record.location,
      pinned: record.pinned || false,
      photos: photos || [],
    });

    await newRecord.save();
    res.status(201).json({ message: "Record created successfully" });
  } catch (error: any) {
    console.error("Error creating record:", error);
    if (error.code === 11000) {
      return res.status(409).json({ error: "Record already exists" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update a record
router.put("/:dateKey", async (req: AuthRequest, res: Response) => {
  try {
    const { dateKey } = req.params;
    const { record, photos } = req.body;
    const uid = userId(req);

    const existing = await Record.findOne({ userId: uid, dateKey });
    if (!existing) {
      return res.status(404).json({ error: "Record not found" });
    }

    const pinned = record.pinned !== undefined ? record.pinned : existing.pinned || false;

    await Record.updateOne(
      { userId: uid, dateKey },
      {
        $set: {
          createdAt: record.createdAt,
          note: record.note,
          recordHash: record.recordHash,
          algo: record.algo,
          tags: record.tags,
          location: record.location,
          pinned,
          photos: photos || [],
        },
      }
    );

    res.json({ message: "Record updated successfully" });
  } catch (error) {
    console.error("Error updating record:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a record
router.delete("/:dateKey", async (req: AuthRequest, res: Response) => {
  try {
    const { dateKey } = req.params;
    const uid = userId(req);
    const record = await Record.findOne({ userId: uid, dateKey });

    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    const photoUris = (record.photos || []).map((p: any) => p.fileUri);
    await Record.deleteOne({ userId: uid, dateKey });
    res.json({ message: "Record deleted successfully", photoUris });
  } catch (error) {
    console.error("Error deleting record:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete all records (for authenticated user)
router.delete("/", async (req: AuthRequest, res: Response) => {
  try {
    const uid = userId(req);
    const records = await Record.find({ userId: uid });
    const photoUris: string[] = [];

    records.forEach((record) => {
      (record.photos || []).forEach((p: any) => {
        photoUris.push(p.fileUri);
      });
    });

    await Record.deleteMany({ userId: uid });
    res.json({ message: "All records deleted", photoUris });
  } catch (error) {
    console.error("Error deleting all records:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Toggle pinned status
router.patch("/:dateKey/toggle-pinned", async (req: AuthRequest, res: Response) => {
  try {
    const { dateKey } = req.params;
    const uid = userId(req);
    const record = await Record.findOne({ userId: uid, dateKey });

    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    const newPinnedStatus = !(record.pinned || false);
    await Record.updateOne(
      { userId: uid, dateKey },
      { $set: { pinned: newPinnedStatus } }
    );

    res.json({ pinned: newPinnedStatus });
  } catch (error) {
    console.error("Error toggling pinned status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
