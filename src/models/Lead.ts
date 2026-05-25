import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILead extends Document {
  name: string;
  phoneNumber: string;
  city: string;
  service: string;
  description: string;
  assignedProviders: mongoose.Types.ObjectId[];
}

const LeadSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    city: { type: String, required: true },
    service: { type: String, required: true, enum: ['Service 1', 'Service 2', 'Service 3'] },
    description: { type: String, required: true },
    assignedProviders: [{ type: Schema.Types.ObjectId, ref: 'Provider' }],
  },
  { timestamps: true }
);

// Compound unique index to enforce that a phone number cannot create another lead for the SAME service.
LeadSchema.index({ phoneNumber: 1, service: 1 }, { unique: true });

const Lead: Model<ILead> =
  mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);

export default Lead;
