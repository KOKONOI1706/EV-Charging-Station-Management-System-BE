# EV Charging Station Management System - Backend API

A comprehensive REST API for managing EV charging stations, reservations, payments, and analytics.

## 🚀 Features

- **Station Management**: CRUD operations for charging stations
- **Reservation System**: Booking and scheduling charging sessions
- **Payment Processing**: Integrated payment handling with multiple providers
- **User Authentication**: Secure user registration and login with Supabase Auth
- **Real-time Analytics**: Comprehensive reporting and analytics
- **Real-time Updates**: WebSocket support for live data

## 🛠️ Tech Stack

- **Node.js** + **Express.js** - Server framework
- **Supabase** - Database and authentication
- **PostgreSQL** - Database engine
- **ESM Modules** - Modern JavaScript modules
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment configuration

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd EV-Charging-Station-Management-System-BE
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configurations:
   ```env
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173

   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Payment Gateway Configuration (Optional)
   STRIPE_SECRET_KEY=your_stripe_secret_key
   PAYOS_CLIENT_ID=your_payos_client_id
   PAYOS_API_KEY=your_payos_api_key
   PAYOS_CHECKSUM_KEY=your_payos_checksum_key
   ```

4. **Database setup**
   
   Run the SQL schema in your Supabase project:
   ```bash
   # The schema is available in ../supabase-setup.sql
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 🌐 API Endpoints

### Base URL
```
http://localhost:3001/api
```

### 🔐 Authentication (`/api/users`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | User login |
| POST | `/logout` | User logout |
| GET | `/profile/:id` | Get user profile |
| PUT | `/profile/:id` | Update user profile |
| POST | `/forgot-password` | Send password reset email |
| POST | `/reset-password` | Reset user password |
| GET | `/verify-session` | Verify user session |

### 🏢 Stations (`/api/stations`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all stations |
| GET | `/:id` | Get station by ID |
| POST | `/search` | Search stations with filters |
| PUT | `/:id/availability` | Update station availability |

### 📅 Reservations (`/api/reservations`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create new reservation |
| GET | `/user/:userId` | Get user's reservations |
| GET | `/:id` | Get reservation by ID |
| PUT | `/:id/status` | Update reservation status |
| DELETE | `/:id` | Cancel reservation |
| GET | `/station/:stationId` | Get station's reservations |

### 💳 Payments (`/api/payments`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/create-session` | Create payment session |
| POST | `/verify` | Verify payment status |
| GET | `/:id` | Get payment details |
| GET | `/reservation/:reservationId` | Get reservation payments |
| POST | `/refund` | Process refund |
| GET | `/user/:userId` | Get user's payment history |

### 📊 Analytics (`/api/analytics`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/overview` | General analytics overview |
| GET | `/reservations` | Reservation analytics |
| GET | `/stations` | Station analytics |
| GET | `/revenue` | Revenue analytics |
| GET | `/users` | User analytics |

## 📝 Example API Usage

### Register a new user
```bash
curl -X POST http://localhost:3001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword",
    "full_name": "John Doe",
    "phone": "+84123456789"
  }'
```

### Get all stations
```bash
curl -X GET http://localhost:3001/api/stations
```

### Search stations
```bash
curl -X POST http://localhost:3001/api/stations/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Hanoi",
    "filters": {
      "availability": true,
      "minPower": 50,
      "maxDistance": 10
    },
    "location": {
      "lat": 21.028511,
      "lng": 105.804817
    }
  }'
```

### Create a reservation
```bash
curl -X POST http://localhost:3001/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-uuid",
    "station_id": "station-uuid",
    "start_time": "2024-01-15T10:00:00Z",
    "end_time": "2024-01-15T12:00:00Z",
    "total_cost": 150000
  }'
```

### Create payment session
```bash
curl -X POST http://localhost:3001/api/payments/create-session \
  -H "Content-Type: application/json" \
  -d '{
    "reservation_id": "reservation-uuid",
    "amount": 150000,
    "currency": "VND",
    "payment_method": "stripe"
  }'
```

## 🔧 Development

### Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Start production server
npm start

# Run tests (if configured)
npm test

# Lint code
npm run lint
```

### Project Structure

```
src/
├── server.js              # Main server file
├── routes/                 # API route handlers
│   ├── users.js           # User authentication routes
│   ├── stations.js        # Station management routes
│   ├── reservations.js    # Reservation handling routes
│   ├── payments.js        # Payment processing routes
│   └── analytics.js       # Analytics and reporting routes
├── middleware/             # Custom middleware (future)
├── controllers/            # Business logic controllers (future)
├── models/                # Data models (future)
└── supabase/
    ├── client.js          # Supabase client configuration
    └── kvStore.js         # Key-value store utilities
```

## 🚦 Health Checks

The API provides health check endpoints:

- **GET `/api/health`** - Basic health check
- **GET `/api/test-db`** - Database connection test

## 🔒 Security Features

- **CORS Protection** - Configured for frontend domain
- **Input Validation** - Request body validation
- **Authentication** - Supabase Auth integration
- **Error Handling** - Comprehensive error responses
- **Rate Limiting** - (Future implementation)

## 📈 Performance

- **Async/Await** - Non-blocking operations
- **Database Optimization** - Efficient queries
- **JSON Compression** - Reduced payload sizes
- **Error Logging** - Comprehensive logging

## 🚀 Deployment

### Production Setup

1. **Environment Variables**
   ```bash
   NODE_ENV=production
   PORT=3001
   FRONTEND_URL=https://your-frontend-domain.com
   # ... other production configs
   ```

2. **Build & Start**
   ```bash
   npm install --production
   npm start
   ```

3. **Process Management** (PM2 recommended)
   ```bash
   npm install -g pm2
   pm2 start src/server.js --name "ev-charging-api"
   pm2 startup
   pm2 save
   ```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
EXPOSE 3001
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Version History

- **v1.0.0** - Initial release with full API functionality
- **v0.9.0** - Beta release with core features
- **v0.8.0** - Alpha release with basic functionality

---

**Built with ❤️ for EV charging infrastructure management**

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