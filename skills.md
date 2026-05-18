# Smart Leads Dashboard - MERN Development Skill Guide

This guide enforces production-grade coding standards and ensures consistent, maintainable code throughout the project.

---

## 1. TypeScript Standards (CRITICAL)

### 1.1 Strict Mode Configuration
```typescript
// tsconfig.json MUST include:
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### 1.2 Type Definitions

**REQUIRED:** Every variable, function, and interface must have explicit types.

```typescript
// ✅ GOOD - Explicit types
interface User {
  id: string;
  email: string;
  role: 'admin' | 'sales_user';
  createdAt: Date;
}

const getUser = async (id: string): Promise<User> => {
  // ...
};

const users: User[] = [];

// ❌ BAD - No types or using 'any'
const getUser = async (id) => { // Missing param type
  // ...
};

const user: any = {}; // Using 'any' - NEVER
```

### 1.3 Avoid `any` Type

```typescript
// ✅ GOOD - Using proper types
const handleData = (data: Record<string, unknown>) => {
  if (typeof data.name === 'string') {
    return data.name;
  }
};

// ✅ GOOD - Using union types
type Result = Success | Error;

// ❌ BAD - Using 'any'
const handleData = (data: any) => {
  return data.name;
};
```

### 1.4 Interface vs Type

```typescript
// Use Interface for object shapes (preferred for models)
interface Lead {
  id: string;
  name: string;
  email: string;
  status: LeadStatus;
}

// Use Type for unions, tuples, primitives
type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Lost';
type ApiResponse<T> = { success: true; data: T } | { success: false; error: string };

// ✅ GOOD - Extending interfaces
interface ExtendedLead extends Lead {
  score: number;
}

// ✅ GOOD - Implementing interfaces
class LeadModel implements Lead {
  id: string;
  name: string;
  email: string;
  status: LeadStatus;
}
```

---

## 2. Backend Code Standards

### 2.1 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.ts
│   │   ├── env.ts
│   │   └── logger.ts
│   ├── models/          # Mongoose schemas
│   │   ├── User.ts
│   │   ├── Lead.ts
│   │   └── Activity.ts
│   ├── interfaces/      # TypeScript interfaces
│   │   ├── IUser.ts
│   │   ├── ILead.ts
│   │   └── IApiResponse.ts
│   ├── services/        # Business logic
│   │   ├── AuthService.ts
│   │   ├── LeadService.ts
│   │   ├── LeadScoringService.ts
│   │   └── ActivityService.ts
│   ├── controllers/     # Route handlers
│   │   ├── authController.ts
│   │   ├── leadController.ts
│   │   └── analyticsController.ts
│   ├── routes/          # API routes
│   │   ├── authRoutes.ts
│   │   ├── leadRoutes.ts
│   │   └── index.ts
│   ├── middleware/      # Express middleware
│   │   ├── authMiddleware.ts
│   │   ├── errorMiddleware.ts
│   │   ├── validationMiddleware.ts
│   │   └── loggingMiddleware.ts
│   ├── utils/           # Utility functions
│   │   ├── validators.ts
│   │   ├── helpers.ts
│   │   └── constants.ts
│   ├── errors/          # Custom error classes
│   │   ├── ApiError.ts
│   │   └── ValidationError.ts
│   └── app.ts           # Express app setup
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── package.json
└── tsconfig.json
```

### 2.2 Model Definition (Mongoose)

```typescript
// ✅ GOOD - Complete model with types
import { Schema, Model, Document } from 'mongoose';

interface ILead extends Document {
  _id: string;
  name: string;
  email: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Lost';
  source: 'Website' | 'Instagram' | 'Referral';
  userId: string;
  leadScore: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const leadSchema = new Schema<ILead>(
  {
    name: {
      type: String,
      required: [true, 'Lead name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['New', 'Contacted', 'Qualified', 'Lost'],
        message: 'Invalid status value',
      },
      default: 'New',
      index: true,
    },
    source: {
      type: String,
      enum: {
        values: ['Website', 'Instagram', 'Referral'],
        message: 'Invalid source value',
      },
      required: [true, 'Source is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    leadScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'leads',
  }
);

// Add indexes
leadSchema.index({ email: 1, userId: 1 }, { unique: true });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ status: 1, source: 1 });

// Soft delete query middleware
leadSchema.pre(/^find/, function (this: any) {
  if (!this.getOptions().includeSoftDeleted) {
    this.where({ deletedAt: null });
  }
});

const Lead: Model<ILead> = mongoose.model<ILead>('Lead', leadSchema);
export default Lead;
```

### 2.3 Service Pattern (Business Logic)

```typescript
// ✅ GOOD - Service with dependency injection and proper error handling
import { ILead } from '../interfaces/ILead';
import Lead from '../models/Lead';
import { ApiError } from '../errors/ApiError';
import Logger from '../config/logger';

interface CreateLeadInput {
  name: string;
  email: string;
  source: string;
  userId: string;
}

interface LeadFilter {
  status?: string[];
  source?: string[];
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

class LeadService {
  private logger: typeof Logger;

  constructor() {
    this.logger = Logger;
  }

  /**
   * Create a new lead with validation
   * @param input Lead creation data
   * @returns Created lead
   * @throws ApiError if validation fails or duplicate exists
   */
  async createLead(input: CreateLeadInput): Promise<ILead> {
    try {
      // Check for duplicate
      const existingLead = await Lead.findOne({
        email: input.email,
        userId: input.userId,
        deletedAt: null,
      });

      if (existingLead) {
        throw new ApiError('Lead with this email already exists', 409);
      }

      // Create lead
      const lead = new Lead({
        ...input,
        leadScore: this.calculateInitialScore(input.source),
      });

      await lead.save();

      this.logger.info(`Lead created: ${lead._id} by user: ${input.userId}`);
      return lead;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      this.logger.error(`Error creating lead: ${error}`);
      throw new ApiError('Failed to create lead', 500);
    }
  }

  /**
   * Get leads with filters and pagination
   * @param filter Filter criteria
   * @returns Paginated leads with metadata
   */
  async getLeads(filter: LeadFilter) {
    try {
      const page = filter.page ?? 1;
      const limit = filter.limit ?? 10;
      const skip = (page - 1) * limit;

      // Build query
      const query: Record<string, any> = { deletedAt: null };

      if (filter.status?.length) {
        query.status = { $in: filter.status };
      }

      if (filter.source?.length) {
        query.source = { $in: filter.source };
      }

      if (filter.search) {
        query.$or = [
          { name: { $regex: filter.search, $options: 'i' } },
          { email: { $regex: filter.search, $options: 'i' } },
        ];
      }

      // Build sort
      const sortObj: Record<string, 1 | -1> = {};
      const sortBy = filter.sortBy ?? 'createdAt';
      const sortOrder = filter.sortOrder === 'asc' ? 1 : -1;
      sortObj[sortBy] = sortOrder;

      // Execute query
      const leads = await Lead.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean();

      const totalCount = await Lead.countDocuments(query);
      const totalPages = Math.ceil(totalCount / limit);

      return {
        data: leads,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching leads: ${error}`);
      throw new ApiError('Failed to fetch leads', 500);
    }
  }

  /**
   * Calculate initial lead score based on source
   */
  private calculateInitialScore(source: string): number {
    const scores: Record<string, number> = {
      Referral: 30,
      Website: 20,
      Instagram: 15,
    };
    return scores[source] ?? 0;
  }
}

export default new LeadService();
```

### 2.4 Controller Pattern

```typescript
// ✅ GOOD - Controller with proper request validation and error handling
import { Request, Response, NextFunction } from 'express';
import LeadService from '../services/LeadService';
import { ApiError } from '../errors/ApiError';
import Logger from '../config/logger';

class LeadController {
  /**
   * Create a new lead
   * POST /leads
   */
  async createLead(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { name, email, source } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new ApiError('User not authenticated', 401);
      }

      const lead = await LeadService.createLead({
        name,
        email,
        source,
        userId,
      });

      res.status(201).json({
        success: true,
        message: 'Lead created successfully',
        data: lead,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all leads with filters
   * GET /leads?status=Qualified&source=Instagram&search=test&page=1&limit=10
   */
  async getLeads(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { status, source, search, sortBy, sortOrder, page, limit } =
        req.query;

      const filters = {
        status: status ? (Array.isArray(status) ? status : [status as string]) : undefined,
        source: source ? (Array.isArray(source) ? source : [source as string]) : undefined,
        search: (search as string) ?? undefined,
        sortBy: (sortBy as string) ?? 'createdAt',
        sortOrder: (sortOrder as 'asc' | 'desc') ?? 'desc',
        page: parseInt(page as string) ?? 1,
        limit: parseInt(limit as string) ?? 10,
      };

      const result = await LeadService.getLeads(filters);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single lead by ID
   * GET /leads/:id
   */
  async getLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const lead = await LeadService.getLeadById(id);

      if (!lead) {
        throw new ApiError('Lead not found', 404);
      }

      res.json({
        success: true,
        data: lead,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update lead
   * PUT /leads/:id
   */
  async updateLead(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const lead = await LeadService.updateLead(id, updateData);

      res.json({
        success: true,
        message: 'Lead updated successfully',
        data: lead,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete lead
   * DELETE /leads/:id
   */
  async deleteLead(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      await LeadService.deleteLead(id);

      res.json({
        success: true,
        message: 'Lead deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new LeadController();
```

### 2.5 Error Handling

```typescript
// ✅ GOOD - Custom error class
class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export { ApiError };

// ✅ GOOD - Error middleware
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../errors/ApiError';
import Logger from '../config/logger';

const errorMiddleware = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof ApiError) {
    Logger.error(`API Error: ${err.message} (${err.statusCode})`);

    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // Unhandled error
  Logger.error(`Unhandled Error: ${err.message}`);

  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  });
};

export default errorMiddleware;

// ❌ BAD - Throwing plain errors without context
throw new Error('Something went wrong');

// ❌ BAD - Not handling async errors
app.get('/leads', (req, res) => {
  // This will crash if error occurs
  const leads = Lead.find();
});
```

### 2.6 Validation

```typescript
// ✅ GOOD - Using Zod for validation (alternative: Joi)
import { z } from 'zod';

const CreateLeadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  source: z.enum(['Website', 'Instagram', 'Referral']),
  status: z
    .enum(['New', 'Contacted', 'Qualified', 'Lost'])
    .optional()
    .default('New'),
  phoneNumber: z.string().optional(),
  companyName: z.string().optional(),
});

type CreateLeadInput = z.infer<typeof CreateLeadSchema>;

// Validation middleware
const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
    }
  };
};

// Usage in routes
router.post('/leads', validate(CreateLeadSchema), leadController.createLead);

// ❌ BAD - Manual validation without type safety
if (!req.body.name) {
  res.status(400).json({ error: 'Name required' });
}
if (!req.body.email) {
  res.status(400).json({ error: 'Email required' });
}
```

### 2.7 Middleware Pattern

```typescript
// ✅ GOOD - Authentication middleware
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '../errors/ApiError';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; role: string };
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new ApiError('No token provided', 401);
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    ) as { id: string; email: string; role: string };

    req.user = decoded;
    next();
  } catch (error) {
    next(
      new ApiError(
        error instanceof jwt.JsonWebTokenError
          ? 'Invalid token'
          : 'Authentication failed',
        401
      )
    );
  }
};

// ✅ GOOD - Role-based authorization
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new ApiError('Insufficient permissions', 403));
      return;
    }
    next();
  };
};

// Usage
router.post(
  '/admin/users',
  authMiddleware,
  authorize(['admin']),
  controller.createUser
);
```

### 2.8 Logging Standards

```typescript
// ✅ GOOD - Using Winston logger
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Usage
logger.info('Application started');
logger.error('Error message', { stack: error.stack });
logger.debug('Debug information', { leadId: '123' });

export default logger;

// ❌ BAD - Using console.log
console.log('Lead created'); // Never use this
console.error('Error occurred'); // Never use this
```

### 2.9 Constants File

```typescript
// ✅ GOOD - Centralized constants
export const LEAD_STATUS = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  LOST: 'Lost',
} as const;

export const LEAD_SOURCE = {
  WEBSITE: 'Website',
  INSTAGRAM: 'Instagram',
  REFERRAL: 'Referral',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRE: '15m',
  REFRESH_TOKEN_EXPIRE: '7d',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
} as const;

// Usage
const status = LEAD_STATUS.NEW;
const source = LEAD_SOURCE.WEBSITE;

// ❌ BAD - Magic strings scattered everywhere
const status = 'New';
const source = 'Website';
```

---

## 3. Frontend Code Standards

### 3.1 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── common/          # Reusable components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Loading.tsx
│   │   ├── leads/           # Feature-specific components
│   │   │   ├── LeadsList.tsx
│   │   │   ├── LeadDetail.tsx
│   │   │   ├── CreateLeadForm.tsx
│   │   │   ├── FilterPanel.tsx
│   │   │   └── KanbanBoard.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   └── layout/
│   │       ├── Navbar.tsx
│   │       ├── Sidebar.tsx
│   │       └── MainLayout.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── LeadsPage.tsx
│   │   ├── LeadDetailPage.tsx
│   │   └── AnalyticsPage.tsx
│   ├── services/
│   │   ├── api.ts           # Axios instance
│   │   ├── authService.ts
│   │   ├── leadService.ts
│   │   └── analyticsService.ts
│   ├── store/               # Redux store
│   │   ├── store.ts
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── leadsSlice.ts
│   │   │   └── filtersSlice.ts
│   │   └── hooks.ts
│   ├── types/               # TypeScript types
│   │   ├── lead.ts
│   │   ├── user.ts
│   │   ├── api.ts
│   │   └── index.ts
│   ├── hooks/               # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useLeads.ts
│   │   ├── useDebounce.ts
│   │   └── useFetch.ts
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   └── validators.ts
│   ├── styles/
│   │   ├── index.css
│   │   └── globals.css
│   └── App.tsx
├── index.html
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

### 3.2 Component Standards

```typescript
// ✅ GOOD - Functional component with proper types
import React, { FC, ReactNode } from 'react';
import { Lead } from '../../types/lead';

interface LeadCardProps {
  lead: Lead;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
  children?: ReactNode;
}

const LeadCard: FC<LeadCardProps> = ({
  lead,
  onEdit,
  onDelete,
  isLoading = false,
  children,
}) => {
  const getScoreBadgeColor = (score: number): string => {
    if (score >= 70) return 'bg-green-100 text-green-800';
    if (score >= 30) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-32 rounded" />;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900">{lead.name}</h3>
          <p className="text-sm text-gray-500">{lead.email}</p>
        </div>
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${getScoreBadgeColor(
            lead.leadScore
          )}`}
        >
          {lead.leadScore}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
          {lead.status}
        </span>
        <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
          {lead.source}
        </span>
      </div>

      {children}

      <div className="flex gap-2 justify-end pt-3 border-t">
        <button
          onClick={() => onEdit(lead._id)}
          className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(lead._id)}
          className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default LeadCard;

// ❌ BAD - No types
const LeadCard = ({ lead, onEdit }) => {
  return <div>{lead.name}</div>;
};

// ❌ BAD - Large component (should be split)
const LeadCard = ({ lead, onEdit, onDelete }) => {
  // 500+ lines of code
};

// ❌ BAD - Using inline styles
const LeadCard = ({ lead }) => {
  return (
    <div style={{ backgroundColor: 'white', padding: '16px' }}>
      {lead.name}
    </div>
  );
};
```

### 3.3 Custom Hooks

```typescript
// ✅ GOOD - Custom hook for data fetching
import { useState, useEffect } from 'react';
import { ApiError } from '../types/api';

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

export const useFetch = <T,>(
  fetchFn: () => Promise<T>,
  dependencies: unknown[] = []
): UseFetchResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const refetch = async () => {
    setLoading(true);
    try {
      const result = await fetchFn();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, dependencies);

  return { data, loading, error, refetch };
};

// Usage
const MyComponent = () => {
  const { data: leads, loading, error, refetch } = useFetch(
    () => leadService.getLeads(),
    []
  );

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {leads && leads.map((lead) => <LeadCard key={lead._id} lead={lead} />)}
    </div>
  );
};

// ✅ GOOD - Debounce hook
export const useDebounce = <T,>(value: T, delay: number = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

// Usage
const LeadsSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearch) {
      // Make API call
      searchLeads(debouncedSearch);
    }
  }, [debouncedSearch]);

  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search leads..."
    />
  );
};

// ❌ BAD - Logic in components instead of hooks
const Component = () => {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/data').then(setData); // Should be in custom hook
  }, []);
};
```

### 3.4 Redux Store Pattern

```typescript
// ✅ GOOD - Redux slice with TypeScript
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Lead } from '../../types/lead';
import { leadService } from '../../services/leadService';

interface LeadsState {
  items: Lead[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  limit: number;
}

const initialState: LeadsState = {
  items: [],
  loading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
  limit: 10,
};

// Async thunk
export const fetchLeads = createAsyncThunk(
  'leads/fetchLeads',
  async (
    params: { page: number; limit: number; filters?: Record<string, unknown> },
    { rejectWithValue }
  ) => {
    try {
      const response = await leadService.getLeads(params);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const createLead = createAsyncThunk(
  'leads/createLead',
  async (leadData: Omit<Lead, '_id'>, { rejectWithValue }) => {
    try {
      const response = await leadService.createLead(leadData);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const leadsSlice = createSlice({
  name: 'leads',
  initialState,
  reducers: {
    setPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.totalCount = action.payload.pagination.totalCount;
        state.currentPage = action.payload.pagination.page;
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createLead.pending, (state) => {
        state.loading = true;
      })
      .addCase(createLead.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
      })
      .addCase(createLead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setPage, clearError } = leadsSlice.actions;
export default leadsSlice.reducer;

// Custom hook for Redux
import { useAppDispatch, useAppSelector } from '../store/hooks';

export const useLeads = () => {
  const dispatch = useAppDispatch();
  const leads = useAppSelector((state) => state.leads);

  const fetchLeadsList = (page: number, filters?: any) => {
    dispatch(fetchLeads({ page, limit: 10, filters }));
  };

  const createNewLead = (leadData: any) => {
    dispatch(createLead(leadData));
  };

  return { leads, fetchLeadsList, createNewLead };
};
```

### 3.5 API Service Pattern

```typescript
// ✅ GOOD - Axios instance with interceptors
import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';

interface ApiConfig {
  baseURL: string;
  timeout: number;
}

class ApiClient {
  private client: AxiosInstance;

  constructor(config: ApiConfig) {
    this.client = axios.create(config);

    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Handle token expiration
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  get<T>(url: string, config?: any) {
    return this.client.get<T>(url, config);
  }

  post<T>(url: string, data?: any, config?: any) {
    return this.client.post<T>(url, data, config);
  }

  put<T>(url: string, data?: any, config?: any) {
    return this.client.put<T>(url, data, config);
  }

  delete<T>(url: string, config?: any) {
    return this.client.delete<T>(url, config);
  }
}

const apiClient = new ApiClient({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
});

export default apiClient;

// Usage in service
export const leadService = {
  getLeads: async (params: any) => {
    const response = await apiClient.get('/leads', { params });
    return response.data;
  },

  createLead: async (data: any) => {
    const response = await apiClient.post('/leads', data);
    return response.data;
  },

  updateLead: async (id: string, data: any) => {
    const response = await apiClient.put(`/leads/${id}`, data);
    return response.data;
  },

  deleteLead: async (id: string) => {
    const response = await apiClient.delete(`/leads/${id}`);
    return response.data;
  },
};
```

### 3.6 Form Validation

```typescript
// ✅ GOOD - React Hook Form + Zod
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const CreateLeadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  source: z.enum(['Website', 'Instagram', 'Referral']),
  status: z
    .enum(['New', 'Contacted', 'Qualified', 'Lost'])
    .optional()
    .default('New'),
});

type CreateLeadFormData = z.infer<typeof CreateLeadSchema>;

const CreateLeadForm: FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateLeadFormData>({
    resolver: zodResolver(CreateLeadSchema),
  });

  const onSubmit = async (data: CreateLeadFormData) => {
    try {
      await leadService.createLead(data);
      // Success
    } catch (error) {
      console.error('Failed to create lead', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Name *</label>
        <input
          {...register('name')}
          type="text"
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium">Email *</label>
        <input
          {...register('email')}
          type="email"
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Creating...' : 'Create Lead'}
      </button>
    </form>
  );
};

// ❌ BAD - Manual validation
const CreateLeadForm = () => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!name) setError('Name required');
    // More manual checks...
  };
};
```

### 3.7 Loading & Error States

```typescript
// ✅ GOOD - Proper state handling
const LeadsList: FC = () => {
  const { data: leads, loading, error } = useFetch(
    () => leadService.getLeads(),
    []
  );

  // Loading state
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 h-20 rounded" />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded">
        <p className="text-red-800">Error loading leads: {error.message}</p>
        <button
          onClick={() => refetch()}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (!leads || leads.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500 mb-3">No leads found</p>
        <button
          onClick={() => navigateTo('/leads/create')}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Create Your First Lead
        </button>
      </div>
    );
  }

  // Success state
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {leads.map((lead) => (
        <LeadCard key={lead._id} lead={lead} />
      ))}
    </div>
  );
};

// ❌ BAD - No proper states
const LeadsList = () => {
  return <div>{leads.map((l) => <div>{l.name}</div>)}</div>;
};
```

### 3.8 Component Size Guidelines

```typescript
// ✅ GOOD - Small, focused component
const LeadStatusBadge: FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    New: 'bg-gray-100 text-gray-800',
    Contacted: 'bg-blue-100 text-blue-800',
    Qualified: 'bg-green-100 text-green-800',
    Lost: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status]}`}>
      {status}
    </span>
  );
};

// ✅ GOOD - Separate concerns
const LeadsTable: FC<{ leads: Lead[]; onEdit: Function; onDelete: Function }> =
  ({ leads, onEdit, onDelete }) => {
    return (
      <table className="w-full">
        <tbody>
          {leads.map((lead) => (
            <LeadTableRow
              key={lead._id}
              lead={lead}
              onEdit={() => onEdit(lead._id)}
              onDelete={() => onDelete(lead._id)}
            />
          ))}
        </tbody>
      </table>
    );
  };

// ❌ BAD - Component too large (>200 lines)
const LeadsPage = () => {
  // 500+ lines handling filters, table, modals, forms, etc.
  // Should be split into multiple components
};
```

---

## 4. General Code Quality

### 4.1 Naming Conventions

```typescript
// ✅ GOOD - Clear, descriptive names
const MAX_LEAD_NAME_LENGTH = 100;
const isLeadQualified = (lead: Lead): boolean => lead.status === 'Qualified';
const formatLeadCreatedDate = (date: Date): string => date.toLocaleDateString();

interface IUserAuthRequest {
  email: string;
  password: string;
}

class LeadScoringService {
  public calculateLeadScore(lead: Lead): number {
    // ...
  }
}

// ❌ BAD - Unclear or ambiguous names
const MAX = 100;
const check = (l) => l.s === 'Qualified';
const fmt = (d) => d.toLocaleDateString();
const x = { e: 'test@test.com', p: 'pass' };
class LS {
  calc(l) {
    // ...
  }
}
```

### 4.2 File Naming

```
// ✅ GOOD
LeadService.ts (class/service)
useLeads.ts (custom hook)
leadSlice.ts (redux slice)
Lead.ts (model)
ILead.ts (interface)
constants.ts (constants)

// ❌ BAD
leadservice.ts (incorrect casing)
leads_service.ts (wrong convention)
service.ts (too generic)
```

### 4.3 Comments & Documentation

```typescript
// ✅ GOOD - Clear, meaningful comments
/**
 * Calculate lead quality score based on multiple factors
 * @param lead The lead object to score
 * @param engagementMetrics Additional engagement data
 * @returns Score between 0-100
 */
public calculateScore(lead: Lead, engagementMetrics?: EngagementMetrics): number {
  // Start with source weight
  let score = this.getSourceWeight(lead.source);
  
  // Add status progression bonus
  score += this.getStatusBonus(lead.status);
  
  // Apply time decay if not contacted recently
  if (engagementMetrics) {
    score += this.getEngagementBonus(engagementMetrics);
  }
  
  return Math.min(score, 100); // Cap at 100
}

// ❌ BAD - Obvious or unclear comments
// Get the lead
const lead = await Lead.findById(id);

// Loop through items
for (let i = 0; i < items.length; i++) {
  // Do something
}
```

### 4.4 Avoid Code Duplication

```typescript
// ✅ GOOD - Extracted common logic
const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validateLeadData = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.name?.trim()) errors.push('Name is required');
  if (!validateEmail(data.email)) errors.push('Invalid email');
  if (!data.source) errors.push('Source is required');

  return { valid: errors.length === 0, errors };
};

// Usage in multiple places
const validation1 = validateLeadData(input);
const validation2 = validateLeadData(formData);

// ❌ BAD - Duplicated validation logic
const createLead = async (data: any) => {
  if (!data.name) throw new Error('Name required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    throw new Error('Invalid email');
  if (!data.source) throw new Error('Source required');
  // ...
};

const updateLead = async (data: any) => {
  if (!data.name) throw new Error('Name required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    throw new Error('Invalid email');
  if (!data.source) throw new Error('Source required');
  // ...
};
```

### 4.5 Environment Variables

```typescript
// ✅ GOOD - Centralized config
// config/env.ts
const envConfig = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000'),
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRY: process.env.JWT_EXPIRY || '15m',
  API_BASE_URL: process.env.API_BASE_URL,
} as const;

if (!envConfig.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

export default envConfig;

// Usage
import envConfig from '../config/env';
mongoose.connect(envConfig.DATABASE_URL);

// ❌ BAD - Scattered env variables
const dbUrl = process.env.DATABASE_URL;
const secret = process.env.JWT_SECRET;
const port = process.env.PORT;
```

### 4.6 Git Commit Messages

```
✅ GOOD:
feat: Add lead filtering by status and source
fix: Correct pagination calculation in lead list
refactor: Extract query builder to separate service
test: Add unit tests for lead scoring algorithm
docs: Update API documentation for filters
chore: Update dependencies to latest versions

❌ BAD:
fixed bug
updated code
changes
work in progress
final changes
```

---

## 5. Common Pitfalls to Avoid

| Pitfall | Bad Example | Good Example |
|---------|-------------|--------------|
| Using `any` type | `const data: any` | `const data: ILead` |
| Missing error handling | `await Lead.find()` | `try { await Lead.find() } catch { }` |
| Hardcoded values | `const limit = 10` | `const { DEFAULT_LIMIT } = PAGINATION` |
| Large components | 500+ line components | <200 line components |
| No loading states | Direct render | Conditional loading state |
| Scattered logic | Logic in components | Extract to services/hooks |
| No validation | Direct DB operations | Validate before database |
| Magic strings | `status: 'New'` | `status: LEAD_STATUS.NEW` |
| Inline functions | `onClick={() => handleClick()}` | `onClick={handleClick}` |
| No error UI | Crash on error | Error boundary + UI |
| Console.log in prod | `console.log()` everywhere | Use logger service |

---

## 6. Pre-Submission Checklist

- [ ] TypeScript strict mode enabled
- [ ] No `any` types used (or properly justified)
- [ ] All functions have return types
- [ ] All interfaces properly defined
- [ ] No console.log statements
- [ ] No hardcoded values
- [ ] Error handling on all async operations
- [ ] Loading states on all data fetches
- [ ] Empty states handled
- [ ] Form validation implemented
- [ ] Comments for complex logic only
- [ ] Constants extracted to constants file
- [ ] Reusable components created
- [ ] Services separated from components
- [ ] Custom hooks for shared logic
- [ ] Proper folder structure
- [ ] No code duplication
- [ ] Environment variables configured
- [ ] API responses consistent
- [ ] Database indexes created
- [ ] Tests written (>70% coverage)
- [ ] Git history clean
- [ ] README and documentation updated

---

## Summary

Follow these standards strictly. They are not suggestions—they define the quality bar for this project. The recruiter will evaluate code quality heavily, and cutting corners will result in rejection.

**Remember:** Code is read far more often than it's written. Write for the next developer who will maintain this code.