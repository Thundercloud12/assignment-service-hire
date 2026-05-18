# Smart Leads Dashboard - Implementation Plan

## Project Overview
Build a professional Lead Management Dashboard (MERN) with advanced features including analytics, lead scoring, email integration, activity timelines, and real-time capabilities using Supabase as backend.

---

## Phase 1: Core Setup (Days 1-2)

### 1.1 Project Initialization
- [ ] Create frontend repo with Vite + React + TypeScript
- [ ] Create backend repo with Node.js + Express + TypeScript
- [ ] Setup Supabase project and PostgreSQL database
- [ ] Configure environment variables (.env.example files)
- [ ] Setup Git with meaningful commit structure

### 1.2 TypeScript Configuration
- [ ] Configure tsconfig for strict mode
- [ ] Setup ESLint + Prettier for code consistency
- [ ] Create global type definitions (interfaces, types)
- [ ] Setup pre-commit hooks (husky)

### 1.3 Database Schema (Supabase/PostgreSQL)
```
Tables to create:
├── users
│   ├── id (UUID, PK)
│   ├── email (unique)
│   ├── password_hash
│   ├── full_name
│   ├── role (admin, sales_user)
│   ├── avatar_url
│   ├── created_at
│   └── updated_at
│
├── leads
│   ├── id (UUID, PK)
│   ├── name
│   ├── email (indexed)
│   ├── phone
│   ├── status (new, contacted, qualified, lost)
│   ├── source (website, instagram, referral, other)
│   ├── lead_score (0-100, calculated)
│   ├── assigned_to (FK -> users)
│   ├── created_by (FK -> users)
│   ├── created_at
│   ├── last_contacted_at
│   ├── updated_at
│   └── custom_fields (JSONB)
│
├── lead_activities
│   ├── id (UUID, PK)
│   ├── lead_id (FK)
│   ├── action_type (status_changed, email_sent, note_added, etc)
│   ├── old_value
│   ├── new_value
│   ├── performed_by (FK -> users)
│   ├── metadata (JSONB)
│   ├── created_at
│
├── email_templates
│   ├── id (UUID, PK)
│   ├── name
│   ├── subject
│   ├── body (HTML)
│   ├── variables (JSONB - array of placeholders)
│   ├── created_by (FK -> users)
│   ├── created_at
│   └── updated_at
│
├── email_history
│   ├── id (UUID, PK)
│   ├── lead_id (FK)
│   ├── template_id (FK)
│   ├── recipient_email
│   ├── subject
│   ├── body
│   ├── status (sent, failed, opened, clicked)
│   ├── sent_by (FK -> users)
│   ├── sent_at
│   ├── opened_at
│   └── metadata (JSONB)
│
├── lead_scores
│   ├── id (UUID, PK)
│   ├── lead_id (FK, unique)
│   ├── score (0-100)
│   ├── source_score (20)
│   ├── engagement_score (30)
│   ├── recency_score (50)
│   └── last_calculated_at
│
├── filter_presets
│   ├── id (UUID, PK)
│   ├── user_id (FK)
│   ├── name (e.g., "Hot Leads")
│   ├── filters (JSONB)
│   ├── is_favorite
│   └── created_at
│
└── lead_duplicates
    ├── id (UUID, PK)
    ├── primary_lead_id (FK)
    ├── duplicate_lead_id (FK)
    ├── merge_status (pending, merged, rejected)
    └── merged_at

Indexes:
- leads(email) - for duplicate detection
- leads(status, source, assigned_to) - for filtering
- leads(created_at) - for sorting
- lead_activities(lead_id, created_at)
- email_history(lead_id, status)
```

---

## Phase 2: Authentication & Core Backend (Days 3-4)

### 2.1 Authentication Module
- [ ] User registration with validation
- [ ] Login with JWT tokens
- [ ] Refresh token logic
- [ ] Password hashing with bcrypt
- [ ] Auth middleware
- [ ] Protected routes
- [ ] Role-based route protection

**Key Files:**
- `auth.controller.ts`
- `auth.service.ts`
- `auth.middleware.ts`
- `jwt.utils.ts`
- `password.utils.ts`

### 2.2 Lead CRUD Operations
- [ ] Create lead endpoint with validation
- [ ] Read single lead
- [ ] Update lead with change tracking
- [ ] Delete lead (soft delete recommended)
- [ ] List leads with basic filtering

**Key Files:**
- `lead.controller.ts`
- `lead.service.ts`
- `lead.repository.ts`
- `lead.validation.ts`

### 2.3 Error Handling & Validation
- [ ] Centralized error handler middleware
- [ ] Input validation using zod/joi
- [ ] Custom error classes
- [ ] Consistent error response format

**Key Files:**
- `error.middleware.ts`
- `error.handler.ts`
- `validation.schemas.ts`

---

## Phase 3: Advanced Filtering & Search (Days 5-6)

### 3.1 Backend Filtering
- [ ] Filter by status (single/multiple)
- [ ] Filter by source (single/multiple)
- [ ] Filter by assigned user
- [ ] Filter by date range (created_at)
- [ ] Search by name/email (case-insensitive, fuzzy)
- [ ] Combine multiple filters
- [ ] Sort by: latest, oldest, lead_score, name

**Key Files:**
- `lead.filter.service.ts` (build dynamic queries)
- `query.builder.ts` (reusable query constructor)

**Implementation Details:**
```typescript
// Example: Build filter query
interface FilterParams {
  status?: string[];
  source?: string[];
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'latest' | 'oldest' | 'score';
  page?: number;
  limit?: number;
}

// Should generate SQL:
SELECT * FROM leads 
WHERE status = ANY($1) 
AND source = ANY($2)
AND (name ILIKE $3 OR email ILIKE $3)
AND created_at BETWEEN $4 AND $5
ORDER BY created_at DESC
LIMIT 10 OFFSET 0
```

### 3.2 Frontend Filtering
- [ ] Advanced filter panel component
- [ ] Multi-select dropdowns for status/source
- [ ] Debounced search input (300ms)
- [ ] Date range picker
- [ ] Active filters display with remove option
- [ ] Apply/Reset filters buttons
- [ ] Filter state management (Redux/Zustand)

---

## Phase 4: Pagination & Performance (Days 6-7)

### 4.1 Backend Pagination
- [ ] Implement skip/limit logic
- [ ] Return pagination metadata:
  ```json
  {
    "data": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 250,
      "totalPages": 25,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
  ```
- [ ] Optimize queries with indexes

### 4.2 Frontend Pagination
- [ ] Pagination controls (previous, page numbers, next)
- [ ] Page size selector
- [ ] Jump to page input
- [ ] Total count display
- [ ] Infinite scroll option (bonus)

---

## Phase 5: Lead Scoring System (Days 7-8)

### 5.1 Scoring Algorithm
- [ ] Source scoring (referral: 40pts, website: 20pts, instagram: 10pts, other: 5pts)
- [ ] Engagement scoring:
  - Email opened: 10pts
  - Email clicked: 15pts
  - Contacted: 20pts
  - Note added: 5pts
- [ ] Recency scoring:
  - Created today: 50pts
  - Created this week: 40pts
  - Created this month: 30pts
  - Created 1-3 months ago: 15pts
  - Created >3 months ago: 5pts
- [ ] Total score: (source + engagement + recency) / 3

**Key Files:**
- `lead-score.service.ts` (calculate scores)
- `lead-score.scheduler.ts` (recalculate periodically)

### 5.2 Score Display
- [ ] Score badge on leads list
- [ ] Score color coding (0-30: red, 31-60: yellow, 61-100: green)
- [ ] Score breakdown tooltip
- [ ] Filter/sort by score

---

## Phase 6: Activity Timeline (Days 8-9)

### 6.1 Activity Logging
- [ ] Track all lead changes
- [ ] Log action types:
  - status_changed
  - email_sent
  - note_added
  - assigned_to_user
  - score_updated
- [ ] Store old_value, new_value for changes
- [ ] Store metadata (reason, details)

**Key Files:**
- `activity.service.ts` (create activities)
- `activity.interceptor.ts` (auto-log on changes)

### 6.2 Activity Timeline UI
- [ ] Display timeline on lead detail page
- [ ] Show: action type, user, timestamp, details
- [ ] Filter timeline by action type
- [ ] Search in timeline
- [ ] Pagination for timeline

---

## Phase 7: Email Integration (Days 9-11)

### 7.1 Email Templates
- [ ] Create template CRUD endpoints
- [ ] Template variables ({{firstName}}, {{email}}, etc)
- [ ] Preview template with sample data
- [ ] Built-in templates (follow-up, qualification, etc)

### 7.2 Send Emails
- [ ] Send email to single lead
- [ ] Bulk email to multiple leads
- [ ] Template variable replacement
- [ ] Track email status (sent, failed, opened, clicked)
- [ ] Email retry logic for failed sends

**Key Files:**
- `email.service.ts` (email sending logic)
- `email.template.service.ts` (template management)
- `email.queue.ts` (background jobs)

### 7.3 Email Tracking
- [ ] Track email opens (pixel tracking)
- [ ] Track link clicks
- [ ] Display open/click stats
- [ ] Email history on lead profile

---

## Phase 8: Advanced UI Components (Days 11-13)

### 8.1 Leads List View
- [ ] Responsive table with sorting headers
- [ ] Inline editing for quick updates
- [ ] Multi-select checkboxes for bulk actions
- [ ] Row hover actions (edit, delete, view)
- [ ] Expandable row details
- [ ] Skeleton loaders
- [ ] Empty state with CTA

### 8.2 Kanban Board View
- [ ] Column per status (New, Contacted, Qualified, Lost)
- [ ] Drag-and-drop leads between columns
- [ ] Lead card showing: name, score, source, assigned user
- [ ] Add lead from board
- [ ] Column filters (filter all columns by source/user)
- [ ] Smooth animations

### 8.3 Lead Detail Page
- [ ] Comprehensive lead information
- [ ] Edit form inline
- [ ] Activity timeline
- [ ] Email history
- [ ] Quick actions (send email, change status, assign)
- [ ] Related leads (similar profiles)

### 8.4 Other Components
- [ ] Filter panel with advanced options
- [ ] Responsive navigation
- [ ] User profile dropdown
- [ ] Notification badge
- [ ] Loading states (skeleton screens)
- [ ] Error boundaries

---

## Phase 9: Analytics Dashboard (Days 13-15)

### 9.1 Dashboard Layout
```
┌─ Header with KPIs ────────────────────────┐
│ Total Leads | Qualified | Conversion Rate │
│ Avg Score   | Response Time              │
└──────────────────────────────────────────┘

┌─ Left Column ─────────────────────────┐
│ Leads by Status (Pie Chart)           │
│ Leads by Source (Bar Chart)           │
│ Score Distribution (Histogram)        │
└──────────────────────────────────────┘

┌─ Right Column ────────────────────────┐
│ Leads Over Time (Line Chart)          │
│ Conversion Funnel (Funnel Chart)      │
│ Top Sources by Conversion (Table)     │
└──────────────────────────────────────┘

┌─ Bottom ──────────────────────────────┐
│ User Performance (Table)              │
│ Recent Activities (Timeline)          │
└──────────────────────────────────────┘
```

### 9.2 Metrics to Display
- [ ] Total leads created
- [ ] Leads by status breakdown
- [ ] Leads by source breakdown
- [ ] Average lead score
- [ ] Conversion rate (new → qualified)
- [ ] Average response time
- [ ] Email open rate
- [ ] Leads per user
- [ ] Top performing sources
- [ ] Trends (week/month/quarter)

### 9.3 Charts & Visualizations
- [ ] Pie chart: status distribution
- [ ] Bar chart: source breakdown
- [ ] Line chart: leads over time
- [ ] Funnel chart: conversion pipeline
- [ ] Histogram: score distribution
- [ ] Table: user performance metrics

**Libraries:**
- Recharts or Chart.js for visualizations
- Date-fns for date calculations

---

## Phase 10: Advanced Features (Days 15-17)

### 10.1 Lead Duplication Detection
- [ ] Detect duplicates by email (exact match)
- [ ] Detect by phone (fuzzy match)
- [ ] Detect by name + email (fuzzy)
- [ ] Suggest merges
- [ ] Manual merge functionality
- [ ] Merge history/audit trail

**Key Files:**
- `duplicate-detection.service.ts`
- `merge.service.ts`

### 10.2 Import/Export
- [ ] Import leads from CSV
- [ ] Validate during import:
  - Required fields present
  - Email format validation
  - Duplicate detection
  - Phone format validation
- [ ] Show import preview before committing
- [ ] Bulk export filtered leads to CSV
- [ ] Scheduled export reports (email)

**Key Files:**
- `csv.import.service.ts`
- `csv.export.service.ts`
- `import.validator.ts`

### 10.3 Filter Presets
- [ ] Save custom filter combinations
- [ ] Name presets (e.g., "Hot Leads", "Follow-up Today")
- [ ] Mark as favorite
- [ ] Recently used filters
- [ ] Delete presets
- [ ] Share presets with team (admin feature)

---

## Phase 11: Real-Time Features (Days 17-19)

### 11.1 WebSocket Integration (Socket.io)
- [ ] Real-time lead creation notification
- [ ] Real-time status updates
- [ ] Real-time user presence (who's viewing)
- [ ] Activity feed broadcasts
- [ ] Prevent duplicate edits

**Implementation:**
```typescript
// Server: Broadcasting
io.emit('lead:created', newLead);
io.to(userId).emit('activity:new', activity);

// Client: Listening
socket.on('lead:created', (lead) => {
  updateLeadsCache(lead);
});
```

### 11.2 Notifications
- [ ] In-app notification center
- [ ] Toast notifications for immediate actions
- [ ] Notification badges
- [ ] Read/unread status
- [ ] Notification history

---

## Phase 12: Frontend State Management (Days 19-20)

### 12.1 Choose & Setup State Management
Options:
- **Redux Toolkit** (most scalable, verbose)
- **Zustand** (lightweight, modern)
- **Jotai** (atomic, minimal boilerplate)

**Recommended:** Zustand (best balance for this project)

### 12.2 Store Structure
```
stores/
├── authStore.ts (user, token, login/logout)
├── leadStore.ts (leads list, filters, pagination)
├── filterStore.ts (active filters, presets)
├── notificationStore.ts (toast, notifications)
├── modalStore.ts (modal open/close states)
└── analyticsStore.ts (dashboard data)
```

### 12.3 API Integration
- [ ] Setup Axios/Fetch client with interceptors
- [ ] Centralized API calls
- [ ] Auto-token refresh
- [ ] Error handling
- [ ] Request/response logging (dev)

**Key Files:**
- `api.client.ts`
- `api.interceptors.ts`
- `api.hooks.ts` (React Query or similar)

---

## Phase 13: Testing & Quality (Days 20-21)

### 13.1 Unit Tests
- [ ] Auth service tests
- [ ] Lead service tests
- [ ] Filter service tests
- [ ] Lead score calculation tests
- [ ] Utility function tests
- **Target:** >70% coverage

### 13.2 Integration Tests
- [ ] Auth flow (register, login, logout)
- [ ] Lead CRUD with permission checks
- [ ] Filter combinations
- [ ] Email sending flow
- [ ] Duplicate detection

### 13.3 E2E Tests (Optional but Recommended)
- [ ] User registration → login
- [ ] Create lead → filter → view details
- [ ] Send email → check history
- [ ] Kanban drag-and-drop

**Tools:** Jest (unit/integration), Cypress/Playwright (E2E)

---

## Phase 14: UI Polish & Responsive Design (Days 21-22)

### 14.1 Responsive Design
- [ ] Mobile-first approach
- [ ] Tablet layouts
- [ ] Desktop layouts
- [ ] Test on real devices
- [ ] Breakpoints: 320px, 640px, 1024px, 1280px

### 14.2 Accessibility
- [ ] ARIA labels
- [ ] Keyboard navigation
- [ ] Color contrast ratios
- [ ] Form labels
- [ ] Alt text for images

### 14.3 Performance
- [ ] Lazy load routes
- [ ] Image optimization
- [ ] CSS splitting
- [ ] Minification
- [ ] Lighthouse score >90

### 14.4 Dark Mode (Bonus)
- [ ] TailwindCSS dark mode setup
- [ ] User preference storage
- [ ] System preference detection
- [ ] Smooth transitions

---

## Phase 15: Documentation & Deployment (Days 22-23)

### 15.1 Documentation
- [ ] README.md with setup instructions
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Database schema diagram
- [ ] Architecture diagram
- [ ] Deployment guide
- [ ] Environment variables guide
- [ ] Troubleshooting guide

### 15.2 Deployment
- [ ] Frontend: Vercel or Netlify
- [ ] Backend: Railway, Render, or Heroku
- [ ] Database: Supabase (already setup)
- [ ] Environment configuration
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Monitoring setup

### 15.3 Final Checks
- [ ] Code review (clean code principles)
- [ ] Remove console.logs
- [ ] Remove dummy data
- [ ] Check all TypeScript types
- [ ] Verify error handling
- [ ] Test all features
- [ ] Performance testing

---

## File Structure

```
smart-leads-dashboard/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── leads/
│   │   │   ├── dashboard/
│   │   │   ├── common/
│   │   │   └── layout/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── constants/
│   │   ├── styles/
│   │   └── App.tsx
│   ├── public/
│   ├── .env.example
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── validators/
│   │   ├── config/
│   │   ├── jobs/ (scheduled tasks)
│   │   ├── database/
│   │   │   └── migrations/
│   │   └── main.ts
│   ├── tests/
│   ├── .env.example
│   ├── tsconfig.json
│   └── package.json
│
├── PLAN.md
├── README.md
└── .gitignore
```

---

## Key Technologies

**Frontend:**
- React 18+ with TypeScript
- TailwindCSS for styling
- Zustand for state management
- Recharts for analytics
- Socket.io-client for real-time
- React Query for data fetching
- React Hook Form for forms
- Zod for validation
- Axios for HTTP client

**Backend:**
- Node.js + Express with TypeScript
- Supabase (PostgreSQL) for database
- JWT for authentication
- Bcrypt for password hashing
- Zod/Joi for validation
- Socket.io for real-time
- Bull for job queues (emails)
- Swagger for API docs
- Jest for testing

---

## Timeline Summary

- **Phase 1:** Days 1-2 (Setup)
- **Phase 2:** Days 3-4 (Core)
- **Phase 3:** Days 5-6 (Filtering)
- **Phase 4:** Days 6-7 (Pagination)
- **Phase 5:** Days 7-8 (Lead Scoring)
- **Phase 6:** Days 8-9 (Activities)
- **Phase 7:** Days 9-11 (Email)
- **Phase 8:** Days 11-13 (UI)
- **Phase 9:** Days 13-15 (Analytics)
- **Phase 10:** Days 15-17 (Advanced)
- **Phase 11:** Days 17-19 (Real-time)
- **Phase 12:** Days 19-20 (State Mgmt)
- **Phase 13:** Days 20-21 (Testing)
- **Phase 14:** Days 21-22 (Polish)
- **Phase 15:** Days 22-23 (Deploy)

**Total: ~23 days for complete project**

---

## Quality Checkpoints

- ✅ Zero hardcoded values (all in .env)
- ✅ Proper TypeScript usage (no `any`)
- ✅ Proper error handling (try-catch, middleware)
- ✅ Input validation on all endpoints
- ✅ Proper folder structure (separation of concerns)
- ✅ Reusable components (<200 lines each)
- ✅ Loading states on all async operations
- ✅ Empty states on all lists
- ✅ Clean commits with meaningful messages
- ✅ No console.logs in production code
- ✅ Proper types and interfaces defined
- ✅ DRY principle (no code duplication)