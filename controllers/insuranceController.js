const Insurance = require('../models/Insurance');
const Car = require('../models/Car');

const createInsurance = async (request, response) => {
    try {
        const { carId, provider, policyNumber, coverageType, coverageAmount, premium, startDate, expiryDate } = request.body;

        // Check if car exists
        const car = await Car.findById(carId);
        if (!car) {
            return response.status(404).json({ message: 'car not found' });
        }

        // Check if policy number already exists
        const existingPolicy = await Insurance.findOne({ policyNumber: policyNumber });
        if (existingPolicy) {
            return response.status(400).json({ message: 'insurance policy number already exists' });
        }

        const newInsurance = new Insurance({
            carId, provider, policyNumber, coverageType, coverageAmount, premium, startDate, expiryDate
        });

        await newInsurance.save();

        return response.status(201).json({ message: 'insurance created successfully', insurance: newInsurance });

    } catch (error) {
        return response.status(500).json({ message: error.message });
    }
};

const getAllInsurance = async (request, response) => {
    try {
        const insurances = await Insurance.find().populate('carId', 'brand model licensePlate');

        return response.status(200).json({ message: 'insurance records fetched successfully', insurances });

    } catch (error) {
        return response.status(500).json({ message: error.message });
    }
};

const getInsuranceById = async (request, response) => {
    try {
        const insurance = await Insurance.findById(request.params.id).populate('carId', 'brand model licensePlate');

        if (!insurance) {
            return response.status(404).json({ message: 'insurance not found' });
        }

        return response.status(200).json({ message: 'insurance fetched successfully', insurance });

    } catch (error) {
        return response.status(500).json({ message: error.message });
    }
};

module.exports = { createInsurance, getAllInsurance, getInsuranceById };
