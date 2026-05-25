import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProvider extends Document {
  providerId: number;
  name: string;
  leadsCount: number;
  lastAssignedAt: Date | null;
}

const ProviderSchema: Schema = new Schema(
  {
    providerId: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    leadsCount: { type: Number, required: true, default: 0, min: 0, max: 10 },
    lastAssignedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const Provider: Model<IProvider> =
  mongoose.models.Provider || mongoose.model<IProvider>('Provider', ProviderSchema);

export default Provider;
