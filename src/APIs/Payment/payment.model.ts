import { Schema, model, Document, Types } from 'mongoose';

export type PaymentStatus =
  | 'PENDING'
  | 'AUTHORIZED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface IPayment extends Document {
  _id: Types.ObjectId;
  orderId: Types.ObjectId;
  revolutPaymentId?: string;

  amount: number;
  currency: string;

  status: PaymentStatus;

  failureReason?: string;

  completedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },

    revolutPaymentId: {
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

    status: {
      type: String,
      enum: [
        'PENDING',
        'AUTHORIZED',
        'COMPLETED',
        'FAILED',
        'CANCELLED',
      ],
      default: 'PENDING',
      index: true,
    },

    failureReason: {
      type: String,
      maxlength: 500,
    },

    completedAt: Date,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Payment = model<IPayment>('Payment', paymentSchema);