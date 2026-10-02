const Rental = require('../models/Rental');
const Car = require('../models/Car');
const { getIO } = require('../config/socket');

const createRental = async (request, response) => {
    try {
        const { carId, startDate, endDate, pickupLocation, dropoffLocation } = request.body;

        // Check if car exists
        const car = await Car.findById(carId);
        if (!car) {
            return response.status(404).json({ message: 'car not found' });
        }

        // Check if car is available
        if (!car.isAvailable) {
            return response.status(400).json({ message: 'car is not available for the selected dates' });
        }

        // Calculate total days and cost
        const start = new Date(startDate);
        const end = new Date(endDate);
        const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

        if (totalDays <= 0) {
            return response.status(400).json({ message: 'endDate must be after startDate' });
        }

        const totalCost = totalDays * car.pricePerDay;

        const newRental = new Rental({
            userId: request.user.userId,
            carId,
            startDate: start,
            endDate: end,
            totalDays,
            totalCost,
            pickupLocation,
            dropoffLocation,
            status: 'pending',
        });

        await newRental.save();

        // Mark car as unavailable
        await Car.findByIdAndUpdate(carId, { isAvailable: false });

        // Emit real-time availability update via Socket.io
        const io = getIO();
        io.emit('car:availability', { carId: carId, isAvailable: false });
        io.emit('booking:created', {
            message: 'New booking created',
            rentalId: newRental._id,
            carId: carId,
            userId: request.user.userId,
        });

        return response.status(201).json({
            message: 'rental booked successfully',
            rental: newRental,
            totalDays,
            totalCost,
        });

    } catch (error) {
        return response.status(500).json({ message: error.message });
    }
};

const getAllRentals = async (request, response) => {
    try {
        let rentals;

        // Admin sees all rentals, user sees only their own
        if (request.user.role === 'admin') {
            rentals = await Rental.find().populate('userId', 'name email username').populate('carId', 'brand model licensePlate');
        } else {
            rentals = await Rental.find({ userId: request.user.userId }).populate('carId', 'brand model licensePlate pricePerDay');
        }

        return response.status(200).json({ message: 'rentals fetched successfully', rentals });

    } catch (error) {
        return response.status(500).json({ message: error.message });
    }
};

const getRentalById = async (request, response) => {
    try {
        const rental = await Rental.findById(request.params.id)
            .populate('userId', 'name email username')
            .populate('carId', 'brand model licensePlate pricePerDay');

        if (!rental) {
            return response.status(404).json({ message: 'rental not found' });
        }

        // Users can only view their own rentals
        if (request.user.role !== 'admin' && rental.userId._id.toString() !== request.user.userId) {
            return response.status(403).json({ message: 'access denied' });
        }

        return response.status(200).json({ message: 'rental fetched successfully', rental });

    } catch (error) {
        return response.status(500).json({ message: error.message });
    }
};

const updateRentalStatus = async (request, response) => {
    try {
        const { status } = request.body;

        if (!status) {
            return response.status(400).json({ message: 'status is required' });
        }

        const allowedStatuses = ['pending', 'confirmed', 'active', 'completed', 'cancelled'];
        if (!allowedStatuses.includes(status)) {
            return response.status(400).json({ message: 'invalid status value' });
        }

        const rental = await Rental.findByIdAndUpdate(
            request.params.id,
            { status },
            { new: true }
        );

        if (!rental) {
            return response.status(404).json({ message: 'rental not found' });
        }

        // If completed or cancelled → make car available again
        if (status === 'completed' || status === 'cancelled') {
            await Car.findByIdAndUpdate(rental.carId, { isAvailable: true });

            // Emit real-time car available again
            const io = getIO();
            io.emit('car:availability', { carId: rental.carId, isAvailable: true });
        }

        // Emit booking status updated
        const io = getIO();
        io.emit('booking:statusUpdated', { rentalId: rental._id, status: status });

        return response.status(200).json({ message: 'rental status updated successfully', rental });

    } catch (error) {
        return response.status(500).json({ message: error.message });
    }
};

module.exports = { createRental, getAllRentals, getRentalById, updateRentalStatus };
