import express, { Response } from "express";
import mongoose from "mongoose";
import { FeatureRequest } from "../models/FeatureRequest";
import { FeatureRequestVote } from "../models/FeatureRequestVote";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = express.Router();

function userId(req: AuthRequest): string {
  return req.user!.id;
}

// List all feature requests with yes/no counts and current user's vote
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const uid = userId(req);
    const requests = await FeatureRequest.find()
      .sort({ createdAt: -1 })
      .lean();

    const ids = requests.map((r) => r._id);
    const votes = await FeatureRequestVote.find({
      featureRequestId: { $in: ids },
    }).lean();

    const voteMap = new Map<string, { yes: number; no: number; userVote: "yes" | "no" | null }>();
    ids.forEach((id) => voteMap.set(id.toString(), { yes: 0, no: 0, userVote: null }));

    votes.forEach((v) => {
      const key = v.featureRequestId.toString();
      const entry = voteMap.get(key)!;
      if (v.vote === "yes") entry.yes += 1;
      else entry.no += 1;
      if (v.userId === uid) entry.userVote = v.vote;
    });

    const list = requests.map((r) => {
      const { yes, no, userVote } = voteMap.get(r._id.toString())!;
      return {
        id: r._id.toString(),
        title: r.title,
        body: r.body || "",
        createdAt: r.createdAt,
        yesCount: yes,
        noCount: no,
        userVote,
      };
    });

    res.json({ requests: list });
  } catch (error) {
    console.error("Error listing feature requests:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create a feature request (auth required)
router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { title, body } = req.body;
    const trimmedTitle = typeof title === "string" ? title.trim() : "";
    if (!trimmedTitle) {
      return res.status(400).json({ error: "Title is required" });
    }

    const doc = await FeatureRequest.create({
      title: trimmedTitle,
      body: typeof body === "string" ? body.trim() : undefined,
      userId: userId(req),
    });

    res.status(201).json({
      id: doc._id.toString(),
      title: doc.title,
      body: doc.body || "",
      createdAt: doc.createdAt,
      yesCount: 0,
      noCount: 0,
      userVote: null,
    });
  } catch (error) {
    console.error("Error creating feature request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Set or update current user's vote (yes or no)
router.post("/:id/vote", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { vote } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid request id" });
    }
    if (vote !== "yes" && vote !== "no") {
      return res.status(400).json({ error: "vote must be 'yes' or 'no'" });
    }

    const request = await FeatureRequest.findById(id);
    if (!request) {
      return res.status(404).json({ error: "Feature request not found" });
    }

    const uid = userId(req);
    const existing = await FeatureRequestVote.findOne({
      featureRequestId: id,
      userId: uid,
    });

    if (existing && existing.vote === vote) {
      await FeatureRequestVote.deleteOne({
        featureRequestId: id,
        userId: uid,
      });
    } else {
      await FeatureRequestVote.findOneAndUpdate(
        { featureRequestId: id, userId: uid },
        { vote },
        { upsert: true, new: true }
      );
    }

    const yesCount = await FeatureRequestVote.countDocuments({
      featureRequestId: id,
      vote: "yes",
    });
    const noCount = await FeatureRequestVote.countDocuments({
      featureRequestId: id,
      vote: "no",
    });

    res.json({
      id,
      yesCount,
      noCount,
      userVote: existing && existing.vote === vote ? null : vote,
    });
  } catch (error) {
    console.error("Error voting:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
