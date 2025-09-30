# EV Charging Station - Backend

Node.js + Express REST API for the EV Charging Station System.

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variables

## Features

- 🔌 Station management API
- 📅 Booking system API
- 👥 User management API
- 🔐 Authentication endpoints
- 📊 RESTful API design
- 🛡️ Error handling middleware

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
   - Copy `.env` file and update values
   - Set PORT, DATABASE_URL, etc.

3. Start development server:
```bash
npm run dev
```

4. Start production server:
```bash
npm start
```

## API Endpoints

### Health Check
- `GET /api/health` - Check server status

### Stations
- `GET /api/stations` - Get all stations
- `GET /api/stations/:id` - Get station by ID
- `POST /api/stations` - Create new station

### Bookings
- `GET /api/bookings?userId=:id` - Get user bookings
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

### Users
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users/login` - User login
- `POST /api/users/register` - User registration

## Environment Variables

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
DATABASE_URL=your_database_connection_string
JWT_SECRET=your_jwt_secret
```

## Project Structure

```
src/
├── routes/          # API route handlers
├── controllers/     # Business logic
├── models/          # Data models
├── middleware/      # Custom middleware
└── server.js        # Entry point
```

## Development

The server runs with `--watch` flag for automatic restarts on file changes.

Health check available at: `http://localhost:5000/api/health`