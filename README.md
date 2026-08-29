# EV Charging Station Management System — Backend

Backend REST API for an EV charging station management platform, covering station discovery, reservations, charging sessions, payments, authentication, authorization, and analytics.

**[Live Frontend Demo](https://swp-391-nguyn-duy-congs-projects.vercel.app/)** · [Frontend Repository](../EV-Charging-Station-Management-System-FE) · [Architecture](./docs/ARCHITECTURE.md)

> Portfolio project focused on translating business workflows into a structured backend system.

## My Contribution

I worked across the system rather than only implementing isolated endpoints:

- Led system-level decisions and backend structure
- Defined and refined core business rules
- Designed the database model and data relationships
- Implemented REST APIs and application services
- Implemented authentication and role-based authorization
- Integrated backend flows with the frontend
- Worked on reservation, charging-session, payment, and analytics workflows

## Core Workflows

### Reservation

```text
User
  → Discover station
  → Check availability
  → Create reservation
  → Manage reservation status
  → Start charging session
```

### Authorization

```text
Request
  → Bearer token
  → Authentication middleware
  → User + role lookup
  → Role / ownership check
  → Protected route
```

The current implementation uses demo bearer tokens for the portfolio environment. Real JWT verification is documented as a future improvement rather than being claimed as implemented.

## Key Features

| Area | Capabilities |
| --- | --- |
| Stations | Listing, details, search, availability management |
| Reservations | Create, view, update status, cancel |
| Charging Sessions | Start sessions from reservations or directly |
| Payments | Payment-session and payment-history workflows |
| Authentication | Registration, login, verification, password flows |
| Authorization | Role-based access control and ownership checks |
| Analytics | Reservation, station, revenue, and user metrics |
| Search | Location and availability-related filtering |

## Roles

The backend maps database roles into three application roles:

- **Customer** — use charging services and manage owned data
- **Staff** — access staff-level operations and metrics
- **Admin** — manage stations and administrative operations

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL via Supabase
- **Authentication / Data Access:** Supabase
- **Authentication middleware:** Bearer-token based demo authentication
- **Security:** bcrypt, role-based authorization, ownership checks
- **Modules:** ES Modules

## Architecture

```text
src/
├── config/          # Application configuration
├── controllers/     # Request handling
├── database/        # Database utilities
├── middleware/      # Authentication and authorization
├── models/          # Data models
├── routes/          # REST API routes
├── scripts/         # Setup / utility scripts
├── services/        # Business and application services
├── supabase/        # Supabase integration
└── server.js        # Application entry point
```

Detailed design notes are available in [`docs/`](./docs/), including authorization and database documentation.

## API Areas

| Area | Examples |
| --- | --- |
| Authentication | Register, login, logout, profile, verification |
| Stations | List, detail, search, availability |
| Reservations | Create, view, update status, cancel |
| Charging Sessions | Start from reservation, direct start |
| Payments | Create session, verification, history |
| Analytics | Overview, reservations, stations, revenue, users |

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a local `.env` file based on `.env.example` and provide your own Supabase configuration.

Never commit credentials or secrets.

### 3. Start the development server

```bash
npm run dev
```

The API runs locally on the configured port.

## Engineering Notes

This project is primarily a portfolio implementation. The most important engineering focus was converting real-world charging-station workflows into explicit application rules, data relationships, protected API routes, and maintainable backend modules.

### Known limitations

- Authentication currently supports the project's demo bearer-token flow; real JWT verification is not yet implemented.
- Automated tests and linting are not configured yet.
- Production infrastructure is outside the scope of this repository.

These limitations are intentionally stated so the repository does not overclaim production readiness.

## Security

- Environment files are excluded from version control.
- Do not commit API keys, database credentials, JWT secrets, or other sensitive values.
- Use HTTPS and real token verification for production deployments.
