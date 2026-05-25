import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProcessedPayment extends Document {
  paymentId: string;
  providerId: number;
  processedAt: Date;
}

const ProcessedPaymentSchema: Schema = new Schema(
  {
    paymentId: { type: String, required: true, unique: true },
    providerId: { type: Number, required: true },
    processedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const ProcessedPayment: Model<IProcessedPayment> =
  mongoose.models.ProcessedPayment ||
  mongoose.model<IProcessedPayment>('ProcessedPayment', ProcessedPaymentSchema);

export default ProcessedPayment;
