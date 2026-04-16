import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
  externalId: string; // Many feeds use a GUID or URL as ID
  title: string;
  company: string;
  url: string;
  location?: string;
  description?: string;
  category?: string;
  type?: string;
  pubDate: Date;
  sourceUrl: string; // The URL of the feed this came from
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema: Schema = new Schema(
  {
    externalId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    company: { type: String, required: true },
    url: { type: String, required: true, unique: true },
    location: { type: String },
    description: { type: String },
    category: { type: String },
    type: { type: String },
    pubDate: { type: Date, required: true },
    sourceUrl: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

// Compound index to quickly check if a job from a specific source was already updated
JobSchema.index({ externalId: 1, sourceUrl: 1 });

export default mongoose.model<IJob>('Job', JobSchema);
