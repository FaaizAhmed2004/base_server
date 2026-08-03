import { Application } from 'express'
import { API_ROOT } from '../constant/application'

import General from './router'
import authRoutes from './user/authentication'
import userManagementRoutes from './user/management'
import Order_router from './Order/order.routes'
import refund_router from './refund/refund.routes'
import Payment_router from './Payment/payment.routes'
import webhook_router from './Webhook/webhook.routes'

const App = (app: Application) => {
    app.use(`${API_ROOT}`, General)
    app.use(`${API_ROOT}`, authRoutes)
    app.use(`${API_ROOT}`, userManagementRoutes)
    app.use(`${API_ROOT}/order`, Order_router)
    app.use(`${API_ROOT}/refund`, refund_router)
    app.use(`${API_ROOT}/payment`, Payment_router)
    app.use(`${API_ROOT}/webhook`, webhook_router)

}

export default App
