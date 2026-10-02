const mongoose = require('mongoose');

const db = mongoose.connection;

db.on('connected', () => {
    console.log('MongoDB connected successfully');
});

db.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

db.on('error', (error) => {
    console.log('MongoDB connection error:', error.message);
});

// Connect — catch and log instead of crashing the server
mongoose.connect(process.env.MONGO_URI)
    .catch((err) => {
        console.log('');
        console.log('Could not connect to MongoDB!');
        console.log('   Error:', err.message);
        console.log('');
        console.log('👉  Fix: Open your .env file and set a valid MONGO_URI');
        console.log('   Example: MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/rentwheels');
        console.log('');
    });

module.exports = db;
