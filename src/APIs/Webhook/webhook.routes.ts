import { Router } from 'express';
import asyncHandler from '../../handlers/async';
import { handleRevolutWebhook } from '../Webhook/webhook.controller';

const webhook_router = Router();

webhook_router.post('/revolut', asyncHandler(handleRevolutWebhook));

export default webhook_router;