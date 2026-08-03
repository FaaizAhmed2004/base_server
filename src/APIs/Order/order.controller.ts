import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Order } from './order.model';

interface CreateOrderBody {
  amount: number;
  currency: string;
  description?: string;
}

export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const body = req.body as CreateOrderBody;
    const { amount, currency, description } = body;

    const order = await Order.create({
      amount,
      currency,
      description,
      status: 'PENDING',
    });

    return res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
    return undefined;
  }
};

export const getOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID',
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    return res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
    return undefined;
  }
};