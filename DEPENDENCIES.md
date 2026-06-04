# AgriGate - Project Dependencies Documentation

## Overview

This document lists all dependencies required to run the AgriGate project. The project consists of two main parts: Backend (Node.js/Express) and Frontend (React with Vite).

---

## Prerequisites

Before installing any dependencies, ensure you have the following installed on your system:

- **Node.js** (version 16.x or higher recommended)
- **npm** (comes with Node.js) or **yarn**
- **MongoDB** (for database operations)

---

## Backend Dependencies

The Backend is built with Node.js and Express.js. All backend dependencies are listed in the root `package.json`.

### Production Dependencies

| Package                     | Version      | Purpose                                                |
| --------------------------- | ------------ | ------------------------------------------------------ |
| **express**                 | ^5.1.0       | Web framework for Node.js                              |
| **mongoose**                | ^8.18.1      | MongoDB Object Data Modeling (ODM)                     |
| **bcryptjs**                | ^2.4.3       | Password hashing and encryption                        |
| **jsonwebtoken**            | ^9.0.2       | JWT token generation and validation for authentication |
| **socket.io**               | ^4.8.1       | Real-time bidirectional communication (WebSockets)     |
| **cors**                    | ^2.8.5       | Cross-Origin Resource Sharing middleware               |
| **cookie-parser**           | ^1.4.6       | Cookie parsing middleware                              |
| **multer**                  | ^1.4.5-lts.1 | File upload handling middleware                        |
| **dotenv**                  | ^17.2.2      | Environment variable management                        |
| **express-async-handler**   | ^1.2.0       | Async error handling for Express                       |
| **i18next**                 | ^25.6.0      | Internationalization framework                         |
| **i18next-http-middleware** | ^3.8.1       | i18next middleware for Express                         |

### Development Dependencies

| Package     | Version | Purpose                                                |
| ----------- | ------- | ------------------------------------------------------ |
| **nodemon** | ^3.1.10 | Auto-restart server on file changes (development only) |

### Installation

```bash
cd c:\Users\sanja\OneDrive\Desktop\AgriGate
npm install
```

---

## Frontend Dependencies

The Frontend is built with React and Vite. All frontend dependencies are listed in `Frontend/package.json`.

### Production Dependencies

| Package                   | Version  | Purpose                                      |
| ------------------------- | -------- | -------------------------------------------- |
| **react**                 | ^18.3.1  | React library                                |
| **react-dom**             | ^18.3.1  | React DOM rendering                          |
| **react-router-dom**      | ^7.9.1   | Client-side routing                          |
| **socket.io-client**      | ^4.8.1   | WebSocket client for real-time communication |
| **bootstrap**             | ^5.3.8   | CSS framework                                |
| **react-bootstrap**       | ^2.10.10 | Bootstrap components as React components     |
| **bootstrap-icons**       | ^1.13.1  | Bootstrap icon set                           |
| **react-bootstrap-icons** | ^1.11.6  | Bootstrap icons as React components          |
| **react-icons**           | ^5.5.0   | Popular icon library                         |
| **leaflet**               | ^1.9.4   | Mapping library (for Google Maps tracking)   |
| **react-leaflet**         | ^4.2.1   | Leaflet integration for React                |
| **react-toastify**        | ^11.0.5  | Toast notifications                          |
| **i18next**               | ^25.6.0  | Internationalization framework               |
| **react-i18next**         | ^16.0.1  | i18next integration for React                |

### Development Dependencies

| Package                         | Version     | Purpose                              |
| ------------------------------- | ----------- | ------------------------------------ |
| **vite**                        | ^5.4.2      | Build tool and dev server            |
| **@vitejs/plugin-react**        | ^4.3.1      | React plugin for Vite                |
| **eslint**                      | ^9.9.1      | Code linting                         |
| **@eslint/js**                  | ^9.9.1      | ESLint JavaScript configuration      |
| **eslint-plugin-react**         | ^7.35.0     | React-specific ESLint rules          |
| **eslint-plugin-react-hooks**   | ^5.1.0-rc.0 | ESLint rules for React Hooks         |
| **eslint-plugin-react-refresh** | ^0.4.11     | ESLint rules for React Fast Refresh  |
| **@types/react**                | ^18.3.5     | TypeScript types for React           |
| **@types/react-dom**            | ^18.3.0     | TypeScript types for React DOM       |
| **globals**                     | ^15.9.0     | Global JavaScript objects for ESLint |
| **baseline-browser-mapping**    | ^2.9.19     | Browser configuration mapping        |

### Installation

```bash
cd c:\Users\sanja\OneDrive\Desktop\AgriGate\Frontend
npm install
```

---

## Complete Installation Steps

### Step 1: Install Backend Dependencies

```bash
cd c:\Users\sanja\OneDrive\Desktop\AgriGate
npm install
```

### Step 2: Install Frontend Dependencies

```bash
cd Frontend
npm install
cd ..
```

### Step 3: Setup Environment Variables

Create a `.env` file in the root directory with necessary configuration:

```
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=5000
NODE_ENV=development
```

### Step 4: Start the Development Servers

**Terminal 1 - Backend Server:**

```bash
npm run dev
```

**Terminal 2 - Frontend Development Server:**

```bash
cd Frontend
npm run dev
```

---

## Summary Statistics

### Backend

- **Total Dependencies:** 12 production + 1 development = 13 total
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose)
- **Authentication:** JWT + bcryptjs
- **Real-time:** Socket.io

### Frontend

- **Total Dependencies:** 14 production + 11 development = 25 total
- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Bootstrap 5
- **Routing:** React Router v7
- **Maps:** Leaflet + React Leaflet
- **Real-time:** Socket.io Client

### Total Project

- **Total Dependencies:** 26 production + 12 development = 38 total

---

## Key Features Enabled by Dependencies

1. **Authentication & Security** - JWT, bcryptjs, cookie-parser
2. **Real-time Features** - Socket.io, Socket.io-client
3. **Data Persistence** - MongoDB, Mongoose
4. **File Uploads** - Multer
5. **Cross-Origin Requests** - CORS
6. **Maps & Location Tracking** - Leaflet, React Leaflet
7. **UI Components** - Bootstrap, React Bootstrap
8. **Internationalization** - i18next (English/Multilingual Support)
9. **Notifications** - React Toastify
10. **Development Tools** - Nodemon, Vite, ESLint

---

## Troubleshooting

### Common Installation Issues

**Issue:** npm ERR! code ERESOLVE unable to resolve dependency tree
**Solution:**

```bash
npm install --legacy-peer-deps
```

**Issue:** MongoDB connection errors
**Solution:** Ensure MongoDB is running and the connection string is correct in `.env`

**Issue:** Port already in use
**Solution:** Change the PORT in `.env` file or kill the process using the port

---

## Updating Dependencies

To check for outdated packages:

```bash
npm outdated
```

To update packages:

```bash
npm update
```

---

## Additional Notes

- The project uses **ES Modules** (`"type": "module"`)
- **Nodemon** is configured to auto-restart the backend during development
- **Vite** provides fast HMR (Hot Module Replacement) for React development
- **ESLint** is configured to maintain code quality standards
- Both Backend and Frontend support **Internationalization (i18n)**
