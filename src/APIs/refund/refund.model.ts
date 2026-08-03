import { Schema, model, Document, Types } from 'mongoose';

export type RefundStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED';

export interface IRefund extends Document {
  _id: Types.ObjectId;
  orderId: Types.ObjectId;
  paymentId: Types.ObjectId;

  revolutRefundId?: string;

  amount: number;
  currency: string;

  reason?: string;

  status: RefundStatus;

  createdAt: Date;
  updatedAt: Date;
}

const refundSchema = new Schema<IRefund>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },

    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
    },

    revolutRefundId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    currency: {
      type: String,
      required: true,
      uppercase: true,
    },

    reason: {
      type: String,
      maxlength: 500,
      trim: true,
    },

    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Refund = model<IRefund>('Refund', refundSchema);