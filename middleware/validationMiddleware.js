const validateRegister = (request, response, next) => {
    const { name, username, email, password } = request.body;

    if (!name) {
        return response.status(400).json({ message: 'name is required' });
    }
    if (!username) {
        return response.status(400).json({ message: 'username is required' });
    }
    if (!email) {
        return response.status(400).json({ message: 'email is required' });
    }
    if (!password) {
        return response.status(400).json({ message: 'password is required' });
    }
    if (password.length < 6) {
        return response.status(400).json({ message: 'password must be at least 6 characters' });
    }

    next();
};

const validateLogin = (request, response, next) => {
    const { username, password } = request.body;

    if (!username) {
        return response.status(400).json({ message: 'username is required' });
    }
    if (!password) {
        return response.status(400).json({ message: 'password is required' });
    }

    next();
};

const validateCar = (request, response, next) => {
    const { brand, model, year, licensePlate, type, pricePerDay, seats, fuelType, transmission } = request.body;

    if (!brand) return response.status(400).json({ message: 'brand is required' });
    if (!model) return response.status(400).json({ message: 'model is required' });
    if (!year) return response.status(400).json({ message: 'year is required' });
    if (!licensePlate) return response.status(400).json({ message: 'licensePlate is required' });
    if (!type) return response.status(400).json({ message: 'type is required' });
    if (!pricePerDay) return response.status(400).json({ message: 'pricePerDay is required' });
    if (!seats) return response.status(400).json({ message: 'seats is required' });
    if (!fuelType) return response.status(400).json({ message: 'fuelType is required' });
    if (!transmission) return response.status(400).json({ message: 'transmission is required' });

    next();
};

const validateRental = (request, response, next) => {
    const { carId, startDate, endDate, pickupLocation, dropoffLocation } = request.body;

    if (!carId) return response.status(400).json({ message: 'carId is required' });
    if (!startDate) return response.status(400).json({ message: 'startDate is required' });
    if (!endDate) return response.status(400).json({ message: 'endDate is required' });
    if (!pickupLocation) return response.status(400).json({ message: 'pickupLocation is required' });
    if (!dropoffLocation) return response.status(400).json({ message: 'dropoffLocation is required' });

    next();
};

const validateInsurance = (request, response, next) => {
    const { carId, provider, policyNumber, coverageType, coverageAmount, premium, startDate, expiryDate } = request.body;

    if (!carId) return response.status(400).json({ message: 'carId is required' });
    if (!provider) return response.status(400).json({ message: 'provider is required' });
    if (!policyNumber) return response.status(400).json({ message: 'policyNumber is required' });
    if (!coverageType) return response.status(400).json({ message: 'coverageType is required' });
    if (!coverageAmount) return response.status(400).json({ message: 'coverageAmount is required' });
    if (!premium) return response.status(400).json({ message: 'premium is required' });
    if (!startDate) return response.status(400).json({ message: 'startDate is required' });
    if (!expiryDate) return response.status(400).json({ message: 'expiryDate is required' });

    next();
};

module.exports = { validateRegister, validateLogin, validateCar, validateRental, validateInsurance };
