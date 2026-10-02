# 🚗 RentWheels — Car Rental Service Backend API

> **B.Tech Computer Science Engineering — Backend Development Case Study 30**  
> *A production-grade REST API and Real-Time WebSocket service built with Node.js, Express.js, MongoDB, Socket.io, and JWT.*

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg?style=flat-square&logo=node.js)](https://nodejs.org)
[![Express.js](https://img.shields.io/badge/Express.js-4.18+-lightgrey.svg?style=flat-square&logo=express)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%20ODM-brightgreen.svg?style=flat-square&logo=mongodb)](https://www.mongodb.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-Real--Time-black.svg?style=flat-square&logo=socket.io)](https://socket.io)
[![Swagger](https://img.shields.io/badge/Swagger-OpenAPI%203.0-orange.svg?style=flat-square&logo=swagger)](http://localhost:5001/api-docs)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=flat-square)](LICENSE)

---

## 📋 Table of Contents
1. [Project Overview](#-project-overview)
2. [Key Features](#-key-features)
3. [Technology Stack](#-technology-stack)
4. [Architecture & Project Structure](#-architecture--project-structure)
5. [Database Models & Schemas](#-database-models--schemas)
6. [API Endpoints Reference](#-api-endpoints-reference)
7. [WebSocket Events (Socket.io)](#-websocket-events-socketio)
8. [Getting Started & Installation](#-getting-started--installation)
9. [Pre-Seeded Credentials](#-pre-seeded-credentials)
10. [Interactive Swagger API Documentation](#-interactive-swagger-api-documentation)
11. [Side-by-Side Live Demo Guide](#-side-by-side-live-demo-guide)
12. [Deployment Guide (Render / Heroku)](#-deployment-guide-render--heroku)
13. [Deliverables Checklist](#-deliverables-checklist)

---

## 📌 Project Overview

**RentWheels** is a full-stack car rental platform developed to solve the Case Study 30 backend challenge. The application provides:
- **Vehicle Discovery & Booking**: Customers can browse vehicles by category (Sedan, SUV, Hatchback, Coupe, etc.), filter by fuel and transmission, and book rentals for chosen date ranges.
- **Fleet & Insurance Management**: Administrators have full CRUD authority over vehicles and can bind insurance policies to individual cars.
- **Real-Time Availability**: Socket.io broadcasts live fleet updates, car bookings, and availability toggles across all connected browser clients instantly without refreshing.
- **Role-Based Access Control**: Separate collections and authentication pipelines for Customers (`User`) and Administrators (`Admin`).

---

## ✨ Key Features

- **Modular MVC Architecture**: Clean separation between routes, controllers, middleware, models, and configuration.
- **Role-Based Security**: Guarded by JWT authentication middleware (`authMiddleware`) and strict role enforcement (`isAdmin`).
- **Stateless Session Scoping**: Uses per-tab storage on the frontend so administrators and customers can be tested side-by-side in separate windows without cross-session contamination.
- **Full Validation**: Sanitization and input validation on requests via `express-validator`.
- **Integrated Interactive Swagger UI**: Self-hosted OpenAPI documentation accessible at `/api-docs`.

---

## 🛠 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Runtime & Framework** | Node.js (v18+), Express.js |
| **Database & ODM** | MongoDB, Mongoose ODM |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` |
| **Real-Time WebSockets** | Socket.io |
| **Validation** | `express-validator` |
| **API Documentation** | OpenAPI 3.0, Swagger UI (`swagger-ui-express`) |
| **Frontend** | Vanilla HTML5, CSS3, JavaScript (Served via `express.static`) |

---

## 📂 Architecture & Project Structure

```
rentwheels/
├── config/
│   ├── db.js                 # MongoDB connection handler
│   └── socket.js             # Socket.io server initialization & singleton
├── controllers/
│   ├── adminController.js     # Admin sign up, login, fleet overview, rentals overview
│   ├── authController.js      # Customer sign up, login, user profile
│   ├── carController.js       # Fleet CRUD operations & availability emits
│   ├── insuranceController.js # Insurance policies CRUD
│   └── rentalController.js    # Rental bookings, date checks & status updates
├── middleware/
│   ├── authMiddleware.js      # JWT token verification
│   ├── roleMiddleware.js      # Role authorization (isAdmin, isUser)
│   └── validationMiddleware.js# express-validator request schemas
├── models/
│   ├── Admin.js              # Dedicated Administrator model
│   ├── Car.js                # Car vehicle specification schema
│   ├── Insurance.js          # Insurance policy schema linked to Car
│   ├── Rental.js             # Booking schema with user/car references
│   └── User.js               # Customer profile schema
├── public/                   # Static Frontend Single Page Application
│   ├── css/
│   │   └── style.css         # Modern, responsive UI design system
│   ├── js/
│   │   ├── api.js            # Frontend REST client
│   │   └── app.js            # UI logic, state management, Socket.io client
│   └── index.html            # Main SPA dashboard
├── .env                      # Environment configuration (ignored in git)
├── .gitignore                # Git ignore rules
├── package.json              # Dependencies and scripts
├── seed.js                   # Database seeder script
├── server.js                 # Express server & socket bootstrapper
└── swagger.json              # OpenAPI 3.0 API documentation
```

---

## 🗄 Database Models & Schemas

### 1. `Car` Schema
| Field | Type | Description |
| :--- | :--- | :--- |
| `brand` | String | Vehicle make (e.g. *Tesla*, *BMW*) |
| `model` | String | Vehicle model (e.g. *Model 3*, *M340i*) |
| `year` | Number | Manufacturing year |
| `licensePlate`| String | Unique vehicle registration |
| `type` | String | `sedan`, `suv`, `hatchback`, `truck`, `van`, `coupe` |
| `pricePerDay` | Number | Daily rental charge in INR |
| `isAvailable` | Boolean| Live rental availability |
| `fuelType` | String | `petrol`, `diesel`, `electric`, `hybrid` |
| `transmission`| String | `manual`, `automatic` |
| `imageUrl` | String | Photo URL of the vehicle |

### 2. `Rental` Schema
| Field | Type | Description |
| :--- | :--- | :--- |
| `userId` | ObjectId | Reference to `User` |
| `carId` | ObjectId | Reference to `Car` |
| `startDate` | Date | Pickup date |
| `endDate` | Date | Dropoff date |
| `totalDays` | Number | Calculated duration |
| `totalCost` | Number | Calculated cost (`days * pricePerDay`) |
| `status` | String | `pending`, `confirmed`, `active`, `completed`, `cancelled` |

### 3. `Insurance` Schema
| Field | Type | Description |
| :--- | :--- | :--- |
| `carId` | ObjectId | Reference to `Car` |
| `provider` | String | Insurance carrier name (e.g., *Allianz*) |
| `policyNumber`| String | Unique policy number |
| `coverageType`| String | `basic`, `standard`, `comprehensive` |
| `coverageAmount`| Number| Maximum claim amount |
| `premium` | Number | Annual premium cost |

---

## 🌐 API Endpoints Reference

### 🔐 1. Customer Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register a new customer |
| `POST` | `/api/auth/login` | Public | Login customer & return JWT |
| `GET` | `/api/auth/profile` | Customer | Fetch current customer profile |

### 👑 2. Administrator (`/api/admin`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/admin/register` | Public | Create new administrator account |
| `POST` | `/api/admin/login` | Public | Admin login & return admin JWT |
| `GET` | `/api/admin/cars` | Admin | Full fleet overview for admin *(Case Study Requirement)* |
| `GET` | `/api/admin/rentals` | Admin | All platform rentals overview *(Case Study Requirement)* |

### 🚗 3. Cars Fleet (`/api/cars`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/cars` | Public | Browse cars with filters (`type`, `fuelType`, `available`) |
| `GET` | `/api/cars/:id` | Public | Get single car details |
| `POST` | `/api/cars` | Admin | Add car to fleet *(Broadcasts via Socket.io)* |
| `PUT` | `/api/cars/:id` | Admin | Update car details/availability |
| `DELETE` | `/api/cars/:id` | Admin | Remove car from fleet |

### 📋 4. Rentals (`/api/rentals`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/rentals` | Customer | Book car *(Broadcasts availability update via Socket.io)* |
| `GET` | `/api/rentals` | Customer/Admin| Customer views personal bookings; Admin views all |
| `GET` | `/api/rentals/:id` | Customer/Admin| Get rental details by ID |
| `PUT` | `/api/rentals/:id/status`| Admin | Update status (`confirmed`, `active`, `completed`) |

### 🛡️ 5. Insurance (`/api/insurance`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/insurance` | Admin | Create and link insurance policy to a car |
| `GET` | `/api/insurance` | Admin | Fetch all insurance policies |
| `GET` | `/api/insurance/:id` | Admin | Get insurance policy by ID |

---

## ⚡ WebSocket Events (Socket.io)

Real-time bidirectional synchronization runs over WebSockets:

| Event Name | Sender | Payload | Description |
| :--- | :--- | :--- | :--- |
| `car:fleet-updated` | Server | `{ message, car }` | Emitted when an admin adds or deletes a vehicle. Clients update fleet view instantly. |
| `car:availability` | Server | `{ carId, isAvailable }` | Emitted when a vehicle is booked or returned. Updates availability badge in real-time. |
| `booking:created` | Server | `{ message, rentalId, carId }` | Emitted when a customer confirms a booking. |
| `booking:statusUpdated` | Server | `{ rentalId, status }` | Emitted when admin updates booking lifecycle. |

---

## 🚀 Getting Started & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [MongoDB](https://www.mongodb.com/) (Local Community Server or MongoDB Atlas cluster)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/harishkumavat/rentwheels.git
cd rentwheels
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/rentwheels

# JWT Configuration
JWT_SECRET=rentwheels_super_secret_jwt_key_2024
JWT_EXPIRES_IN=7d

# Server Port
PORT=5001
```

### 3. Seed the Database
Populate initial cars, admin credentials, demo user, and sample policies:
```bash
npm run seed
```

### 4. Run the Application
```bash
# Production mode
npm start

# Development mode (with nodemon auto-restart)
npm run dev
```

Open your browser at **http://localhost:5001** to view the app!

---

## 🔑 Pre-Seeded Credentials

Running `npm run seed` creates these ready-to-test accounts:

| Portal | Username | Password | Role | Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| **👑 Admin Portal** | `admin` | `admin123` | `admin` | Fleet CRUD, Insurance CRUD, Rentals approval |
| **👤 Customer Portal** | `johndoe` | `user123` | `user` | Browse cars, Book vehicles, View my bookings |

---

## 📚 Interactive Swagger API Documentation

Interactive OpenAPI 3.0 documentation is built into the server:

👉 **URL**: **http://localhost:5001/api-docs**

From the Swagger interface, you can:
- Explore request schemas and query parameters for every endpoint.
- Authenticate requests using the **Authorize** button with a JWT token.
- Execute live `GET`, `POST`, `PUT`, and `DELETE` requests directly from your browser.

---

## 🖥 Side-by-Side Live Demo Guide

To demonstrate the real-time capabilities of Socket.io during project review:

1. **Open Two Browser Windows side-by-side**:
   - **Left Window**: Open `http://localhost:5001` → Click **Admin Login** → Sign in as `admin` / `admin123`.
   - **Right Window**: Open `http://localhost:5001` → Leave on the public Fleet homepage (or login as `johndoe`).
2. **Add a Vehicle in Real-Time**:
   - In the **Left Window (Admin)**, click **+ Add Car** on the Fleet tab.
   - Enter details (e.g., *Porsche 911*, *2024*, *Coupe*, *₹2500/day*).
   - Click **Add Car**.
3. **Observe Instant WebSocket Update**:
   - In the **Right Window (Customer)**, the new vehicle will **instantly render in the grid** without touching the keyboard or refreshing the page.
   - A real-time toast alert will appear: `🚗 Porsche 911 added to fleet!`.

---

## ☁️ Deployment Guide (Render / Heroku)

### Deploying to Render
1. Push your repository to GitHub.
2. Go to [render.com](https://render.com) → **New Web Service**.
3. Connect your GitHub repo.
4. Set the Build and Start commands:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. In **Environment Variables**, add:
   - `MONGO_URI`: Your MongoDB Atlas URI (`mongodb+srv://...`)
   - `JWT_SECRET`: A secure secret string
   - `JWT_EXPIRES_IN`: `7d`
   - `PORT`: `5001`
6. Click **Deploy**. Your API and frontend will be live on your `.onrender.com` domain!

---

## ✅ Deliverables Checklist

- [x] **REST API**: Modular routes and controllers for Auth, Cars, Rentals, Insurance, and Admin.
- [x] **MongoDB & Mongoose**: Full schema definitions, relations, and timestamps.
- [x] **Role-Based Authorization**: JWT authentication with user and admin access levels.
- [x] **WebSockets**: Socket.io server broadcasting availability changes and fleet events.
- [x] **Interactive Documentation**: Embedded OpenAPI 3.0 / Swagger UI at `/api-docs`.
- [x] **Database Seeder**: `seed.js` script with complete test dataset.
- [x] **Production Readme**: Detailed setup instructions, architectural diagrams, and endpoint specs.

---

## 👨‍💻 Author

- **Harish Kumavat**
- B.Tech Computer Science Engineering  
- *Backend Development Case Study 30: Car Rental Service*
