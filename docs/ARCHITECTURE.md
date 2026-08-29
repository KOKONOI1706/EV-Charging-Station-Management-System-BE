# Architecture & Design Notes

## 1. System Boundary

The backend exposes REST APIs for the EV charging application. The main application areas are:

```text
Client Applications
       |
       v
   Express API
       |
       +-------------------+
       |                   |
       v                   v
 Authentication      Business Services
       |                   |
       +---------+---------+
                 |
                 v
            PostgreSQL
             / Supabase
```

## 2. Application Structure

```text
Request
  |
  v
Routes
  |
  v
Middleware
  |---- Authentication
  |---- Authorization / ownership
  |
  v
Controllers
  |
  v
Services
  |
  v
Database / Supabase
```

The repository separates routing, middleware, controllers, services, and database-related code so that request handling and business logic are not concentrated in a single layer.

## 3. Authorization Model

The application maps database roles to three application-level roles:

| Database Role | Application Role | Level |
| --- | --- | ---: |
| Driver | Customer | 0 |
| Station Manager | Staff | 1 |
| Admin | Admin | 2 |

Protected requests follow this sequence:

```text
Authorization: Bearer <token>
          |
          v
    requireAuth
          |
          v
    Load active user
          |
          v
     Map user role
          |
          v
 requireRole / ownership
          |
          v
      Controller
```

Public endpoints can use `optionalAuth` when the request may be either anonymous or authenticated.

## 4. Reservation / Charging Flow

```text
User
  |
  v
Station Discovery
  |
  v
Availability Check
  |
  v
Create Reservation
  |
  v
Reservation Status
  |
  v
Start Charging Session
```

The backend contains separate routes and services for reservations and charging sessions so that the lifecycle of a reservation is not mixed with the charging-session operation itself.

## 5. Payment Boundary

Payment-related operations are kept behind backend routes/services rather than exposing database operations directly to the client.

```text
Client
  |
  v
Payment Request
  |
  v
Backend API
  |
  v
Payment Service / Workflow
  |
  v
Payment Result
  |
  v
Reservation / Session State
```

The exact payment-provider behavior should be treated as implementation-specific to the current project version.

## 6. Design Decisions

### Role-based authorization

Authorization is enforced through middleware instead of duplicating role checks throughout every controller. Ownership checks are also used for user-specific resources.

### Supabase + PostgreSQL

Supabase provides the hosted PostgreSQL data layer and project integration used by the backend. Database access is kept behind application modules rather than being exposed directly to clients.

### Explicit business workflows

The project models station availability, reservations, charging sessions, and role permissions as explicit backend flows. This makes business rules easier to reason about and change than embedding them only in frontend behavior.

## 7. Current Limitations

This repository is a portfolio implementation and should not be presented as production-ready infrastructure.

- Demo bearer-token authentication is currently used; real JWT verification remains a future improvement.
- Automated test coverage is not configured.
- CI/CD and production infrastructure are not part of the current repository scope.
