const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
    brand: {
        type: String,
        required: true,
    },
    model: {
        type: String,
        required: true,
    },
    year: {
        type: Number,
        required: true,
    },
    licensePlate: {
        type: String,
        required: true,
        unique: true,
    },
    type: {
        type: String,
        enum: ['sedan', 'suv', 'hatchback', 'truck', 'van', 'coupe'],
        required: true,
    },
    pricePerDay: {
        type: Number,
        required: true,
    },
    isAvailable: {
        type: Boolean,
        default: true,
    },
    seats: {
        type: Number,
        required: true,
    },
    fuelType: {
        type: String,
        enum: ['petrol', 'diesel', 'electric', 'hybrid'],
        required: true,
    },
    transmission: {
        type: String,
        enum: ['manual', 'automatic'],
        required: true,
    },
    description: {
        type: String,
    },
    imageUrl: {
        type: String,
    },
}, { timestamps: true });

const Car = mongoose.model('Car', carSchema);

module.exports = Car;
