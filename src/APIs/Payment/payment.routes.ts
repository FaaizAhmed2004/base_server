import { Router } from 'express';
import asyncHandler from '../../handlers/async';
import { createPayment, getPayment } from './payment.controller';

const Payment_router = Router();

Payment_router.post(
  '/orders/:orderId/payment',
  asyncHandler(createPayment)
);

Payment_router.get(
  '/orders/:orderId/payment',
  asyncHandler(getPayment)
);

export default Payment_router;