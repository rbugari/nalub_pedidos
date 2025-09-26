const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { testConnection } = require('./config/database');
require('dotenv').config();

const app = express();

// Trust proxy for Railway deployment
app.set('trust proxy', true);

// Security middleware
app.use(helmet());
// CORS configuration for multiple origins
const allowedOrigins = [
    'http://localhost:5173',
    'https://nalub-pedidos.vercel.app',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log(`❌ CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`🔍 REQUEST: ${req.method} ${req.originalUrl}`);
    next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users')); // cambiar de /api/user a /api/users
app.use('/api/prepedidos', require('./routes/prepedidos'));
app.use('/api/ofertas', require('./routes/ofertas'));
app.use('/api/productos', require('./routes/productos'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/pedidos', require('./routes/pedidos'));
app.use('/api/pagos', require('./routes/pagos'));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Test database connection
    console.log('🔍 Testing database connection...');
    const isConnected = await testConnection();
    
    if (isConnected) {
        console.log('✅ Database connection successful!');
    } else {
        console.log('❌ Database connection failed!');
        console.log('⚠️  Please check your database configuration in .env file');
    }
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Process terminated');
        process.exit(0);
    });
});

// Keep the process alive
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    // Don't exit the process, just log the error
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit the process, just log the error
});

module.exports = app;
