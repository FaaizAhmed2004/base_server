import express, { Application } from 'express'
import path from 'path'
import router from './APIs'
import errorHandler from './middlewares/errorHandler'
import notFound from './handlers/notFound'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import hpp from 'hpp'

const app: Application = express()

// Trust proxy if running behind Nginx / Docker / Load Balancer
app.set('trust proxy', 1)

// Security Headers
app.use(
    helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
    })
)

// Prevent HTTP Parameter Pollution
app.use(hpp())

// Cookies
app.use(cookieParser())

// CORS
app.use(
    cors({
        methods: ['GET', 'POST', 'DELETE', 'OPTIONS', 'HEAD', 'PUT', 'PATCH'],
        origin: ['https://xyz.com'],
        credentials: true,
    })
)

// Request Body Limits
app.use(
    express.json({
        limit: '100kb',
    })
)

app.use(
    express.urlencoded({
        extended: true,
        limit: '100kb',
    })
)

// Static files
app.use(express.static(path.join(__dirname, '../', 'public')))

// Global Rate Limit
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests, please try again later.',
    },
})

app.use('/v1', apiLimiter)

// Router
router(app)

// 404 handler
app.use(notFound)

// Error handler
app.use(errorHandler)

export default app