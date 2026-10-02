const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ── helper: sign User JWT ─────────────────────
const signToken = (user) => {
    return jwt.sign(
        { userId: user._id, username: user.username, email: user.email, role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};

// ── POST /api/auth/register ───────────────────
const register = async (request, response) => {
    try {
        const { name, username, email, password } = request.body;

        const existingUsername = await User.findOne({ username: username });
        if (existingUsername) {
            return response.status(400).json({ message: 'username already exists' });
        }

        const existingEmail = await User.findOne({ email: email });
        if (existingEmail) {
            return response.status(400).json({ message: 'email already exists' });
        }

        const hashPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            username,
            email,
            password: hashPassword,
            role: 'user',
        });

        await newUser.save();

        return response.status(201).json({ message: 'user registered successfully' });

    } catch (error) {
        return response.status(500).json({ message: error.message });
    }
};

// ── POST /api/auth/login ──────────────────────
const login = async (request, response) => {
    try {
        const { username, password } = request.body;

        const user = await User.findOne({ username: username });
        if (!user) {
            return response.status(400).json({ message: 'username does not exist' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return response.status(400).json({ message: 'password is incorrect' });
        }

        const token = signToken(user);

        return response.status(200).json({
            message: 'login successful',
            token,
            role: 'user',
            user: {
                _id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: 'user'
            }
        });

    } catch (error) {
        return response.status(500).json({ message: error.message });
    }
};

// ── GET /api/auth/profile ─────────────────────
const getProfile = async (request, response) => {
    try {
        const user = await User.findById(request.user.userId).select('-password');
        if (!user) {
            return response.status(404).json({ message: 'user not found' });
        }

        return response.status(200).json({ message: 'user profile', user });

    } catch (error) {
        return response.status(500).json({ message: error.message });
    }
};

module.exports = { register, login, getProfile };
