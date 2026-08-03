import { Schema, model, Document, Types } from 'mongoose';

export type OrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface IOrder extends Document {
  _id: Types.ObjectId;
  amount: number;
  currency: string;
  description?: string;

  revolutOrderId?: string;
  checkoutUrl?: string;

  status: OrderStatus;

  customerId?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      enum: ['GBP', 'EUR', 'USD'],
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    revolutOrderId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    checkoutUrl: {
      type: String,
    },

    status: {
      type: String,
      enum: [
        'PENDING',
        'PROCESSING',
        'COMPLETED',
        'FAILED',
        'CANCELLED',
        'REFUNDED',
      ],
      default: 'PENDING',
      index: true,
    },

    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Order = model<IOrder>('Order', orderSchema);