import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Order } from '../Order/order.model';
import { Payment } from './payment.model';
import { revolutService } from '../../services/revoult.service';

interface PaymentParams {
  orderId: string;
}

interface PaymentResponseData {
  paymentId: mongoose.Types.ObjectId;
  revolutOrderId: string;
  checkoutUrl?: string;
  status: string;
}

export const createPayment = async (
  req: Request<PaymentParams>,
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

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Order cannot be paid in ${order.status} status`,
      });
    }

    const revolutOrder = await revolutService.createOrder({
      amount: order.amount,
      currency: order.currency,
      description: order.description,
    });

    const payment = await Payment.create({
      orderId: order._id,
      revolutPaymentId: revolutOrder.id,
      amount: order.amount,
      currency: order.currency,
      status: 'PENDING',
    });

    order.revolutOrderId = revolutOrder.id;
    order.checkoutUrl = revolutOrder.checkout_url;
    order.status = 'PROCESSING';

    await order.save();

    const responseData: PaymentResponseData = {
      paymentId: payment._id,
      revolutOrderId: revolutOrder.id,
      checkoutUrl: revolutOrder.checkout_url,
      status: payment.status,
    };

    return res.status(201).json({
      success: true,
      message: 'Payment initiated successfully',
      data: responseData,
    });
  } catch (error) {
    next(error);
    return undefined;
  }
};

/**
 * GET LOCAL PAYMENT
 * GET /api/payments/:paymentId
 */
export const getPayment = async (
  req: Request<{ paymentId: string }>,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { paymentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment ID',
      });
    }

    const payment = await Payment.findById(paymentId).populate('orderId');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
    return undefined;
  }
};

/**
 * GET PAYMENT STATUS FROM REVOLUT
 * GET /api/payments/:paymentId/status
 */
export const getPaymentStatus = async (
  req: Request<{ paymentId: string }>,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { paymentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment ID',
      });
    }

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    if (!payment.revolutPaymentId) {
      return res.status(400).json({
        success: false,
        message: 'Revolut payment ID not found',
      });
    }

    const revolutOrder = await revolutService.getOrder(payment.revolutPaymentId);

    let localStatus = payment.status;

    switch (revolutOrder.state) {
      case 'completed':
        localStatus = 'COMPLETED';
        break;

      case 'failed':
      case 'declined':
        localStatus = 'FAILED';
        break;

      case 'cancelled':
        localStatus = 'CANCELLED';
        break;

      case 'pending':
      case 'processing':
        localStatus = 'PENDING';
        break;
    }

    payment.status = localStatus;

    if (localStatus === 'COMPLETED') {
      payment.completedAt = new Date();
    }

    if (localStatus === 'FAILED' && revolutOrder.failure_reason) {
      payment.failureReason = revolutOrder.failure_reason;
    }

    await payment.save();

    return res.status(200).json({
      success: true,
      message: 'Payment status retrieved successfully',
      data: {
        paymentId: payment._id,
        revolutPaymentId: payment.revolutPaymentId,
        status: payment.status,
        revolutState: revolutOrder.state,
        amount: payment.amount,
        currency: payment.currency,
        completedAt: payment.completedAt,
      },
    });
  } catch (error) {
    next(error);
    return undefined;
  }
};