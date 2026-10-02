// =============================================
// api.js — All API calls in one place
// =============================================

const API = {
    base: '/api',

    // ── Shared fetch helper ──────────────────
    async _request(method, path, body = null) {
        const token = sessionStorage.getItem('rw_token') || localStorage.getItem('rw_token');
        const opts = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (token) opts.headers['token'] = token;
        if (body)  opts.body = JSON.stringify(body);

        const res = await fetch(this.base + path, opts);
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Something went wrong');
        return data;
    },

    // ── AUTH (CUSTOMER) ─────────────────────
    register(body) {
        return this._request('POST', '/auth/register', body);
    },
    login(body) {
        return this._request('POST', '/auth/login', body);
    },
    getProfile() {
        return this._request('GET', '/auth/profile');
    },

    // ── AUTH (ADMIN) ─────────────────────────
    adminRegister(body) {
        return this._request('POST', '/admin/register', body);
    },
    adminLogin(body) {
        return this._request('POST', '/admin/login', body);
    },

    // ── CARS ─────────────────────────────────
    getCars(query = '') {
        return this._request('GET', `/cars${query ? '?' + query : ''}`);
    },
    getCarById(id) {
        return this._request('GET', `/cars/${id}`);
    },
    createCar(body) {
        return this._request('POST', '/cars', body);
    },
    updateCar(id, body) {
        return this._request('PUT', `/cars/${id}`, body);
    },
    deleteCar(id) {
        return this._request('DELETE', `/cars/${id}`);
    },

    // ── RENTALS ──────────────────────────────
    createRental(body) {
        return this._request('POST', '/rentals', body);
    },
    getRentals() {
        return this._request('GET', '/rentals');
    },
    getRentalById(id) {
        return this._request('GET', `/rentals/${id}`);
    },
    updateRentalStatus(id, status) {
        return this._request('PUT', `/rentals/${id}/status`, { status });
    },

    // ── INSURANCE ────────────────────────────
    createInsurance(body) {
        return this._request('POST', '/insurance', body);
    },
    getAllInsurance() {
        return this._request('GET', '/insurance');
    },
    getInsuranceById(id) {
        return this._request('GET', `/insurance/${id}`);
    },

    // ── ADMIN (PS REQUIREMENT) ───────────────
    getAdminCars() {
        return this._request('GET', '/admin/cars');
    },
    getAdminRentals() {
        return this._request('GET', '/admin/rentals');
    },
};
