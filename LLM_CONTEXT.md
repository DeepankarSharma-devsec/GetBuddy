# GetBuddy - Project Context & Documentation

This document provides a comprehensive overview of the **GetBuddy** application for LLMs and developers to understand its architecture, features, and technical stack.

## 1. Project Overview
**GetBuddy** is a social marketplace platform that connects users with "Buddies" (Hosts) for various activities. Features include event discovery, listing management for hosts, a booking/payment system, and an administrative dashboard for platform oversight.

## 2. Technical Stack
- **Backend**: Python with **FastAPI**, **SQLAlchemy** (ORM), and **SQLite** (Database).
- **Frontend (Web)**: **React** (v18+), **Vite**, **TypeScript**, **Vanilla CSS**.
- **Mobile**: **React Native**, **Expo**, **TypeScript**.
- **Auth**: OAuth2 with JWT (JSON Web Tokens).

## 3. Project Structure
```text
GetBuddy/
├── backend/                # FastAPI Application
│   ├── app/
│   │   ├── main.py         # Entry point & API Routes
│   │   ├── models.py       # SQLAlchemy database schemas
│   │   ├── schemas.py      # Pydantic models for request/response
│   │   ├── auth.py         # JWT & Password hashing logic
│   │   └── database.py     # DB connection & engine
│   ├── seed.py             # Mock data generation script
│   └── getbuddy.db         # SQLite data file (local dev)
├── web/                    # React Web Application
│   ├── src/
│   │   ├── pages/          # Core views (Landing, Admin, Host, etc.)
│   │   ├── components/     # Reusable UI components
│   │   ├── App.tsx         # Main router and layout
│   │   └── main.tsx        # React entry point
│   └── vite.config.ts      # Vite configuration
├── mobile/                 # React Native / Expo Application
│   ├── app/                # Expo Router structure (tabs, auth, listing)
│   ├── components/         # Mobile-specific UI elements
│   ├── src/                # Shared logic & API helpers
│   └── App.js              # Expo entry point
└── LLM_CONTEXT.md          # This documentation file
```

## 4. Database Schema (Core Models)
- **User**: Base account (Admin, Host, or regular User).
- **HostProfile**: Extended profile for users who want to host events/sessions.
- **Event**: A listing created by a Host (1:1, Group, Online, or Offline).
- **Booking**: A reservation record connecting a User and an Event.
- **Transaction**: Payment record including gross amount, platform commission (15%), and host payout.
- **Review**: User feedback and ratings for hosts/events.

## 5. Key Application Flows
### A. User Registration & Auth
1. User registers via `/register` (emails stored lowercase; password min 8 chars).
2. The email matching the `ADMIN_EMAIL` env var is assigned **is_admin = True** on registration.
3. Login via `/login` (case-insensitive email) returns a JWT and user status (`is_admin`, `is_host`).

### B. Becoming a Host
1. User requests phone verification (`/host/request-verification`).
2. OTP is mocked (default `123456`, overridable via `OTP_CODE` env var).
3. Verification (`/host/verify-phone`) promotes the user to **is_host = True** and creates a `HostProfile`.

### C. Hosting & Listing
1. Hosts create events via `POST /events`.
2. Events have `price`, `start_time`, `max_participants`, and `mode` (Online/Offline).

### D. Booking & Payments
1. Users book events via `POST /bookings`.
2. System prevents duplicate bookings and enforces `max_participants` capacity.
3. **Transaction Logic** (pricing is per hour: gross = hourly `price` × `duration_minutes`/60):
   - Platform takes a **15% commission**.
   - **85%** is added to the host's `total_earnings`.
   - Transactions are initially marked as `payout_status = PENDING`.

## 6. Admin Functionality
The platform includes a robust Admin Dashboard (`/admin` routes) for monitoring:
- **Metrics**: Total users, hosts, listings, bookings, and platform revenue.
- **Management**: Tables for Users, Hosts, Listings, and Transactions.
- **Analytics**: Mock data for visual trends (bookings by type, monthly revenue).

## 7. Development Notes
- **API Base URL**: Usually `http://localhost:8000`.
- **CORS**: Configured to allow all origins during development.
- **Persistence**: Data is persisted in `backend/getbuddy.db`.
- **Seed Data**: Run `python backend/seed.py` to populate the environment for testing.

---
*Created on: 2026-04-24*
