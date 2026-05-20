# ⚡ ClickLeads - AI-Powered Multi-Tenant Premium CRM

ClickLeads is a high-performance, premium MERN stack CRM engineered for modern enterprises. It features **Column-Based SaaS Multi-Tenant Isolation**, interactive sales dashboards, automated smart duplicate lead grouping, bulk CSV ingestion, and a powerful **AI Sales Copilot** designed to supercharge outbound email campaigns.

The platform boasts a dynamic Light & Dark branding system utilizing advanced Tailwind CSS v4 custom variables for a premium, glassmorphism-inspired aesthetic.

---

## ✨ Key Features

- **🤖 AI Sales Copilot (Powered by Groq & Llama-3):** Generates highly personalized, context-aware HTML email drafts instantly by analyzing a lead's profile data and historical timeline activity.
- **✉️ Unified Email Composer with Live Render:** A state-of-the-art split-pane email editor that allows sales reps to write raw HTML or edit AI drafts while simultaneously previewing exactly how the email will look in the recipient's inbox.
- **🔒 Column-Based SaaS Multi-Tenant Isolation:** Secure data partitioning at the database, router, and controller layers. Admins and Sales Reps manage and view data scoped strictly to their corporate workspace (Organization).
- **📈 Advanced Activity Tracking & Scoring:** Every interaction (emails sent, opened, clicked) is securely logged in the timeline. Mock event simulators are included for testing engagement workflows.
- **🕸️ Score Influencer Graph:** A dynamic visualization engine that maps out the weighted engagement metrics actively contributing to a lead's overall score.
- **🎨 Premium Dynamic Theme System:** Brand-aligned Light and Dark toggles with seamless color-fade transitions. Implemented via high-contrast Tailwind CSS v4 custom variable mappings.
- **🚀 Resilient Global Networking:** Built-in Axios interceptors intelligently detect and gracefully handle server hibernation (cold starts) on free-tier hosting (like Render) with beautiful UI toast warnings instead of failing.
- **👯 Smart Lead Deduplication:** Runs real-time case-insensitive checks across email and name matching structures.
- **📥 Bulk Importers & Exporters:** High-capacity CSV lead table generator and fast JSON ingestion engines.

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
- **AI Integration:** Groq API (Llama-3 LLM) for lightning-fast text generation
- **Security & Tokens:** JSON Web Tokens (stateless scopes), BcryptJS (12-round hashing)
- **Logging & Validation:** Winston, Morgan, and Zod schemas

---

## ⚡ Quick Start & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) (running instance)
- [pnpm](https://pnpm.io/) or `npm` package manager
- **Groq API Key** (Required for the AI Copilot features)

### 1. Backend Server Setup

Navigate to the `backend` workspace directory:
```bash
cd backend
```

Create a `.env` file and populate it with your credentials:
```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/crm-tenant-db
JWT_SECRET=your_jwt_secret_key
REFRESH_TOKEN_SECRET=your_refresh_token_secret_key
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d
FRONTEND_ORIGIN=http://localhost:5173

# AI Copilot Integration
GROQ_API_KEY=your_groq_api_key_here
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

# Ingest mock users, leads, scoring logs, and starter email templates
npx ts-node src/scripts/seed-db.ts
```

### 3. Frontend Client Setup

Navigate to the `frontend/my-app` client directory:
```bash
cd ../frontend/my-app
```

Create a `.env` file for the frontend:
```env
VITE_API_URL=http://localhost:4000/api
```

Install packages and launch the Vite development server:
```bash
pnpm install
pnpm run dev
```

The application is now accessible at: **`http://localhost:5173`**

---

## 🔒 Out-of-the-Box Mock Workspace Credentials

The seeder initializes two distinct isolated corporate environments. All passwords are set to: `password123`.

### 1. Acme Corporation Workspace (Tenant A)
- **Administrator Owner:** `acme.admin@clickleads.com`
- **Sales Representative:** `acme.sales@clickleads.com`
- **Leads Scoped:** 4 Leads (Alice Vance, Bob Miller, Charlie Cox, Diana Prince)

### 2. Stark Tech Workspace (Tenant B)
- **Administrator Owner:** `stark.admin@clickleads.com`
- **Sales Representative:** `stark.sales@clickleads.com`
- **Leads Scoped:** 4 Leads (Tony Stark, Pepper Potts, Happy Hogan, Bruce Banner)

---

## 📂 Architecture & Deployment Notes

- **API Health Checks:** The backend includes a native `GET /api/health` and `GET /health` route specifically designed for services like UptimeRobot to ping the app and prevent server hibernation on free tiers (like Render).
- **Multi-Tenant Security:** The `$or` query pattern ensures that a Sales Representative only sees leads assigned to them or created by them, while Admins have full oversight of their entire organization's leads. Admins cannot view data across organizations.
