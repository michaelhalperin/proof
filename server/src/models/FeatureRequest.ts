import mongoose, { Schema, Document } from "mongoose";

export interface IFeatureRequest extends Document {
  title: string;
  body?: string;
  userId: string;
  createdAt: Date;
}

const FeatureRequestSchema = new Schema<IFeatureRequest>(
  {
    title: { type: String, required: true },
    body: { type: String },
    userId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

FeatureRequestSchema.index({ createdAt: -1 });

export const FeatureRequest = mongoose.model<IFeatureRequest>(
  "FeatureRequest",
  FeatureRequestSchema
);
