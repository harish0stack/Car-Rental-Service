// =============================================
// app.js — RentWheels SPA Logic
// =============================================

// ── APP STATE ─────────────────────────────────
const state = {
    user:       null,
    token:      null,
    cars:       [],
    currentCar: null,
    socket:     null,
};

// Car type → emoji map
const CAR_EMOJI = { sedan:'🚗', suv:'🚙', hatchback:'🚘', truck:'🚚', van:'🚐', coupe:'🏎️' };

// ── INIT ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Restore session (scoped to this tab/window via sessionStorage)
    const savedToken = sessionStorage.getItem('rw_token') || localStorage.getItem('rw_token');
    const savedUser  = sessionStorage.getItem('rw_user')  || localStorage.getItem('rw_user');
    if (savedToken && savedUser) {
        state.token = savedToken;
        state.user  = JSON.parse(savedUser);
        updateNavForUser();
    }

    // Load cars on start
    loadCars();

    // Connect Socket.io
    initSocket();
});

// ── SOCKET.IO ─────────────────────────────────
function initSocket() {
    try {
        state.socket = io();

        state.socket.on('connect', () => {
            console.log('🔌 Socket connected:', state.socket.id);
        });

        // Real-time car availability update
        state.socket.on('car:availability', ({ carId, isAvailable }) => {
            const idx = state.cars.findIndex(c => c._id === carId);
            if (idx !== -1) {
                state.cars[idx].isAvailable = isAvailable;
                renderCarsGrid(state.cars);
            }
            if (state.user && state.user.role === 'admin') {
                loadAdminFleetTable();
                loadAdminStats();
            }
            const msg = isAvailable
                ? '🟢 A car just became available for rent!'
                : '🔴 A car was just booked!';
            showToast(msg, 'info');
        });

        // New booking created
        state.socket.on('booking:created', () => {
            showToast('📋 New booking placed!', 'info');
            loadCars();
            if (state.user && state.user.role === 'admin') {
                loadAdminRentalsTable();
                loadAdminStats();
            }
        });

        // Booking status updated
        state.socket.on('booking:statusUpdated', ({ status }) => {
            showToast(`📝 Rental status changed to: ${status}`, 'info');
            if (state.user && state.user.role === 'admin') {
                loadAdminRentalsTable();
                loadAdminStats();
            }
        });

        // Fleet updated (car added or removed)
        state.socket.on('car:fleet-updated', (data) => {
            console.log('⚡ Socket event received: car:fleet-updated', data);
            loadCars();
            if (state.user && state.user.role === 'admin') {
                loadAdminFleetTable();
                loadAdminStats();
            }
            const title = data?.car ? `${data.car.brand} ${data.car.model}` : 'New car';
            showToast(`🚗 ${title} added to fleet!`, 'success');
        });

    } catch (e) {
        console.warn('Socket.io not available:', e.message);
    }
}

// ── VIEW MANAGEMENT ───────────────────────────
function showView(viewName) {
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('view--active');
    });

    const target = document.getElementById('view-' + viewName);
    if (target) target.classList.add('view--active');

    // Update nav active state
    document.querySelectorAll('.nav__link').forEach(l => l.classList.remove('nav__link--active'));
    const navMap = { home: 'nav-home', 'my-rentals': 'nav-rentals', admin: 'nav-admin' };
    const activeNav = document.getElementById(navMap[viewName]);
    if (activeNav) activeNav.classList.add('nav__link--active');

    // Load data for that view
    if (viewName === 'home')       loadCars();
    if (viewName === 'my-rentals') loadMyRentals();
    if (viewName === 'admin')      loadAdminDashboard();

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── MODAL MANAGEMENT ──────────────────────────
function openModal(name) {
    document.getElementById('modal-overlay').classList.add('overlay--visible');
    document.getElementById('modal-' + name).classList.add('modal--open');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('overlay--visible');
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('modal--open'));
}

function switchModal(name) {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('modal--open'));
    document.getElementById('modal-' + name).classList.add('modal--open');
}

// ── AUTH ──────────────────────────────────────
async function handleRegister(e) {
    e.preventDefault();
    const btn = document.getElementById('register-btn');
    btn.disabled = true;
    btn.textContent = 'Creating...';

    try {
        await API.register({
            name:     document.getElementById('reg-name').value.trim(),
            username: document.getElementById('reg-username').value.trim(),
            email:    document.getElementById('reg-email').value.trim(),
            password: document.getElementById('reg-password').value,
        });
        showToast('Account created! Please login.', 'success');
        document.getElementById('form-register').reset();
        switchModal('login');
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Create Account';
    }
}

async function handleAdminRegister(e) {
    e.preventDefault();
    const btn = document.getElementById('admin-reg-btn');
    btn.disabled = true;
    btn.textContent = 'Creating Admin...';

    try {
        await API.adminRegister({
            name:     document.getElementById('admin-reg-name').value.trim(),
            username: document.getElementById('admin-reg-username').value.trim(),
            email:    document.getElementById('admin-reg-email').value.trim(),
            password: document.getElementById('admin-reg-password').value,
        });

        showToast('👑 Admin account created! Please login.', 'success');
        document.getElementById('form-admin-register').reset();
        switchModal('admin-login');
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Sign Up as Admin';
    }
}

async function handleAdminLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('admin-login-btn');
    btn.disabled = true;
    btn.textContent = 'Verifying Admin...';

    try {
        const data = await API.adminLogin({
            username: document.getElementById('admin-login-username').value.trim(),
            password: document.getElementById('admin-login-password').value,
        });

        const payload = JSON.parse(atob(data.token.split('.')[1]));
        state.token = data.token;
        state.user  = payload;

        sessionStorage.setItem('rw_token', data.token);
        sessionStorage.setItem('rw_user',  JSON.stringify(payload));

        updateNavForUser();
        closeModal();
        showToast(`👑 Welcome, Admin ${payload.username}!`, 'success');
        document.getElementById('form-admin-login').reset();
        showView('admin');
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Login as Admin';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    btn.disabled = true;
    btn.textContent = 'Logging in...';

    try {
        const data = await API.login({
            username: document.getElementById('login-username').value.trim(),
            password: document.getElementById('login-password').value,
        });

        // Decode token payload
        const payload = JSON.parse(atob(data.token.split('.')[1]));
        state.token = data.token;
        state.user  = payload;

        sessionStorage.setItem('rw_token', data.token);
        sessionStorage.setItem('rw_user',  JSON.stringify(payload));

        updateNavForUser();
        closeModal();
        showToast(`Welcome back, ${payload.username}! 👋`, 'success');
        document.getElementById('form-login').reset();
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Login';
    }
}

function logout() {
    state.token = null;
    state.user  = null;
    sessionStorage.removeItem('rw_token');
    sessionStorage.removeItem('rw_user');
    localStorage.removeItem('rw_token');
    localStorage.removeItem('rw_user');
    updateNavForUser();
    showView('home');
    showToast('Logged out successfully', 'success');
}

function updateNavForUser() {
    const isLoggedIn = !!state.user;

    document.getElementById('nav-auth').style.display  = isLoggedIn ? 'none' : 'flex';
    document.getElementById('nav-user').style.display  = isLoggedIn ? 'flex' : 'none';
    document.getElementById('nav-rentals').style.display = isLoggedIn ? 'inline-flex' : 'none';
    document.getElementById('nav-admin').style.display   = (isLoggedIn && state.user.role === 'admin') ? 'inline-flex' : 'none';

    if (isLoggedIn) {
        document.getElementById('user-display-name').textContent  = state.user.username;
        document.getElementById('user-avatar-circle').textContent = state.user.username.charAt(0).toUpperCase();
    }
}

// ── CARS ──────────────────────────────────────
async function loadCars() {
    const grid = document.getElementById('cars-grid');
    if (!grid) return;
    grid.innerHTML = `<div class="state-loading"><div class="spinner"></div><p>Loading fleet...</p></div>`;

    try {
        const data = await API.getCars();
        state.cars = data.cars || [];
        renderCarsGrid(state.cars);
    } catch (err) {
        grid.innerHTML = `<div class="state-empty" style="grid-column:1/-1"><div class="state-empty__icon">⚠️</div><p class="state-empty__title">Could not load cars</p><p class="state-empty__sub">${err.message}</p></div>`;
    }
}

function applyFilters() {
    const search = document.getElementById('search-input')?.value.toLowerCase() || '';
    const type   = document.getElementById('filter-type')?.value || '';
    const fuel   = document.getElementById('filter-fuel')?.value || '';
    const trans  = document.getElementById('filter-trans')?.value || '';
    const avail  = document.getElementById('filter-avail')?.value || '';

    const filtered = state.cars.filter(car => {
        const matchSearch = !search || `${car.brand} ${car.model}`.toLowerCase().includes(search);
        const matchType   = !type  || car.type === type;
        const matchFuel   = !fuel  || car.fuelType === fuel;
        const matchTrans  = !trans || car.transmission === trans;
        const matchAvail  = !avail || String(car.isAvailable) === avail;
        return matchSearch && matchType && matchFuel && matchTrans && matchAvail;
    });

    renderCarsGrid(filtered);
}

function clearFilters() {
    ['filter-type','filter-fuel','filter-trans','filter-avail'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const si = document.getElementById('search-input');
    if (si) si.value = '';
    renderCarsGrid(state.cars);
}

function renderCarsGrid(cars) {
    const grid  = document.getElementById('cars-grid');
    const count = document.getElementById('cars-count');
    if (!grid) return;

    if (count) count.textContent = `${cars.length} car${cars.length !== 1 ? 's' : ''} found`;

    if (cars.length === 0) {
        grid.innerHTML = `
            <div class="state-empty">
                <div class="state-empty__icon">🔍</div>
                <p class="state-empty__title">No cars found</p>
                <p class="state-empty__sub">Try adjusting your filters</p>
            </div>`;
        return;
    }

    grid.innerHTML = cars.map(car => renderCarCard(car)).join('');
}

function renderCarCard(car) {
    const emoji = CAR_EMOJI[car.type] || '🚗';
    const availClass = car.isAvailable ? 'badge--available' : 'badge--unavailable';
    const availText  = car.isAvailable ? '● Available' : '● Unavailable';

    return `
    <div class="car-card" onclick="openCarDetail('${car._id}')" id="car-card-${car._id}">
        <div class="car-card__header car-card__header--${car.type}">
            <div class="car-card__badges">
                <span class="badge badge--type">${car.type}</span>
                <span class="badge ${availClass}">${availText}</span>
            </div>
            <div class="car-card__car-icon">${emoji}</div>
        </div>
        <div class="car-card__body">
            <h3 class="car-card__name">${car.brand} ${car.model}</h3>
            <p class="car-card__year">${car.year}</p>
            <div class="car-card__specs">
                <span class="car-card__spec">⛽ ${car.fuelType}</span>
                <span class="car-card__spec">⚙️ ${car.transmission}</span>
                <span class="car-card__spec">👥 ${car.seats} seats</span>
            </div>
            <div class="car-card__footer">
                <div>
                    <span class="car-card__price-num">₹${car.pricePerDay.toLocaleString('en-IN')}</span>
                    <span class="car-card__price-unit">/day</span>
                </div>
                <button class="btn btn--accent btn--sm"
                    onclick="event.stopPropagation(); openCarDetail('${car._id}')">
                    View →
                </button>
            </div>
        </div>
    </div>`;
}

// ── CAR DETAIL ────────────────────────────────
async function openCarDetail(carId) {
    showView('car-detail');
    const root = document.getElementById('car-detail-root');
    root.innerHTML = `<div class="state-loading"><div class="spinner"></div><p>Loading...</p></div>`;

    try {
        const data = await API.getCarById(carId);
        state.currentCar = data.car;
        renderCarDetail(data.car);
    } catch (err) {
        root.innerHTML = `<p style="color:var(--danger)">${err.message}</p>`;
    }
}

function renderCarDetail(car) {
    const root  = document.getElementById('car-detail-root');
    const emoji = CAR_EMOJI[car.type] || '🚗';
    const isLoggedIn = !!state.user;

    root.innerHTML = `
    <div class="car-detail">
        <div class="car-detail__left">
            <div class="car-detail__banner car-card__header--${car.type}" style="border-radius:var(--r-xl)">
                <div style="font-size:96px;filter:drop-shadow(0 12px 24px rgba(0,0,0,.3))">${emoji}</div>
            </div>
            <div class="car-detail__info">
                <h1 class="car-detail__name">${car.brand} ${car.model}</h1>
                <p class="car-detail__year">${car.year} · ${car.type}</p>
                <div class="car-detail__specs-grid">
                    <div class="car-detail__spec-item"><p class="car-detail__spec-label">Fuel Type</p><p class="car-detail__spec-val">${car.fuelType}</p></div>
                    <div class="car-detail__spec-item"><p class="car-detail__spec-label">Transmission</p><p class="car-detail__spec-val">${car.transmission}</p></div>
                    <div class="car-detail__spec-item"><p class="car-detail__spec-label">Seats</p><p class="car-detail__spec-val">${car.seats} persons</p></div>
                    <div class="car-detail__spec-item"><p class="car-detail__spec-label">License Plate</p><p class="car-detail__spec-val">${car.licensePlate}</p></div>
                    <div class="car-detail__spec-item"><p class="car-detail__spec-label">Availability</p>
                        <p class="avail-dot avail-dot--${car.isAvailable ? 'yes':'no'}" id="detail-avail">
                            ${car.isAvailable ? 'Available' : 'Unavailable'}
                        </p>
                    </div>
                    <div class="car-detail__spec-item"><p class="car-detail__spec-label">Price</p><p class="car-detail__spec-val">₹${car.pricePerDay.toLocaleString('en-IN')}/day</p></div>
                </div>
                ${car.description ? `<p class="car-detail__desc">${car.description}</p>` : ''}
            </div>
        </div>

        <!-- Booking Card -->
        <div class="booking-card">
            <div class="booking-card__price">
                <span class="booking-card__price-num">₹${car.pricePerDay.toLocaleString('en-IN')}</span>
                <span class="booking-card__price-unit">&nbsp;/ day</span>
            </div>
            <p class="booking-card__label">All-inclusive price · No hidden fees</p>

            ${isLoggedIn && car.isAvailable ? `
            <form onsubmit="handleBooking(event)">
                <div class="field">
                    <label class="field__label">Pickup Date</label>
                    <input class="field__input" type="date" id="book-start" min="${new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="field">
                    <label class="field__label">Return Date</label>
                    <input class="field__input" type="date" id="book-end" min="${new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="field">
                    <label class="field__label">Pickup Location</label>
                    <input class="field__input" type="text" id="book-pickup" placeholder="e.g. Mumbai Airport" required>
                </div>
                <div class="field">
                    <label class="field__label">Drop-off Location</label>
                    <input class="field__input" type="text" id="book-dropoff" placeholder="e.g. Pune Station" required>
                </div>
                <div class="booking-card__divider"></div>
                <div class="booking-card__total" id="cost-preview" style="display:none">
                    <span class="booking-card__total-label" id="cost-days"></span>
                    <span class="booking-card__total-amount" id="cost-total"></span>
                </div>
                <button class="btn btn--accent btn--full btn--lg" type="submit" id="book-btn">Book Now</button>
            </form>
            <script>
                ['book-start','book-end'].forEach(id => {
                    document.getElementById(id).addEventListener('change', previewCost);
                });
            <\/script>
            ` : !isLoggedIn ? `
            <div class="booking-card__divider"></div>
            <p style="font-size:14px;color:var(--text-2);margin-bottom:16px;text-align:center">Login to book this car</p>
            <button class="btn btn--accent btn--full" onclick="openModal('login')">Login to Book</button>
            ` : `
            <div class="booking-card__divider"></div>
            <div style="text-align:center;padding:12px 0">
                <span class="badge badge--unavailable" style="font-size:14px;padding:8px 16px">● Currently Unavailable</span>
                <p style="font-size:13px;color:var(--text-3);margin-top:10px">Check back soon for availability</p>
            </div>
            `}
        </div>
    </div>`;
}

function previewCost() {
    const startVal = document.getElementById('book-start')?.value;
    const endVal   = document.getElementById('book-end')?.value;
    const preview  = document.getElementById('cost-preview');
    if (!startVal || !endVal || !state.currentCar) return;

    const days = Math.ceil((new Date(endVal) - new Date(startVal)) / (1000*60*60*24));
    if (days <= 0) { if(preview) preview.style.display='none'; return; }

    const total = days * state.currentCar.pricePerDay;
    document.getElementById('cost-days').textContent  = `${days} day${days>1?'s':''}`;
    document.getElementById('cost-total').textContent = `₹${total.toLocaleString('en-IN')}`;
    if(preview) preview.style.display = 'flex';
}

async function handleBooking(e) {
    e.preventDefault();
    const btn = document.getElementById('book-btn');
    btn.disabled = true;
    btn.textContent = 'Booking...';

    try {
        const data = await API.createRental({
            carId:           state.currentCar._id,
            startDate:       document.getElementById('book-start').value,
            endDate:         document.getElementById('book-end').value,
            pickupLocation:  document.getElementById('book-pickup').value.trim(),
            dropoffLocation: document.getElementById('book-dropoff').value.trim(),
        });

        showToast(`🚗 Booked! ₹${data.totalCost.toLocaleString('en-IN')} for ${data.totalDays} days`, 'success');

        // Re-fetch car to update availability display
        const updated = await API.getCarById(state.currentCar._id);
        state.currentCar = updated.car;
        renderCarDetail(updated.car);

    } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Book Now';
    }
}

// ── MY RENTALS ────────────────────────────────
async function loadMyRentals() {
    if (!state.user) { showView('home'); return; }
    const root = document.getElementById('rentals-root');
    root.innerHTML = `<div class="state-loading"><div class="spinner"></div><p>Loading rentals...</p></div>`;

    try {
        const data = await API.getRentals();
        const rentals = data.rentals || [];

        if (rentals.length === 0) {
            root.innerHTML = `
                <div class="state-empty">
                    <div class="state-empty__icon">📋</div>
                    <p class="state-empty__title">No rentals yet</p>
                    <p class="state-empty__sub">Browse our fleet and book your first car!</p>
                    <br>
                    <button class="btn btn--accent" onclick="showView('home')">Browse Fleet →</button>
                </div>`;
            return;
        }

        root.innerHTML = `<div class="rental-list">${rentals.map(r => renderRentalCard(r)).join('')}</div>`;
    } catch (err) {
        root.innerHTML = `<p style="color:var(--danger)">${err.message}</p>`;
    }
}

function renderRentalCard(r) {
    const car   = r.carId;
    const emoji = car ? (CAR_EMOJI[car.type] || '🚗') : '🚗';
    const carName = car ? `${car.brand} ${car.model}` : 'Car';
    const start = new Date(r.startDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
    const end   = new Date(r.endDate).toLocaleDateString('en-IN',   { day:'numeric', month:'short', year:'numeric' });

    return `
    <div class="rental-card">
        <div class="rental-card__icon">${emoji}</div>
        <div>
            <p class="rental-card__title">${carName}</p>
            <p class="rental-card__meta">${start} → ${end} · ${r.pickupLocation}</p>
            <p class="rental-card__meta" style="margin-top:4px">${r.totalDays} day${r.totalDays>1?'s':''}</p>
        </div>
        <div class="rental-card__right">
            <p class="rental-card__cost">₹${r.totalCost.toLocaleString('en-IN')}</p>
            <span class="badge badge--${r.status}">${r.status}</span>
        </div>
    </div>`;
}

// ── ADMIN DASHBOARD ───────────────────────────
async function loadAdminDashboard() {
    if (!state.user || state.user.role !== 'admin') { showView('home'); return; }
    loadAdminStats();
    loadAdminFleetTable();
}

async function loadAdminStats() {
    const root = document.getElementById('admin-stats');
    if (!root) return;
    try {
        const [carsRes, rentalsRes] = await Promise.all([
            API.getCars(),
            API.getRentals().catch(() => ({ rentals: [] }))
        ]);
        const cars = carsRes.cars || [];
        const rentals = rentalsRes.rentals || [];
        const totalCars = cars.length;
        const availableCars = cars.filter(c => c.isAvailable).length;
        const unavailableCars = totalCars - availableCars;
        const totalRentals = rentals.length;
        const activeRentals = rentals.filter(r => r.status === 'active').length;
        const pendingRentals = rentals.filter(r => r.status === 'pending').length;

        root.innerHTML = `
            <div class="stat-card stat-card--blue">
                <p class="stat-card__label">Total Fleet</p>
                <p class="stat-card__value">${totalCars}</p>
                <p class="stat-card__sub">registered cars</p>
            </div>
            <div class="stat-card stat-card--green">
                <p class="stat-card__label">Available</p>
                <p class="stat-card__value">${availableCars}</p>
                <p class="stat-card__sub">ready to rent</p>
            </div>
            <div class="stat-card stat-card--orange">
                <p class="stat-card__label">On Rent</p>
                <p class="stat-card__value">${unavailableCars}</p>
                <p class="stat-card__sub">currently rented</p>
            </div>
            <div class="stat-card">
                <p class="stat-card__label">Total Bookings</p>
                <p class="stat-card__value">${totalRentals}</p>
                <p class="stat-card__sub">all time</p>
            </div>
            <div class="stat-card">
                <p class="stat-card__label">Active</p>
                <p class="stat-card__value">${activeRentals}</p>
                <p class="stat-card__sub">ongoing rentals</p>
            </div>
            <div class="stat-card">
                <p class="stat-card__label">Pending</p>
                <p class="stat-card__value">${pendingRentals}</p>
                <p class="stat-card__sub">awaiting confirmation</p>
            </div>`;
    } catch (err) {
        root.innerHTML = `<p style="color:var(--danger)">${err.message}</p>`;
    }
}

async function loadAdminFleetTable() {
    const root = document.getElementById('admin-fleet-table');
    root.innerHTML = `<div class="state-loading"><div class="spinner"></div></div>`;
    try {
        const data = await API.getAdminCars();
        const cars = data.cars || [];

        if (cars.length === 0) {
            root.innerHTML = `<div class="state-empty"><div class="state-empty__icon">🚗</div><p class="state-empty__title">No cars yet</p><p class="state-empty__sub">Add your first car using the form above</p></div>`;
            return;
        }

        root.innerHTML = `
        <div class="table-wrap">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Car</th><th>Type</th><th>Year</th><th>Plate</th>
                        <th>Fuel</th><th>Trans.</th><th>Seats</th>
                        <th>₹/Day</th><th>Status</th><th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${cars.map(c => `
                    <tr id="fleet-row-${c._id}">
                        <td><strong>${c.brand} ${c.model}</strong></td>
                        <td><span class="badge badge--type" style="background:var(--orange-soft);color:var(--orange)">${c.type}</span></td>
                        <td>${c.year}</td>
                        <td><code style="font-size:12px;background:var(--bg);padding:2px 6px;border-radius:4px">${c.licensePlate}</code></td>
                        <td style="text-transform:capitalize">${c.fuelType}</td>
                        <td style="text-transform:capitalize">${c.transmission}</td>
                        <td>${c.seats}</td>
                        <td>₹${c.pricePerDay.toLocaleString('en-IN')}</td>
                        <td><span class="avail-dot avail-dot--${c.isAvailable?'yes':'no'}">${c.isAvailable ? 'Available':'On Rent'}</span></td>
                        <td>
                            <div class="actions">
                                <button class="btn btn--ghost-dark btn--sm" onclick="adminToggleAvail('${c._id}', ${c.isAvailable})">
                                    ${c.isAvailable ? 'Mark Rented' : 'Mark Free'}
                                </button>
                                <button class="btn btn--danger btn--sm" onclick="adminDeleteCar('${c._id}')">Delete</button>
                            </div>
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
    } catch (err) {
        root.innerHTML = `<p style="color:var(--danger)">${err.message}</p>`;
    }
}

async function loadAdminRentalsTable() {
    const root = document.getElementById('admin-rentals-table');
    root.innerHTML = `<div class="state-loading"><div class="spinner"></div></div>`;
    try {
        const data = await API.getAdminRentals();
        const rentals = data.rentals || [];

        if (rentals.length === 0) {
            root.innerHTML = `<div class="state-empty"><div class="state-empty__icon">📋</div><p class="state-empty__title">No rentals yet</p></div>`;
            return;
        }

        root.innerHTML = `
        <div class="table-wrap">
            <table class="data-table">
                <thead>
                    <tr><th>User</th><th>Car</th><th>Start</th><th>End</th><th>Days</th><th>Cost</th><th>Status</th><th>Update</th></tr>
                </thead>
                <tbody>
                    ${rentals.map(r => {
                        const car  = r.carId  || {};
                        const user = r.userId || {};
                        const start = new Date(r.startDate).toLocaleDateString('en-IN');
                        const end   = new Date(r.endDate).toLocaleDateString('en-IN');
                        return `
                        <tr>
                            <td><strong>${user.username || '—'}</strong><br><span style="font-size:12px;color:var(--text-3)">${user.email||''}</span></td>
                            <td>${car.brand||'—'} ${car.model||''}</td>
                            <td>${start}</td>
                            <td>${end}</td>
                            <td>${r.totalDays}d</td>
                            <td>₹${r.totalCost.toLocaleString('en-IN')}</td>
                            <td><span class="badge badge--${r.status}">${r.status}</span></td>
                            <td>
                                <select class="status-select" onchange="adminUpdateRentalStatus('${r._id}', this.value)">
                                    <option value="">Change...</option>
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="active">Active</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
    } catch (err) {
        root.innerHTML = `<p style="color:var(--danger)">${err.message}</p>`;
    }
}

async function loadAdminInsuranceTable() {
    const root = document.getElementById('admin-insurance-table');
    root.innerHTML = `<div class="state-loading"><div class="spinner"></div></div>`;
    try {
        const data = await API.getAllInsurance();
        const ins = data.insurances || [];

        if (ins.length === 0) {
            root.innerHTML = `<div class="state-empty"><div class="state-empty__icon">🛡️</div><p class="state-empty__title">No policies yet</p></div>`;
            return;
        }

        root.innerHTML = `
        <div class="table-wrap">
            <table class="data-table">
                <thead>
                    <tr><th>Car</th><th>Provider</th><th>Policy No.</th><th>Coverage</th><th>Amount (₹)</th><th>Premium (₹)</th><th>Expiry</th><th>Active</th></tr>
                </thead>
                <tbody>
                    ${ins.map(i => {
                        const car = i.carId || {};
                        const expiry = new Date(i.expiryDate).toLocaleDateString('en-IN');
                        return `
                        <tr>
                            <td><strong>${car.brand||'—'} ${car.model||''}</strong><br><span style="font-size:12px;color:var(--text-3)">${car.licensePlate||''}</span></td>
                            <td>${i.provider}</td>
                            <td><code style="font-size:12px">${i.policyNumber}</code></td>
                            <td style="text-transform:capitalize"><span class="badge badge--type" style="background:var(--info-bg);color:var(--info)">${i.coverageType}</span></td>
                            <td>₹${i.coverageAmount.toLocaleString('en-IN')}</td>
                            <td>₹${i.premium.toLocaleString('en-IN')}</td>
                            <td>${expiry}</td>
                            <td><span class="avail-dot avail-dot--${i.isActive?'yes':'no'}">${i.isActive?'Active':'Expired'}</span></td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
    } catch (err) {
        root.innerHTML = `<p style="color:var(--danger)">${err.message}</p>`;
    }
}

// ── ADMIN ACTIONS ─────────────────────────────
async function adminToggleAvail(carId, currentAvail) {
    try {
        await API.updateCar(carId, { isAvailable: !currentAvail });
        showToast('Car availability updated ✓', 'success');
        loadAdminFleetTable();
        loadCars();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function adminDeleteCar(carId) {
    if (!confirm('Delete this car? This cannot be undone.')) return;
    try {
        await API.deleteCar(carId);
        showToast('Car deleted ✓', 'success');
        loadAdminFleetTable();
        loadCars();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function adminUpdateRentalStatus(rentalId, status) {
    if (!status) return;
    try {
        await API.updateRentalStatus(rentalId, status);
        showToast(`Status updated to "${status}" ✓`, 'success');
        loadAdminRentalsTable();
        loadAdminStats();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function handleAddCar(e) {
    e.preventDefault();
    try {
        const type = document.getElementById('f-car-type').value;
        const defaultImages = {
            sedan: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=900&auto=format&fit=crop&q=80',
            suv: 'https://images.unsplash.com/photo-1581540222194-0def2dda95b8?w=900&auto=format&fit=crop&q=80',
            hatchback: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=900&auto=format&fit=crop&q=80',
            coupe: 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?w=900&auto=format&fit=crop&q=80',
            truck: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=900&auto=format&fit=crop&q=80',
            van: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=900&auto=format&fit=crop&q=80',
        };

        await API.createCar({
            brand:        document.getElementById('f-car-brand').value.trim(),
            model:        document.getElementById('f-car-model').value.trim(),
            year:         Number(document.getElementById('f-car-year').value),
            licensePlate: document.getElementById('f-car-plate').value.trim(),
            type:         type,
            pricePerDay:  Number(document.getElementById('f-car-price').value),
            seats:        Number(document.getElementById('f-car-seats').value),
            fuelType:     document.getElementById('f-car-fuel').value,
            transmission: document.getElementById('f-car-trans').value,
            description:  document.getElementById('f-car-desc').value.trim() || 'Well-maintained rental vehicle with full inspection.',
            imageUrl:     defaultImages[type] || defaultImages.sedan,
        });
        showToast('Car added to fleet ✓', 'success');
        toggleForm('form-add-car');
        e.target.reset();
        loadAdminFleetTable();
        loadAdminStats();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function handleAddInsurance(e) {
    e.preventDefault();
    try {
        await API.createInsurance({
            carId:          document.getElementById('f-ins-carid').value.trim(),
            provider:       document.getElementById('f-ins-provider').value.trim(),
            policyNumber:   document.getElementById('f-ins-policy').value.trim(),
            coverageType:   document.getElementById('f-ins-coverage').value,
            coverageAmount: Number(document.getElementById('f-ins-amount').value),
            premium:        Number(document.getElementById('f-ins-premium').value),
            startDate:      document.getElementById('f-ins-start').value,
            expiryDate:     document.getElementById('f-ins-expiry').value,
        });
        showToast('Insurance policy added ✓', 'success');
        toggleForm('form-add-insurance');
        e.target.reset();
        loadAdminInsuranceTable();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ── TABS ──────────────────────────────────────
function switchTab(name) {
    // Buttons
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('tab--active'));
    document.getElementById('tab-btn-' + name)?.classList.add('tab--active');

    // Panels
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('tab-panel--active'));
    document.getElementById('tab-' + name)?.classList.add('tab-panel--active');

    // Load data
    if (name === 'fleet')     loadAdminFleetTable();
    if (name === 'rentals')   loadAdminRentalsTable();
    if (name === 'insurance') loadAdminInsuranceTable();
}

// ── UI HELPERS ────────────────────────────────
function toggleForm(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

let toastTimer;
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icons = { success:'✓', error:'✕', info:'ℹ' };

    document.getElementById('toast-icon').textContent    = icons[type] || '✓';
    document.getElementById('toast-message').textContent = message;

    toast.className = `toast toast--${type} toast--visible`;

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.className = 'toast';
    }, 3500);
}
