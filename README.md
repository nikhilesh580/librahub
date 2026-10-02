# 📚 LibraHub — Library Management System

A full-stack Library Management System with role-based access (Admin, Librarian, Member), book management, borrowing/returning, reservations, fines, and reports.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, Radix UI, React Query |
| Backend | Express.js, TypeScript, Prisma ORM, JWT Authentication |
| Database | PostgreSQL |

## Quick Start (Development)

### Prerequisites
- Node.js 18+
- PostgreSQL (local or [Neon](https://neon.tech) free tier)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/your-username/librahub.git
cd librahub

# 2. Install dependencies
npm run install:all

# 3. Configure environment
cp .env.example server/.env
# Edit server/.env with your PostgreSQL connection string

# 4. Set up database
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 5. Start development servers
npm run dev:server   # Backend on http://localhost:5000
npm run dev:client   # Frontend on http://localhost:5173
```

### Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@library.com | Admin@123 |
| Librarian | librarian1@library.com | Librarian@123 |
| Member | student1@library.com | Student@123 |

## Production Deployment

### Architecture
```
Vercel (Frontend) → Render (Backend API) → Neon (PostgreSQL)
```

### Step 1: Database (Neon)
1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new project and database
3. Copy the connection string

### Step 2: Backend (Render)
1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo, set root directory to `server`
4. Set build command: `npm install && npx prisma generate && npm run build`
5. Set start command: `npx prisma migrate deploy && node dist/index.js`
6. Add environment variables:
   - `DATABASE_URL` = your Neon connection string
   - `JWT_SECRET` = random 64-character string
   - `JWT_REFRESH_SECRET` = random 64-character string
   - `NODE_ENV` = production
   - `CLIENT_URL` = your Vercel URL (e.g. `https://librahub.vercel.app`)
7. After deployment, seed the database:
   ```bash
   # Run from the Render Shell or locally with production DATABASE_URL
   npx prisma db seed
   ```

### Step 3: Frontend (Vercel)
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo, set root directory to `client`
3. Set framework to Vite
4. Add environment variable:
   - `VITE_API_URL` = your Render backend URL + `/api` (e.g. `https://librahub-api.onrender.com/api`)
5. Deploy

### Or: One-Click Render Blueprint
This repo includes a `render.yaml` blueprint for automatic provisioning of the backend + database.

## Environment Variables

### Server (`server/.env`)
| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `JWT_SECRET` | JWT signing secret | ✅ |
| `JWT_REFRESH_SECRET` | Refresh token secret | ✅ |
| `PORT` | Server port (default: 5000) | ❌ |
| `NODE_ENV` | Environment (development/production) | ❌ |
| `CLIENT_URL` | Frontend URL for CORS | ✅ in prod |

### Client (`client/.env`)
| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | ✅ in prod |

## Features
- 📖 Book catalog with search, filter, and detailed views
- 👥 Role-based access: Admin, Librarian, Member
- 📋 Borrowing & returning with due date tracking
- 📅 Reservation queue system
- 💰 Automatic fine calculation for overdue books
- 📊 Dashboard analytics and reports
- 🔔 In-app notifications
- 🔍 Audit logging
- ⚙️ Configurable library settings

## License
MIT
