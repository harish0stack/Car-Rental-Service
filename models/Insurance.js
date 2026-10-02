const mongoose = require('mongoose');

const insuranceSchema = new mongoose.Schema({
    carId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Car',
        required: true,
    },
    provider: {
        type: String,
        required: true,
    },
    policyNumber: {
        type: String,
        required: true,
        unique: true,
    },
    coverageType: {
        type: String,
        enum: ['basic', 'standard', 'comprehensive'],
        required: true,
    },
    coverageAmount: {
        type: Number,
        required: true,
    },
    premium: {
        type: Number,
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    expiryDate: {
        type: Date,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

const Insurance = mongoose.model('Insurance', insuranceSchema);

module.exports = Insurance;
