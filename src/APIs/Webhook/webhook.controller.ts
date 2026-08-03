import { NextFunction, Request, Response } from 'express';

import logger from '../../handlers/logger';
import { Order } from '../Order/order.model';
import { Payment } from '../Payment/payment.model';
import { Refund } from '../refund/refund.model';
import { WebhookEvent } from '../Webhook/webhookevent';

interface RevolutWebhookPayload {
  id?: string;
  event?: string;
  order_id?: string;
  refund_id?: string;
  failure_reason?: string;
}

export const handleRevolutWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const event = req.body as RevolutWebhookPayload;

    const eventId = event.id;
    const eventType = event.event;
    const orderId = event.order_id;

    if (!eventId || !eventType) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook payload',
      });
    }

    const existingEvent = await WebhookEvent.findOne({
      eventId,
    });

    if (existingEvent) {
      return res.status(200).json({
        success: true,
        message: 'Webhook already processed',
      });
    }

    await WebhookEvent.create({
      eventId,
      eventType,
      orderId,
      processed: false,
    });

    switch (eventType) {
      case 'ORDER_COMPLETED': {
        const order = await Order.findOne({
          revolutOrderId: orderId,
        });

        if (order) {
          order.status = 'COMPLETED';
          await order.save();

          await Payment.findOneAndUpdate(
            {
              orderId: order._id,
            },
            {
              status: 'COMPLETED',
              completedAt: new Date(),
            }
          );
        }

        break;
      }

      case 'ORDER_FAILED': {
        const order = await Order.findOne({
          revolutOrderId: orderId,
        });

        if (order) {
          order.status = 'FAILED';
          await order.save();

          await Payment.findOneAndUpdate(
            {
              orderId: order._id,
            },
            {
              status: 'FAILED',
              failureReason: event.failure_reason || 'Payment failed',
            }
          );
        }

        break;
      }

      case 'REFUND_COMPLETED': {
        const refundId = event.refund_id;

        await Refund.findOneAndUpdate(
          {
            revolutRefundId: refundId,
          },
          {
            status: 'COMPLETED',
          }
        );

        break;
      }

      case 'REFUND_FAILED': {
        const refundId = event.refund_id;

        await Refund.findOneAndUpdate(
          {
            revolutRefundId: refundId,
          },
          {
            status: 'FAILED',
          }
        );

        break;
      }

      default:
        logger.warn('Unhandled Revolut event', { eventType });
    }

    await WebhookEvent.updateOne(
      { eventId },
      {
        processed: true,
        processedAt: new Date(),
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error) {
    next(error);
    return undefined;
  }
};