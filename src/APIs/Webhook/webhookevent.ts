import { Schema, model, Document } from 'mongoose';

export interface IWebhookEvent extends Document {
  _id: string;
  eventId: string;
  eventType: string;
  orderId?: string;
  processed: boolean;
  receivedAt: Date;
  processedAt?: Date;
}

const webhookEventSchema = new Schema<IWebhookEvent>(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    eventType: {
      type: String,
      required: true,
      index: true,
    },

    orderId: {
      type: String,
      index: true,
    },

    processed: {
      type: Boolean,
      default: false,
    },

    receivedAt: {
      type: Date,
      default: Date.now,
    },

    processedAt: Date,
  },
  {
    versionKey: false,
  }
);

export const WebhookEvent = model<IWebhookEvent>(
  'WebhookEvent',
  webhookEventSchema
);