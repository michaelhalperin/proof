import mongoose, { Schema, Document } from "mongoose";

export interface IRecord extends Document {
  userId: string;
  dateKey: string;
  createdAt: number;
  note: string;
  recordHash: string;
  algo: string;
  tags?: string;
  location?: string;
  pinned?: boolean;
  photos: IPhoto[];
}

export interface IPhoto {
  id: string;
  dateKey: string;
  fileUri: string;
  mimeType: string;
  sha256: string;
  sortIndex: number;
}

const PhotoSchema = new Schema<IPhoto>({
  id: { type: String, required: true },
  dateKey: { type: String, required: true },
  fileUri: { type: String, required: true },
  mimeType: { type: String, required: true },
  sha256: { type: String, required: true },
  sortIndex: { type: Number, required: true },
}, { _id: false });

const RecordSchema = new Schema<IRecord>({
  userId: { type: String, required: true, index: true },
  dateKey: { type: String, required: true, index: true },
  createdAt: { type: Number, required: true, index: true },
  note: { type: String, required: true },
  recordHash: { type: String, required: true },
  algo: { type: String, required: true },
  tags: { type: String },
  location: { type: String },
  pinned: { type: Boolean, default: false },
  photos: [PhotoSchema],
}, {
  timestamps: false,
});

// One record per user per dateKey
RecordSchema.index({ userId: 1, dateKey: 1 }, { unique: true });
RecordSchema.index({ userId: 1, createdAt: -1 });
RecordSchema.index({ userId: 1, pinned: 1, dateKey: -1 });

export const Record = mongoose.model<IRecord>("Record", RecordSchema);
