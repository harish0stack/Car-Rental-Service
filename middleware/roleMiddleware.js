const isAdmin = (request, response, next) => {
    try {
        if (!request.user) {
            return response.status(401).json({ message: 'Unauthorized. Please login first.' });
        }

        if (request.user.role !== 'admin') {
            return response.status(403).json({ message: 'Access denied. Admins only.' });
        }

        next();

    } catch (error) {
        return response.status(500).json({ message: error.message });
    }
};

const isUser = (request, response, next) => {
    try {
        if (!request.user) {
            return response.status(401).json({ message: 'Unauthorized. Please login first.' });
        }

        if (request.user.role !== 'user' && request.user.role !== 'admin') {
            return response.status(403).json({ message: 'Access denied.' });
        }

        next();

    } catch (error) {
        return response.status(500).json({ message: error.message });
    }
};

module.exports = { isAdmin, isUser };
