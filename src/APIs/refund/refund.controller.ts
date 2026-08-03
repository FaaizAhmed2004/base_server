import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';

import { Order } from '../Order/order.model';
import { Payment } from '../Payment/payment.model';
import { Refund } from '../refund/refund.model';
import { revolutService } from '../../services/revoult.service';

interface RefundBody {
  amount: number;
  reason?: string;
}

export const createRefund = async (
  req: Request<{ orderId: string }, unknown, RefundBody>,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { orderId } = req.params;
    const { amount, reason } = req.body;

    // ----------------------------------
    // 1. Validate MongoDB Order ID
    // ----------------------------------

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID',
      });
    }

    // ----------------------------------
    // 2. Validate amount
    // ----------------------------------

    if (
      amount === undefined ||
      !Number.isInteger(amount) ||
      amount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount must be a positive integer in minor currency units',
      });
    }

    // ----------------------------------
    // 3. Find local order
    // ----------------------------------

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // ----------------------------------
    // 4. Check Revolut Order ID
    // ----------------------------------

    if (!order.revolutOrderId) {
      return res.status(400).json({
        success: false,
        message: 'This order does not have a Revolut order ID',
      });
    }

    // ----------------------------------
    // 5. Order must be completed
    // ----------------------------------

    if (order.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Only completed orders can be refunded',
      });
    }

    // ----------------------------------
    // 6. Find completed payment
    // ----------------------------------

    const payment = await Payment.findOne({
      orderId: order._id,
      status: 'COMPLETED',
    });

    if (!payment) {
      return res.status(400).json({
        success: false,
        message: 'No completed payment found for this order',
      });
    }

    // ----------------------------------
    // 7. Currency consistency
    // ----------------------------------

    if (payment.currency !== order.currency) {
      return res.status(400).json({
        success: false,
        message: 'Payment and order currency mismatch',
      });
    }

    // ----------------------------------
    // 8. Calculate already refunded amount
    // ----------------------------------

    const refundedResult = await Refund.aggregate<{ _id: null; total: number }>([
      {
        $match: {
          orderId: order._id,
          status: {
            $in: ['PENDING', 'COMPLETED'],
          },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: '$amount',
          },
        },
      },
    ]);

    const alreadyRefunded =
      refundedResult.length > 0
        ? refundedResult[0].total
        : 0;

    // ----------------------------------
    // 9. Prevent over-refunding
    // ----------------------------------

    const remainingAmount =
      payment.amount - alreadyRefunded;

    if (amount > remainingAmount) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount exceeds refundable amount',
        data: {
          paymentAmount: payment.amount,
          alreadyRefunded,
          remainingRefundable: remainingAmount,
          requestedRefund: amount,
        },
      });
    }

    // ----------------------------------
    // 10. Idempotency key
    // ----------------------------------

    const idempotencyHeader =
      req.headers['idempotency-key'];

    const idempotencyKey = Array.isArray(
      idempotencyHeader
    )
      ? idempotencyHeader[0]
      : idempotencyHeader;

    if (!idempotencyKey) {
      return res.status(400).json({
        success: false,
        message: 'Idempotency-Key header is required',
      });
    }

    // ----------------------------------
    // 11. Prevent duplicate local request
    // ----------------------------------

    const existingRefund = await Refund.findOne({
      idempotencyKey,
    });

    if (existingRefund) {
      return res.status(200).json({
        success: true,
        message: 'Refund request already exists',
        data: existingRefund,
      });
    }

    // ----------------------------------
    // 12. Create local refund record
    // ----------------------------------

    const refund = await Refund.create({
      orderId: order._id,
      paymentId: payment._id,

      amount,

      currency: payment.currency,

      reason: reason?.trim(),

      status: 'PENDING',

      idempotencyKey,
    });

    // ----------------------------------
    // 13. Call Revolut API
    // ----------------------------------

    let revolutRefund;

    try {
      revolutRefund =
        await revolutService.refundOrder(
          order.revolutOrderId,
          {
            amount,
            description:
              reason?.trim() || `Refund for order ${String(order._id)}`,
          }
        );
    } catch (error) {
      // Revolut failed, update local refund
      refund.status = 'FAILED';

      await refund.save();

      throw error;
    }

    // ----------------------------------
    // 14. Save Revolut refund order ID
    // ----------------------------------

    refund.revolutRefundId =
      revolutRefund.id;

    // Revolut refund is initially usually
    // processing asynchronously.
    refund.status =
      revolutRefund.state === 'completed'
        ? 'COMPLETED'
        : 'PENDING';

    await refund.save();

    // ----------------------------------
    // 15. Return response
    // ----------------------------------

    return res.status(201).json({
      success: true,
      message: 'Refund initiated successfully',

      data: {
        refundId: refund._id,

        revolutRefundId:
          revolutRefund.id,

        relatedOrderId:
          revolutRefund.related_order_id,

        amount: refund.amount,

        currency: refund.currency,

        status: refund.status,

        revolutState:
          revolutRefund.state,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getRefund = async (
  req: Request<{ refundId: string }>,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { refundId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(refundId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid refund ID',
      });
    }

    const refund = await Refund.findById(refundId)
      .populate('orderId')
      .populate('paymentId');

    if (!refund) {
      return res.status(404).json({
        success: false,
        message: 'Refund not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: refund,
    });
  } catch (error) {
    next(error);
  }
};

export const getRefundsByOrder = async (
  req: Request<{ orderId: string }>,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID',
      });
    }

    const refunds = await Refund.find({ orderId })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: refunds.length,
      data: refunds,
    });
  } catch (error) {
    next(error);
  }
};