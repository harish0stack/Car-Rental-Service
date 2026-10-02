const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const db = require('./config/db');
const { initSocket } = require('./config/socket');

const authRoutes = require('./routes/authRoutes');
const carRoutes = require('./routes/carRoutes');
const rentalRoutes = require('./routes/rentalRoutes');
const insuranceRoutes = require('./routes/insuranceRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Middleware
app.use(cors());
app.use(express.json());

// API Documentation (Swagger UI)
const swaggerUiOptions = {
    swaggerOptions: {
        tryItOutEnabled: true,
        persistAuthorization: true,
    },
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerUiOptions));

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (request, response) => {
    response.status(200).json({ message: 'RentWheels API is running' });
});

// Serve frontend for any other route
app.get('*', (request, response) => {
    response.sendFile(path.join(__dirname, 'public', 'index.html'));
});


server.listen(5001, () => {
    console.log('server is running at - http://localhost:5001');
    console.log(`Docs: http://localhost:5001/api-docs`);
});