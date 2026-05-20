# ⚡ ClickLeads - SaaS Multi-Tenant Premium CRM

ClickLeads is a high-performance, premium MERN stack CRM engineered for modern enterprises. It features **Column-Based SaaS Multi-Tenant Isolation (Approach 1)**, interactive sales dashboard analytics, automated smart duplicate lead grouping, bulk CSV ingestion/export tools, and a dynamic Light & Dark branding system utilizing advanced Tailwind CSS v4 custom variables.

---

## ✨ Features

- **🔒 Column-Based SaaS Multi-Tenant Isolation:** Secure data partitioning at the database, router, and controller layers. Admins manage and view data scoped strictly to their corporate workspace (Organization), including leads assigned to their associated Sales Representatives.
- **🎨 Premium Dynamic Theme System:** Brand-aligned Light and Dark toggles with seamless color-fade transition triggers. Implemented via high-contrast Tailwind CSS v4 custom variable mappings to prevent unreadable text on bright backgrounds globally.
- **📊 Real-time Metrics Dashboard:** Aggregated lead analytics, source distributions, sales pipeline charts, and chronological team activity logs.
- **👯 Smart Lead Deduplication:** Runs real-time case-insensitive, whitespace-trimmed checks across email and name matching structures. Restricts duplicate merges strictly to matching leads in the same corporate workspace.
- **📥 Bulk Importers & Exporters:** High-capacity CSV lead table generator and fast JSON ingestion engines.
- **🛡️ Type-Safe Middleware & Zod Validation:** Fully type-safe controllers, Mongoose schemas, and express request layers backed by rigorous schemas preventing schema pollution or bad input structures.

---

## 🛠️ Tech Stack

### Frontend UI Client
- **Core:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS v4 (Glassmorphism & harmonized dark tones)
- **State Management:** Zustand (reactive local notifications and theme caching)
- **Routing & Networking:** React Router DOM v6, Axios

### Backend REST API Server
- **Runtime:** Node.js, TypeScript, Express, `ts-node`
- **Database:** MongoDB, Mongoose (compound indexes, reference populates)
- **Security & Tokens:** JSON Web Tokens (stateless scopes), BcryptJS (12-round hashing)
- **Logging:** Winston logger, Morgan HTTP request auditor
- **Validation:** Zod schemas

---

## ⚡ Quick Start & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) (running instance)
- [pnpm](https://pnpm.io/) or `npm` package manager

### 1. Backend Server Setup

Navigate to the `backend` workspace directory:
```bash
cd backend
```

Create a `.env` file or verify existing variables:
```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/crm-tenant-db
JWT_SECRET=your_jwt_secret_key
REFRESH_TOKEN_SECRET=your_refresh_token_secret_key
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d
FRONTEND_ORIGIN=http://localhost:5173
```

Install packages and boot the server in development mode:
```bash
pnpm install
pnpm run dev
```

### 2. Database Cleanup & Mock Seeding

To clean the database of all existing records and seed two completely isolated workspace tenants (Acme Corp & Stark Tech):
```bash
# Wipe all collections cleanly
npx ts-node src/scripts/clean-db.ts

# Ingest mock users (hashed passwords), leads, scoring logs, and templates
npx ts-node src/scripts/seed-db.ts
```

### 3. Frontend Client Setup

Navigate to the `frontend/my-app` client directory:
```bash
cd ../frontend/my-app
```

Install packages and launch the Vite development server:
```bash
pnpm install
pnpm run dev
```

The application is now accessible at: **`http://localhost:5173`**

---

## 🔒 Out-of-the-Box Mock Workspace Credentials

The seeder initializes two distinct isolated corporate environments. All passwords are set to a simple helper string: `password123`.

### 1. Acme Corporation Workspace (Tenant A)
- **Administrator Owner:** `acme.admin@clickleads.com`
- **Sales Representative:** `acme.sales@clickleads.com`
- **Leads Scoped:** 4 Leads (Alice Vance, Bob Miller, Charlie Cox, Diana Prince)

### 2. Stark Tech Workspace (Tenant B)
- **Administrator Owner:** `stark.admin@clickleads.com`
- **Sales Representative:** `stark.sales@clickleads.com`
- **Leads Scoped:** 4 Leads (Tony Stark, Pepper Potts, Happy Hogan, Bruce Banner)

---

## 📂 Backend Architecture Maps

```
backend/src/
├── config/           # Database, environment variables, and logger settings
├── constants/        # System-wide enum maps
├── controllers/      # Request handlers passing scoped requests to services
├── errors/           # Custom API and error classes
├── interfaces/       # Typescript typings (scoping JWT payloads)
├── middleware/       # Stateless auth, CORS validation, and error log traps
├── models/           # Scoped Mongoose schemas (Organization, User, Lead)
├── routes/           # REST endpoints
├── scripts/          # Cleanup and database seed scripts
├── services/         # Core business logic engines (Deduplication, Scoring)
├── types/            # Express request overrides
└── validators/       # Rigorous Zod input schemas
```
