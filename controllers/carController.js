const Car = require('../models/Car');
const { getIO } = require('../config/socket');

const getAllCars = async (request, response) => {
    try {
        const { type, fuelType, transmission, minPrice, maxPrice, available } = request.query;

        const filter = {};

        if (type) filter.type = type;
        if (fuelType) filter.fuelType = fuelType;
        if (transmission) filter.transmission = transmission;
        if (available === 'true') filter.isAvailable = true;
        if (available === 'false') filter.isAvailable = false;
        if (minPrice || maxPrice) {
            filter.pricePerDay = {};
            if (minPrice) filter.pricePerDay.$gte = Number(minPrice);
            if (maxPrice) filter.pricePerDay.$lte = Number(maxPrice);
        }

        const cars = await Car.find(filter);

        return response.status(200).json({ message: 'cars fetched successfully', cars });

    } catch (error) {
        return response.status(500).json({ message: error.message });
    }
};

const getCarById = async (request, response) => {
    try {
        const car = await Car.findById(request.params.id);

        if (!car) {
            return response.status(404).json({ message: 'car not found' });
        }

        return response.status(200).json({ message: 'car fetched successfully', car });

    } catch (error) {
        return response.status(500).json({ message: error.message });
    }
};

const createCar = async (request, response) => {
    try {
        const { brand, model, year, licensePlate, type, pricePerDay, seats, fuelType, transmission, description, imageUrl } = request.body;

        const existingPlate = await Car.findOne({ licensePlate: licensePlate });
        if (existingPlate) {
            return response.status(400).json({ message: 'a car with this license plate already exists' });
        }

        const newCar = new Car({
            brand, model, year, licensePlate, type, pricePerDay, seats, fuelType, transmission, description, imageUrl
        });

        await newCar.save();

        // Emit real-time event — new car added to fleet
        const io = getIO();
        io.emit('car:fleet-updated', { message: 'New car added to fleet', car: newCar });

        return response.status(201).json({ message: 'car created successfully', car: newCar });

    } catch (error) {
        return response.status(500).json({ message: error.message });
    }
};

const updateCar = async (request, response) => {
    try {
        const car = await Car.findByIdAndUpdate(request.params.id, request.body, { new: true });

        if (!car) {
            return response.status(404).json({ message: 'car not found' });
        }

        // Emit real-time event — car details updated
        const io = getIO();
        io.emit('car:availability', { carId: car._id, isAvailable: car.isAvailable, car });

        return response.status(200).json({ message: 'car updated successfully', car });

    } catch (error) {
        return response.status(500).json({ message: error.message });
    }
};

const deleteCar = async (request, response) => {
    try {
        const car = await Car.findByIdAndDelete(request.params.id);

        if (!car) {
            return response.status(404).json({ message: 'car not found' });
        }

        // Emit real-time event — car removed from fleet
        const io = getIO();
        io.emit('car:fleet-updated', { message: 'Car removed from fleet', carId: request.params.id });

        return response.status(200).json({ message: 'car deleted successfully', deletedCar: car });

    } catch (error) {
        return response.status(500).json({ message: error.message });
    }
};

module.exports = { getAllCars, getCarById, createCar, updateCar, deleteCar };
