const Admin = require('../models/Admin');
const Car = require('../models/Car');
const Rental = require('../models/Rental');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ── helper: sign Admin JWT ────────────────────
const signAdminToken = (admin) => {
    return jwt.sign(
        {
            userId: admin._id,
            adminId: admin._id,
            username: admin.username,
            email: admin.email,
            role: 'admin',
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};

// ── POST /api/admin/register ──────────────────
// Admin sign up to create an admin profile
const createAdmin = async (request, response) => {
    try {
        const { name, username, email, password } = request.body;

        if (!name || !username || !email || !password) {
            return response.status(400).json({ message: 'All fields (name, username, email, password) are required' });
        }

        const existingUsername = await Admin.findOne({ username });
        if (existingUsername) {
            return response.status(400).json({ message: 'Admin username already exists' });
        }

        const existingEmail = await Admin.findOne({ email });
        if (existingEmail) {
            return response.status(400).json({ message: 'Admin email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = new Admin({
            name,
            username,
            email,
            password: hashedPassword,
            role: 'admin',
        });

        await newAdmin.save();

        return response.status(201).json({
            message: 'Admin account created successfully! Please log in.',
            admin: {
                _id: newAdmin._id,
                name: newAdmin.name,
                username: newAdmin.username,
                email: newAdmin.email,
                role: 'admin',
            },
        });

    } catch (error) {
        return response.status(500).json({ message: error.message });
    }
};

// ── POST /api/admin/login ─────────────────────
// Admin login to authenticate and get JWT
const loginAdmin = async (request, response) => {
    try {
        const { username, password } = request.body;

        if (!username || !password) {
            return response.status(400).json({ message: 'Username and password are required' });
        }

        const admin = await Admin.findOne({ username });
        if (!admin) {
            return response.status(401).json({ message: 'Invalid admin credentials' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return response.status(401).json({ message: 'Invalid admin credentials' });
        }

        const token = signAdminToken(admin);

        return response.status(200).json({
            message: 'Admin login successful',
            token,
            role: 'admin',
            admin: {
                _id: admin._id,
                name: admin.name,
                username: admin.username,
                email: admin.email,
                role: 'admin',
            },
        });

    } catch (error) {
        return response.status(500).json({ message: error.message });
    }
};

// ── GET /api/admin/cars ───────────────────────
// Required by PS: Admin retrieves all cars in the fleet
const getAllCarsAdmin = async (request, response) => {
    try {
        const cars = await Car.find();

        return response.status(200).json({
            message: 'all cars fetched successfully',
            totalCars: cars.length,
            cars,
        });

    } catch (error) {
        return response.status(500).json({ message: error.message });
    }
};

// ── GET /api/admin/rentals ────────────────────
// Required by PS: Admin retrieves all rentals across platform
const getAllRentalsAdmin = async (request, response) => {
    try {
        const rentals = await Rental.find()
            .populate('userId', 'name email username')
            .populate('carId', 'brand model licensePlate pricePerDay');

        return response.status(200).json({
            message: 'all rentals fetched successfully',
            totalRentals: rentals.length,
            rentals,
        });

    } catch (error) {
        return response.status(500).json({ message: error.message });
    }
};

module.exports = {
    createAdmin,
    loginAdmin,
    getAllCarsAdmin,
    getAllRentalsAdmin,
};
