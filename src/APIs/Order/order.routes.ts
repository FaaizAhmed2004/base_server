import { Router } from 'express';

import asyncHandler from '../../handlers/async';
import { validate } from '../../middlewares/validate';
import { createOrder, getOrder } from './order.controller';
import { createOrderSchema } from './order.validator';

const Order_router = Router();

Order_router.post(
  '/',
  validate(createOrderSchema),
  asyncHandler(createOrder)
);

Order_router.get('/:id', asyncHandler(getOrder));

export default Order_router;