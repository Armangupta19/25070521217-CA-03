# SportSync — Multi-Sport Tournament Management Platform

A modern, full-stack, real-time sports tournament management platform for universities, collegiate athletic departments, and competitive leagues. Built with **React 18 + Vite**, **Node.js + Express**, **Socket.io**, and **MongoDB**.

---

## 🏆 Key Features

- **Multi-Sport Engine**: Supports Football, Basketball, Cricket, Badminton, Volleyball, and Table Tennis with sport-specific rules and scoring configs.
- **Two Complete Tournament Formats**:
  1. **Knockout / Single Elimination**: Interactive visual tree bracket with automatic winner advancement to future rounds upon score recording.
  2. **League / Round-Robin**: Automated round-robin matchday generator (Berger polygon method) with live standings (P, W, D, L, GF, GA, GD, Points, and Form guide).
- **Authentication & Security (RBAC)**:
  - Email or Username login with "Remember me" option.
  - Password strength meter (Weak/Medium/Strong) & show/hide eye toggle.
  - Express-validator rules (min 8 chars, 1 uppercase, 1 number, 1 special character).
  - Forgot password & reset password workflow.
  - Helmet security headers and login rate limiting.
- **Real-Time Live Updates**:
  - Socket.io integration broadcasting live score changes and notifications across browser sessions without refreshing.
  - Real-time in-app notification bell with unread counter badges and toast alerts.
- **Visual Analytics**:
  - Recharts dashboard for administrators: sport distribution pie chart, matches progress bar chart, and registration trends.
  - Administrative audit trail with activity logs.
- **Tools & Sharing**:
  - **QR Code Sharing**: Instant mobile QR code modal for scanning and sharing tournament URLs.
  - **Export PDF & CSV**: One-click download of fixtures and standings in formatted PDF or CSV spreadsheets.
  - **Fixture Calendar View**: Chronological month/schedule grid of all fixtures across all sports.
  - **Campus Leaderboard**: Top winning teams and popular tournaments with podium medals (🥇 🥈 🥉).
  - **Match Discussion**: Live comment threads for athletes and fans on tournament fixtures.
  - **Favourites**: Bookmark favourite tournaments with a heart toggle and view them in your Profile.
  - **Theme Switcher**: Instant toggle between Dark (`#0B1220` with `#B8F34A` neon lime) and Light theme.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, React Router 7, Recharts, Socket.io Client, jsPDF, qrcode.react, react-hot-toast, Lucide Icons, Vanilla CSS |
| **Backend** | Node.js, Express.js, Socket.io, Mongoose, JWT, bcryptjs, express-validator, helmet, express-rate-limit, multer |
| **Database** | MongoDB (`mongodb://127.0.0.1:27017/sportsync` or MongoDB Atlas) |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js 18+** installed
- **MongoDB** running locally on default port `27017` or a MongoDB Atlas URI in `backend/.env`

### 1. Database Seeding & Backend
```bash
cd backend
npm install
node scripts/seed.js    # Seeds 6 tournaments, demo accounts, teams, matches, comments, and notifications
node server.js          # Starts backend server on http://localhost:5000
```

### 2. Frontend Application
```bash
cd frontend
npm install
npm run dev             # Starts Vite dev server on http://localhost:5173
```

Open your browser to: **`http://localhost:5173`**

---

## 👥 Demo Accounts (Password: `Demo@1234`)

All demo accounts use the standardized password **`Demo@1234`**:

| Role | Username | Email | Password | Scope & Description |
|---|---|---|---|---|
| **Administrator** | `admin` | `admin@sportsync.com` | `Demo@1234` | Full tournament, user, fixture, audit log, and scorekeeping control |
| **Team Captain** | `captain.alex` | `captain.alex@sportsync.com` | `Demo@1234` | Captain of Thunderbolts FC, Metro Hawks, Net Ninjas |
| **Team Captain** | `captain.sarah` | `captain.sarah@sportsync.com` | `Demo@1234` | Captain of Apex Strikers, Solar Flares, Spike Storm |
| **Team Captain** | `captain.rohit` | `captain.rohit@sportsync.com` | `Demo@1234` | Captain of Royal Challengers Campus & Blaze City |
| **Team Captain** | `captain.marcus` | `captain.marcus@sportsync.com` | `Demo@1234` | Captain of Cyber Titans & Spin Masters |
| **Public Viewer** | `viewer` | `viewer@sportsync.com` | `Demo@1234` | Public browsing, brackets, live scores, and commenting |

*(Tip: You can use the **Demo Switcher** pill in the top navigation bar to switch between Admin, Captain, and Viewer instantly with one click!)*

---

## 📡 REST API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register captain or viewer account (with express-validator)
- `POST /api/auth/login` — Sign in via email OR username (rate limited)
- `POST /api/auth/forgot-password` — Generate password reset token
- `POST /api/auth/reset-password/:token` — Reset password with token
- `POST /api/auth/logout` — End user session
- `GET /api/auth/me` — Get current profile with favourites
- `PUT /api/auth/profile` — Update name, username, phone, avatar
- `PUT /api/auth/password` — Change password

### Tournaments (`/api/tournaments`)
- `GET /api/tournaments` — List tournaments with sport, format, and status filters
- `GET /api/tournaments/:id` — Tournament details and registered teams
- `POST /api/tournaments` — Create tournament *(Admin)*
- `PUT /api/tournaments/:id` — Update tournament *(Admin)*
- `DELETE /api/tournaments/:id` — Delete tournament *(Admin)*
- `POST /api/tournaments/:id/favourite` — Toggle tournament favourite
- `POST /api/tournaments/:id/register` — Register team *(Captain)*
- `PUT /api/tournaments/:id/teams/:teamId/status` — Approve/Reject team *(Admin, sends notification)*
- `POST /api/tournaments/:id/fixtures/generate` — Generate bracket/league fixtures *(Admin, emits socket event)*
- `GET /api/tournaments/:id/standings` — Dynamic standings table or knockout bracket summary

### Matches (`/api/matches`)
- `GET /api/matches` — Query fixtures by tournament, round, or team
- `GET /api/matches/:id` — Get match details
- `PUT /api/matches/:id/score` — Enter score, determine winner & auto-advance bracket *(Admin, emits socket event)*
- `PUT /api/matches/:id/schedule` — Reschedule match date or venue *(Admin)*

### Notifications & Comments (`/api/notifications`, `/api/comments`)
- `GET /api/notifications` — Current user's notifications
- `PUT /api/notifications/:id/read` — Mark notification as read
- `PUT /api/notifications/read-all` — Mark all notifications as read
- `DELETE /api/notifications/:id` — Delete notification
- `GET /api/comments?match=:id` — Get comments for match
- `POST /api/comments` — Post comment on match *(emits socket event)*
- `DELETE /api/comments/:id` — Delete comment

### Analytics & Stats (`/api/stats`, `/api/activity-logs`)
- `GET /api/stats/overview` — Platform KPIs *(Admin)*
- `GET /api/stats/charts` — Aggregated chart datasets for Recharts *(Admin)*
- `GET /api/stats/leaderboard` — Team win rankings and popular tournaments
- `GET /api/activity-logs` — Administrative audit log trail *(Admin)*
- `POST /api/upload` — Multer image file upload
