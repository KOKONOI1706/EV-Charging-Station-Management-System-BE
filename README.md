# EV Charging Station Management System — Backend

Backend REST API for an EV charging station management platform, covering station discovery, reservations, payments, user authentication, and analytics.

## Overview

This project was developed as part of a team project. I contributed across system design, business rules, backend development, database design, and integration with the frontend.

## Key Features

- **Station Management** — Manage charging stations and availability.
- **Reservation Management** — Create, view, update, and cancel charging reservations.
- **Payment Workflows** — Handle payment sessions, verification, refunds, and payment history.
- **Authentication** — User registration, login, session verification, and profile management through Supabase Auth.
- **Analytics** — Reservation, station, revenue, and user analytics endpoints.
- **Search & Filtering** — Search stations using location and availability-related filters.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL via Supabase
- **Authentication:** Supabase Auth
- **Modules:** ESM
- **Other:** CORS, dotenv

## Architecture

```text
src/
├── config/          # Application configuration
├── controllers/     # Request handling and application logic
├── database/        # Database-related utilities
├── middleware/      # Request middleware
├── models/          # Data models
├── routes/          # REST API routes
├── scripts/         # Database/setup scripts
├── services/        # Application services
├── supabase/        # Supabase integration
└── server.js        # Application entry point
```

## Main API Areas

| Area | Examples |
|---|---|
| Authentication | Register, login, logout, profile, session verification |
| Stations | List, detail, search, availability |
| Reservations | Create, view, update status, cancel |
| Payments | Create session, verify, refund, history |
| Analytics | Overview, reservations, stations, revenue, users |

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a local `.env` file based on `.env.example` and provide your own Supabase and payment configuration.

### 3. Start the development server

```bash
npm run dev
```

The API runs locally on the configured port.

## Project Focus

The main engineering focus of this project was translating charging-station business workflows into a working backend system, including reservation, payment, authentication, and role-related application flows.

## Notes

This repository is a portfolio/project implementation and is not intended to expose production credentials or third-party secrets. Do not commit `.env` files or secret keys.
