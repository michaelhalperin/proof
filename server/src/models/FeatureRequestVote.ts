import mongoose, { Schema, Document } from "mongoose";

export interface IFeatureRequestVote extends Document {
  featureRequestId: mongoose.Types.ObjectId;
  userId: string;
  vote: "yes" | "no";
}

const FeatureRequestVoteSchema = new Schema<IFeatureRequestVote>(
  {
    featureRequestId: {
      type: Schema.Types.ObjectId,
      ref: "FeatureRequest",
      required: true,
      index: true,
    },
    userId: { type: String, required: true, index: true },
    vote: { type: String, enum: ["yes", "no"], required: true },
  },
  { timestamps: false }
);

FeatureRequestVoteSchema.index(
  { featureRequestId: 1, userId: 1 },
  { unique: true }
);

export const FeatureRequestVote = mongoose.model<IFeatureRequestVote>(
  "FeatureRequestVote",
  FeatureRequestVoteSchema
);
