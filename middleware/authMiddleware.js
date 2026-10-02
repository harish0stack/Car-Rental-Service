const jwt = require('jsonwebtoken');

const authMiddleware = (request, response, next) => {
    try {
        const token = request.headers.token;

        if (!token) {
            return response.status(401).json({ message: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return response.status(401).json({ message: 'Token is invalid.' });
        }

        request.user = decoded;

        next();

    } catch (error) {
        return response.status(401).json({ message: 'Token is invalid or expired.' });
    }
};

module.exports = authMiddleware;
