import mongoose, { Schema, Document } from 'mongoose';

export interface IImportLog extends Document {
  fileName: string; // As per requirements, this is the feed URL
  timestamp: Date;
  totalFetched: number;
  totalImported: number;
  newJobs: number;
  updatedJobs: number;
  failedJobs: number;
  errorDetails: string[];
  status: 'pending' | 'completed' | 'failed';
}

const ImportLogSchema: Schema = new Schema(
  {
    fileName: { type: String, required: true, index: true },
    timestamp: { type: Date, default: Date.now },
    totalFetched: { type: Number, default: 0 },
    totalImported: { type: Number, default: 0 },
    newJobs: { type: Number, default: 0 },
    updatedJobs: { type: Number, default: 0 },
    failedJobs: { type: Number, default: 0 },
    errorDetails: [{ type: String }],
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  },
  { timestamps: true, collection: 'import_logs' }
);

export default mongoose.model<IImportLog>('ImportLog', ImportLogSchema);
