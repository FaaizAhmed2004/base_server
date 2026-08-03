import { Router } from 'express';
import asyncHandler from '../../handlers/async';
import { createRefund, getRefund, getRefundsByOrder } from './refund.controller';

const refund_router = Router();

refund_router.post('/orders/:orderId/refund', asyncHandler(createRefund));

refund_router.get('/refunds/:refundId', asyncHandler(getRefund));

refund_router.get('/orders/:orderId/refunds', asyncHandler(getRefundsByOrder));

export default refund_router;