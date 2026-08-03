Ecommence Backend API

A production-ready payment backend built with Node.js, Express, TypeScript, MongoDB, and Revolut Merchant API.

The backend provides APIs for creating orders, initiating payments, checking payment status, and processing Revolut webhooks.

Tech Stack
Node.js
Express.js
TypeScript
MongoDB
Mongoose
Revolut Merchant API
Docker
Helmet
CORS
Cookie Parser
Express Rate Limit
HPP
Winston / Application Logging
Project Structure
src/
├── APIs/
│   └── index.ts
│
├── Order/
│   ├── order.model.ts
│   ├── order.controller.ts
│   └── order.routes.ts
│
├── Payment/
│   ├── payment.model.ts
│   ├── payment.controller.ts
│   ├── payment.routes.ts
│   └── payment.service.ts
│
├── middlewares/
│   ├── errorHandler.ts
│   └── ...
│__ Services/
|   |__Revoult.service.ts
|    
├── handlers/
│   └── notFound.ts
│
├── app.ts
└── server.ts
│
├── public/
│
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
└── .env
Requirements

Before running the project, make sure the following are installed:

Node.js 18+
npm 9+
MongoDB
Docker (optional)
Revolut Merchant API credentials
Installation

Clone the project and install dependencies:

npm install
Environment Variables

Create a .env file in the project root.

PORT=3000

NODE_ENV=development

MONGODB_URI=mongodb://localhost:27017/payment_backend

REVOLUT_API_URL=https://sandbox-merchant.revolut.com/api

REVOLUT_API_KEY=your_revolut_api_key

REVOLUT_WEBHOOK_SECRET=your_webhook_secret

FRONTEND_URL=https://xyz.com
Production Example
PORT=3000

NODE_ENV=production

MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/payment_backend

REVOLUT_API_URL=https://merchant.revolut.com/api

REVOLUT_API_KEY=your_production_api_key

REVOLUT_WEBHOOK_SECRET=your_webhook_secret

FRONTEND_URL=https://xyz.com

Never commit .env files or API credentials to GitHub.

Available Scripts
Development

Run the development server:

npm run start:dev

The server will start using the development configuration.

Example:

Server running on http://localhost:3000
Build

Create a production build:

npm run build

The compiled JavaScript files will be generated in the configured build directory.

Production

After building the project:

npm start
API Base URL

Development:

http://localhost:3000/v1

Production:

https://your-domain.com/v1
API Endpoints
Order APIs
Create Order
POST /v1/orders

Example request:

{
  "customer": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "items": [
    {
      "name": "Premium Package",
      "quantity": 1,
      "price": 100
    }
  ],
  "currency": "GBP"
}

Example response:

{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": "66b123456789abcdef123456",
    "status": "pending",
    "amount": 100,
    "currency": "GBP"
  }
}
Payment APIs
Create Payment
POST /v1/payments

Example request:

{
  "orderId": "66b123456789abcdef123456"
}

Example response:

{
  "success": true,
  "message": "Payment created successfully",
  "data": {
    "paymentId": "66c123456789abcdef123456",
    "orderId": "66b123456789abcdef123456",
    "status": "pending",
    "amount": 100,
    "currency": "GBP"
  }
}
Get Payment Status
GET /v1/payments/:paymentId

Example:

GET /v1/payments/66c123456789abcdef123456

Example response:

{
  "success": true,
  "data": {
    "paymentId": "66c123456789abcdef123456",
    "status": "completed",
    "amount": 100,
    "currency": "GBP"
  }
}
Revolut Webhook

The backend exposes a webhook endpoint for receiving payment events from Revolut.

POST /v1/payments/webhook

The webhook is responsible for updating the local payment and order status based on the payment event received from Revolut.

Webhook Flow
Revolut
   |
   | Payment Event
   ↓
POST /v1/payments/webhook
   |
   ↓
Verify Webhook
   |
   ↓
Validate Event
   |
   ↓
Find Payment
   |
   ↓
Check Idempotency
   |
   ↓
Update Payment
   |
   ↓
Update Order
Webhook Sample Data

Example webhook payload:

{
  "event": "ORDER_COMPLETED",
  "order_id": "66b123456789abcdef123456",
  "state": "COMPLETED",
  "amount": 10000,
  "currency": "GBP"
}

Another example:

{
  "event": "ORDER_FAILED",
  "order_id": "66b123456789abcdef123456",
  "state": "FAILED",
  "amount": 10000,
  "currency": "GBP"
}
Payment Statuses

The payment system supports statuses such as:

pending
processing
completed
failed
cancelled

Typical payment lifecycle:

PENDING
   ↓
PROCESSING
   ↓
COMPLETED

Failure flow:

PENDING
   ↓
PROCESSING
   ↓
FAILED
Sample MongoDB Data
Order
{
  "_id": "66b123456789abcdef123456",
  "customer": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "items": [
    {
      "name": "Premium Package",
      "quantity": 1,
      "price": 100
    }
  ],
  "amount": 100,
  "currency": "GBP",
  "status": "paid",
  "createdAt": "2026-08-03T10:00:00.000Z"
}
Payment
{
  "_id": "66c123456789abcdef123456",
  "orderId": "66b123456789abcdef123456",
  "provider": "revolut",
  "providerPaymentId": "rev_123456789",
  "amount": 100,
  "currency": "GBP",
  "status": "completed",
  "webhookProcessed": true,
  "createdAt": "2026-08-03T10:01:00.000Z"
}
Security

The API includes several security measures.

Helmet

HTTP security headers are enabled using Helmet.

app.use(helmet())
CORS

Only the configured frontend origin is allowed to access the API.

cors({
  origin: ['https://xyz.com'],
  credentials: true
})
Rate Limiting

API requests are rate-limited to reduce abuse and brute-force attempts.

Window: 15 minutes
Maximum requests: 200
Request Body Limit

Large request payloads are restricted:

100 KB
HTTP Parameter Pollution Protection

HPP protection is enabled to prevent HTTP parameter pollution attacks.

Secure Environment Variables

Sensitive credentials such as:

Revolut API Key
Webhook Secret
MongoDB credentials

are stored in environment variables.

PCI DSS Considerations

The backend is designed to minimize PCI DSS scope.

The application should never store raw card data, including:

Card Number
CVV
Expiry Date
PIN
Full Magnetic Stripe Data

Payment processing is delegated to the payment provider.

The database stores payment references and transaction information rather than raw cardholder data.

Example:

{
  "provider": "revolut",
  "providerPaymentId": "rev_123456789",
  "amount": 100,
  "currency": "GBP",
  "status": "completed"
}
Idempotency

Webhook requests can potentially be delivered more than once.

The backend therefore checks whether an event/payment has already been processed before applying the payment update.

Example:

Webhook #1
    ↓
Process Payment
    ↓
webhookProcessed = true

Webhook #2
    ↓
Already processed
    ↓
Return 200

This prevents duplicate:

Order updates
Payment updates
Business actions
Error Handling

The application uses centralized error handling.

Example error response:

{
  "success": false,
  "message": "Payment not found"
}

Validation errors:

{
  "success": false,
  "message": "Invalid order ID"
}
HTTP Status Codes

Common status codes used by the API:

Status	Meaning
200	Success
201	Resource Created
400	Bad Request
401	Unauthorized
403	Forbidden
404	Resource Not Found
409	Conflict
429	Too Many Requests
500	Internal Server Error
Docker
Build Docker Image
docker build -t payment-backend .
Run Docker Container
docker run -d \
  --name payment-backend \
  -p 3000:3000 \
  --env-file .env \
  payment-backend

Check running containers:

docker ps

View logs:

docker logs payment-backend

Stop container:

docker stop payment-backend

Remove container:

docker rm payment-backend
Docker Compose

If docker-compose.yml is provided:

docker compose up -d --build

Stop services:

docker compose down

View logs:

docker compose logs -f
Testing with Postman

Import the API into Postman and configure:

Base URL:
http://localhost:3000/v1

Example:

POST {{baseUrl}}/orders
POST {{baseUrl}}/payments
GET  {{baseUrl}}/payments/:paymentId
POST {{baseUrl}}/payments/webhook
Complete Payment Flow
                  ┌─────────────────┐
                  │     Frontend    │
                  └────────┬────────┘
                           │
                           │ Create Order
                           ↓
                  ┌─────────────────┐
                  │   Express API   │
                  └────────┬────────┘
                           │
                           ↓
                  ┌─────────────────┐
                  │     MongoDB     │
                  └─────────────────┘
                           │
                           │ Create Payment
                           ↓
                  ┌─────────────────┐
                  │ Revolut Merchant│
                  │       API       │
                  └────────┬────────┘
                           │
                           │ Payment Event
                           ↓
                  ┌─────────────────┐
                  │ Revolut Webhook │
                  └────────┬────────┘
                           │
                           ↓
                  ┌─────────────────┐
                  │ Verify Webhook  │
                  │ + Idempotency   │
                  └────────┬────────┘
                           │
                           ↓
                  ┌─────────────────┐
                  │ Update Payment  │
                  │   & Order       │
                  └─────────────────┘
Local Development

Start MongoDB and configure .env.

Then run:

npm install
npm run start:dev

API:

http://localhost:3000

Build:

npm run build

Production:

npm start
Docker Development
docker compose up -d --build

Check logs:

docker compose logs -f
Important Notes
Do not commit .env files.
Never expose Revolut API keys to the frontend.
Never store raw card numbers or CVV.
Webhook requests must be validated before updating payment status.
Webhook processing should be idempotent.
Use HTTPS in production.
Use the Revolut sandbox environment for testing.
Use production Revolut credentials only in the production environment.
Example .gitignore
node_modules/
dist/
.env
.env.*
!.env.example
logs/
coverage/
Health Check

A health-check endpoint can be used to verify that the server is running:

GET /health

Example response:

{
  "success": true,
  "message": "Server is healthy"
}