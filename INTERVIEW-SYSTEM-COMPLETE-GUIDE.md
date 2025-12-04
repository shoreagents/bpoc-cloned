# 🎯 Interview System - Complete Implementation Guide

## Overview
This is a complete guide to the interview request and hiring system used in ShoreAgents. The system handles the entire flow from client interview requests to final candidate hiring.

**Note**: This guide shows you how to **connect to and use the existing ShoreAgents database**, not create new tables.

---

## 📊 System Flow

```
1. CLIENT SIDE: Request Interview
   ↓
2. ADMIN SIDE: Review & Schedule
   ↓
3. ADMIN SIDE: Mark as Completed
   ↓
4. CLIENT SIDE: Request to Hire (or Reject)
   ↓
5. ADMIN SIDE: Send Job Offer
   ↓
6. ADMIN SIDE: Confirm Acceptance & Finalize Hire
   ↓
7. CANDIDATE: Creates Staff Account
```

---

## 🔗 Connecting to ShoreAgents Database

The interview system uses **two existing databases**:

### 1. **ShoreAgents Main Database** (Your application database)
Contains interview requests, job acceptances, client data, and company information.

### 2. **BPOC Database** (External candidate database)
Contains candidate profiles, resumes, assessments, and AI analysis.

---

## 🗄️ Database Tables (Already Exist)

### 1. `interview_requests` Table

**Purpose**: Stores all interview requests from clients

**Location**: Already exists in ShoreAgents main database

**Key Fields**:
- `id` - Primary key (UUID)
- `clientUserId` - References client_users table
- `bpocCandidateId` - References external BPOC database candidate
- `candidateFirstName` - Cached candidate name
- `preferredTimes` - JSONB array of time options
- `clientNotes` - Optional notes from client
- `adminNotes` - Admin notes (timestamped)
- `status` - Current interview status
- `scheduledTime` - When interview is scheduled
- `meetingLink` - Video call URL
- `clientPreferredStart` - Client's preferred start date
- `workSchedule` - JSONB work schedule details
- `clientTimezone` - Client's timezone (IANA format)

**Status Values**:
- `PENDING` - Waiting for admin to schedule
- `SCHEDULED` - Interview time set
- `RESCHEDULE_REQUESTED` - Client requested reschedule
- `COMPLETED` - Interview finished
- `HIRE_REQUESTED` - Client wants to hire
- `OFFER_SENT` - Admin sent job offer
- `OFFER_ACCEPTED` - Candidate accepted offer
- `OFFER_DECLINED` - Candidate declined offer
- `HIRED` - Finalized and hired
- `REJECTED` - Client rejected candidate
- `CANCELLED` - Interview cancelled

**preferredTimes JSON Structure**:
```json
[
  {
    "datetime": "2025-12-15T09:00",
    "timezone": "Australia/Brisbane",
    "timezoneDisplay": "Brisbane Time (AEST)"
  },
  {
    "datetime": "2025-12-16T14:00",
    "timezone": "Australia/Brisbane",
    "timezoneDisplay": "Brisbane Time (AEST)"
  }
]
```

**workSchedule JSON Structure**:
```json
{
  "workDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "workStartTime": "09:00",
  "isMonToFri": true,
  "clientTimezone": "Australia/Brisbane",
  "hasCustomHours": false,
  "customHours": null
}
```

Or with custom hours:
```json
{
  "workDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "workStartTime": null,
  "isMonToFri": false,
  "clientTimezone": "America/New_York",
  "hasCustomHours": true,
  "customHours": {
    "Mon": "08:00",
    "Tue": "09:00",
    "Wed": "08:00",
    "Thu": "09:00",
    "Fri": "08:00"
  }
}
```

### 2. `job_acceptances` Table

**Purpose**: Stores job offer details and tracks hiring process

**Location**: Already exists in ShoreAgents main database

**Key Fields**:
- `id` - Primary key (UUID)
- `interviewRequestId` - One-to-one with interview_requests
- `bpocCandidateId` - BPOC candidate reference
- `candidateEmail` - Email for staff account
- `position` - Job position
- `companyId` - References company table
- `salary` - Monthly salary (PHP)
- `shiftType` - DAY_SHIFT, NIGHT_SHIFT, etc.
- `workLocation` - WORK_FROM_HOME, OFFICE, HYBRID
- `hmoIncluded` - Boolean for HMO coverage
- `leaveCredits` - Leave days per year
- `workDays` - Array of work days
- `workStartTime` - Start time (HH:mm)
- `clientTimezone` - Work timezone
- `customHours` - JSONB for custom schedule
- `staffUserId` - Set after staff account created

### 3. Supporting Tables (Already Exist)

These tables are already in the ShoreAgents database and are referenced by the interview system:

**`client_users`** - Client user accounts
- `id` - Primary key
- `authUserId` - Auth system reference
- `name` - Client name
- `email` - Client email
- `companyId` - Company reference

**`client_profiles`** - Client extended profiles
- `clientUserId` - References client_users
- `timezone` - **Critical!** Client's timezone for time display
- `mobilePhone` - Contact number
- `directPhone` - Alternative contact

**`company`** - Company/organization information
- `id` - Primary key
- `companyName` - Company name
- `location` - Company address
- `logo` - Company logo URL

**`management_users`** - Admin user accounts
- `id` - Primary key
- `authUserId` - Auth system reference
- `role` - ADMIN or MANAGER
- `name` - Admin name
- `email` - Admin email

**`staff_users`** - Staff/employee accounts
- `id` - Primary key
- `authUserId` - Auth system reference
- `email` - Staff email
- `name` - Staff name
- `companyId` - Assigned company

---

## 🌐 BPOC External Database (Already Exists)

The BPOC (BPO Candidates) database is an **external PostgreSQL database** hosted separately. It contains candidate profiles and assessment data.

**Connection**: Via `BPOC_DATABASE_URL` environment variable

**Key Tables**:

**`users`** - Candidate profiles
- `id` - Matches `bpocCandidateId` in interview_requests
- `first_name`, `last_name` - Candidate name
- `email` - Candidate email
- `phone` - Candidate phone
- `avatar_url` - Profile picture
- `position` - Job title
- `location_city`, `location_country` - Location

**`resumes_extracted`** - Resume data (JSONB)
- `user_id` - References users
- `resume_data` - Complete resume in JSON format

**`disc_personality_stats`** - DISC assessments
- `user_id` - References users
- `latest_primary_type` - Primary DISC type (D/I/S/C)
- `latest_d_score`, `latest_i_score`, `latest_s_score`, `latest_c_score` - Scores

**`typing_hero_stats`** - Typing speed metrics
- `user_id` - References users
- `latest_wpm` - Words per minute
- `latest_accuracy` - Accuracy percentage

**`ai_analysis_results`** - AI-generated analysis
- `user_id` - References users
- `overall_score` - AI assessment score
- `key_strengths` - Array of strengths

---

## 🔌 API Endpoints

### CLIENT APIs

#### 1. Request Interview
**POST** `/api/client/interviews/request`

```typescript
// Request Body
{
  bpoc_candidate_id: string,      // Candidate ID from BPOC database
  preferred_times: Array<{         // 2-3 time options
    datetime: string,              // ISO 8601 format
    timezone: string,              // IANA timezone
    timezoneDisplay: string        // Human-readable timezone
  }>,
  client_notes: string | null,     // Optional notes
  client_timezone: string          // Client's timezone
}

// Response
{
  success: boolean,
  message: string,
  request: InterviewRequest
}
```

#### 2. Get Client's Interviews
**GET** `/api/client/interviews`

```typescript
// Response
{
  success: boolean,
  interviews: InterviewRequest[]
}
```

#### 3. Request to Hire
**POST** `/api/client/interviews/hire-request`

```typescript
// Request Body
{
  interviewRequestId: string,
  preferredStartDate: string,      // ISO date
  workSchedule: {
    workDays: string[],
    workStartTime: string,
    isMonToFri: boolean,
    hasCustomHours: boolean,
    customHours: Record<string, string> | null
  }
}

// Response
{
  success: boolean,
  message: string,
  interview: InterviewRequest
}
```

#### 4. Reschedule Interview
**POST** `/api/client/interviews/reschedule`

```typescript
// Request Body
{
  interviewRequestId: string,
  newPreferredTimes: Array<PreferredTime>,
  rescheduleNotes: string
}
```

#### 5. Cancel Interview
**POST** `/api/client/interviews/cancel`

```typescript
// Request Body
{
  interviewRequestId: string,
  cancelReason: string
}
```

### ADMIN APIs

#### 1. Get All Interviews
**GET** `/api/admin/recruitment/interviews`

```typescript
// Response
{
  success: boolean,
  interviews: Array<InterviewRequest & {
    client_name: string,
    client_email: string,
    client_phone: string | null,
    company_name: string,
    candidate_avatar_url: string | null,
    candidate_position: string | null,
    candidate_location: string | null,
    candidate_email: string | null,
    candidate_phone: string | null
  }>,
  count: number
}
```

#### 2. Schedule Interview
**PATCH** `/api/admin/recruitment/interviews/[id]/schedule`

```typescript
// Request Body
{
  scheduledTime: string,           // ISO 8601 datetime
  meetingLink: string,             // Video call link (Daily.co, Zoom, etc.)
  adminNotes: string               // Optional scheduling notes
}

// Response
{
  success: boolean,
  message: string,
  interview: InterviewRequest
}
```

#### 3. Mark Interview Complete
**PATCH** `/api/admin/recruitment/interviews/[id]/complete`

```typescript
// Response
{
  success: boolean,
  interview: InterviewRequest
}
```

#### 4. Cancel Interview (Admin)
**PATCH** `/api/admin/recruitment/interviews/[id]/cancel`

```typescript
// Request Body
{
  reason: string
}

// Response
{
  success: boolean,
  interview: InterviewRequest
}
```

#### 5. Undo Cancellation
**PATCH** `/api/admin/recruitment/interviews/[id]/undo-cancel`

```typescript
// Request Body
{
  notes: string
}

// Response
{
  success: boolean,
  interview: InterviewRequest
}
```

#### 6. Send Job Offer
**POST** `/api/admin/recruitment/interviews/hire`

```typescript
// Request Body
{
  interviewRequestId: string,
  position: string,
  companyId: string,
  candidateEmail: string,
  candidatePhone: string,
  bpocCandidateId: string,
  clientPreferredStart: string,    // ISO date
  salary: number,                  // Monthly salary in PHP
  shiftType: string,               // "DAY_SHIFT" | "NIGHT_SHIFT" | "FLEXIBLE"
  workLocation: string,            // "WORK_FROM_HOME" | "OFFICE" | "HYBRID"
  hmoIncluded: boolean,
  leaveCredits: number,
  clientTimezone: string,
  workHours: string,
  workSchedule: {
    workDays: string[],
    workStartTime: string,
    isMonToFri: boolean,
    clientTimezone: string,
    hasCustomHours: boolean,
    customHours: Record<string, string> | null
  }
}

// Response
{
  success: boolean,
  message: string,
  jobAcceptance: JobAcceptance,
  offerDetails: {
    position: string,
    companyName: string,
    salary: string,
    shiftType: string,
    workLocation: string,
    hmoIncluded: boolean,
    leaveCredits: number,
    clientTimezone: string,
    workHours: string,
    preferredStartDate: string
  },
  offerLink: string,
  nextSteps: string
}
```

#### 7. Confirm Offer Acceptance & Finalize Hire
**POST** `/api/admin/recruitment/interviews/confirm-acceptance`

```typescript
// Request Body
{
  interviewRequestId: string,
  bpocCandidateId: string,
  confirmedStartDate: string,      // ISO date
  staffEmail: string,              // Email for staff account creation
  adminNotes: string               // Optional notes
}

// Response
{
  success: boolean,
  message: string,
  interview: InterviewRequest,
  jobAcceptanceId: string,
  staffEmail: string,
  instructions: string
}
```

#### 8. Mark Offer Declined
**POST** `/api/admin/recruitment/interviews/mark-declined`

```typescript
// Request Body
{
  interviewRequestId: string,
  declineReason: string
}

// Response
{
  success: boolean,
  interview: InterviewRequest
}
```

#### 9. Add Interview Notes
**POST** `/api/admin/recruitment/interviews/[id]/notes`

```typescript
// Request Body
{
  notes: string
}

// Response
{
  success: boolean,
  interview: InterviewRequest
}
```

---

## 🔐 Environment Variables

To connect to the existing ShoreAgents databases, you need these environment variables:

```bash
# ============================================
# SHOREAGENTS MAIN DATABASE (Required)
# ============================================
# Your application database containing interviews, clients, companies
DATABASE_URL="postgresql://username:password@host:port/shoreagents_db"

# Example (Railway/Supabase format):
# DATABASE_URL="postgresql://postgres.abc123:password@aws-0-region.pooler.supabase.com:5432/postgres"

# ============================================
# BPOC CANDIDATE DATABASE (Required)
# ============================================
# External database with candidate profiles and assessments
BPOC_DATABASE_URL="postgresql://username:password@host:port/bpoc_db"

# Example:
# BPOC_DATABASE_URL="postgresql://postgres:password@containers-region.railway.app:5432/railway"

# ============================================
# AUTHENTICATION (Required)
# ============================================
AUTH_SECRET="your-secret-key-minimum-32-characters"
AUTH_URL="http://localhost:3000"  # or your production URL

# ============================================
# APPLICATION URL (Required)
# ============================================
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # or your production URL

# ============================================
# OPTIONAL: Video Call Integration
# ============================================
# If using Daily.co for video interviews
DAILY_API_KEY="your-daily-api-key"

# If using Zoom
ZOOM_CLIENT_ID="your-zoom-client-id"
ZOOM_CLIENT_SECRET="your-zoom-client-secret"
```

### Environment Variable Details

#### `DATABASE_URL` (Main Database)
**Purpose**: Connection string for your ShoreAgents PostgreSQL database

**Contains**:
- `interview_requests` table
- `job_acceptances` table
- `client_users` table
- `client_profiles` table
- `company` table
- `management_users` table
- `staff_users` table
- All other application tables

**Format**: `postgresql://[user]:[password]@[host]:[port]/[database]`

**Where to get it**:
- Check your hosting provider dashboard (Railway, Supabase, Heroku, etc.)
- Look for "Connection String" or "Database URL"
- Usually in your project settings or database section

---

#### `BPOC_DATABASE_URL` (Candidate Database)
**Purpose**: Connection string for the external BPOC candidate database

**Contains**:
- `users` table (candidate profiles)
- `resumes_extracted` table
- `disc_personality_stats` table
- `typing_hero_stats` table
- `ai_analysis_results` table

**Format**: `postgresql://[user]:[password]@[host]:[port]/[database]`

**Important**: This is a **separate database** from your main application database.

---

#### `AUTH_SECRET`
**Purpose**: Secret key for NextAuth.js session encryption

**Requirements**:
- Minimum 32 characters
- Keep it secret and secure
- Never commit to version control

**Generate one**:
```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

#### `AUTH_URL` & `NEXT_PUBLIC_APP_URL`
**Purpose**: Your application's base URL

**Development**: `http://localhost:3000`
**Production**: `https://yourdomain.com`

---

### Getting Database Connection Strings

#### If using Railway:
1. Go to your Railway project
2. Click on your database service
3. Go to "Connect" tab
4. Copy the "Database URL" or "Postgres Connection URL"

#### If using Supabase:
1. Go to Project Settings
2. Click "Database"
3. Scroll to "Connection string"
4. Copy the URI (with password revealed)

#### If using Heroku:
1. Go to your app dashboard
2. Click "Resources"
3. Click on your Postgres addon
4. Go to "Settings" tab
5. Click "View Credentials"
6. Copy "URI"

#### If self-hosted:
```bash
postgresql://username:password@your-server-ip:5432/database_name
```

---

### Example `.env.local` File

```bash
# ShoreAgents Main Database
DATABASE_URL="postgresql://postgres.xyz123:myP@ssw0rd@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# BPOC Candidate Database  
BPOC_DATABASE_URL="postgresql://postgres:candidateP@ss@containers-us-west-1.railway.app:5432/railway"

# Authentication
AUTH_SECRET="super-secret-key-at-least-32-characters-long"
AUTH_URL="http://localhost:3000"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional: Video Calls
DAILY_API_KEY="your-daily-api-key-here"
```

---

### Testing Your Connection

Create a test script to verify your database connections:

```typescript
// test-db-connection.ts
import { prisma } from './lib/prisma'
import { queryBPOC } from './lib/bpoc-db'

async function testConnections() {
  try {
    // Test main database
    console.log('Testing main database...')
    const interviewCount = await prisma.interview_requests.count()
    console.log(`✅ Main DB: Found ${interviewCount} interviews`)
    
    // Test BPOC database
    console.log('Testing BPOC database...')
    const candidatesResult = await queryBPOC('SELECT COUNT(*) as count FROM users')
    console.log(`✅ BPOC DB: Found ${candidatesResult.rows[0].count} candidates`)
    
    console.log('🎉 All database connections successful!')
  } catch (error) {
    console.error('❌ Database connection error:', error)
  }
}

testConnections()
```

Run it:
```bash
npx tsx test-db-connection.ts
```

---

### Security Best Practices

1. **Never commit `.env` files** to version control
   ```gitignore
   # .gitignore
   .env
   .env.local
   .env.*.local
   ```

2. **Use different credentials** for development and production

3. **Rotate secrets regularly** in production

4. **Use environment-specific variables**:
   - `.env.local` - Local development (gitignored)
   - `.env.production` - Production (set in hosting platform)
   - `.env.example` - Template without secrets (committed)

5. **Use a secrets manager** in production:
   - Railway: Built-in environment variables
   - Supabase: Project settings
   - Vercel: Environment variables
   - AWS: AWS Secrets Manager
   - HashiCorp Vault

---

---

## 📁 File Structure

```
app/
├── api/
│   ├── admin/
│   │   └── recruitment/
│   │       └── interviews/
│   │           ├── route.ts                    # GET all interviews
│   │           ├── hire/
│   │           │   └── route.ts                # POST send job offer
│   │           ├── confirm-acceptance/
│   │           │   └── route.ts                # POST finalize hire
│   │           ├── mark-declined/
│   │           │   └── route.ts                # POST mark declined
│   │           └── [id]/
│   │               ├── schedule/
│   │               │   └── route.ts            # PATCH schedule
│   │               ├── complete/
│   │               │   └── route.ts            # PATCH complete
│   │               ├── cancel/
│   │               │   └── route.ts            # PATCH cancel
│   │               ├── undo-cancel/
│   │               │   └── route.ts            # PATCH undo
│   │               └── notes/
│   │                   └── route.ts            # POST add notes
│   └── client/
│       └── interviews/
│           ├── route.ts                        # GET client's interviews
│           ├── request/
│           │   └── route.ts                    # POST request interview
│           ├── hire-request/
│           │   └── route.ts                    # POST request hire
│           ├── reschedule/
│           │   └── route.ts                    # POST reschedule
│           └── cancel/
│               └── route.ts                    # POST cancel
├── admin/
│   └── recruitment/
│       └── page.tsx                            # Admin interviews UI
└── client/
    ├── recruitment/
    │   └── page.tsx                            # Client interviews UI
    └── talent-pool/
        └── [id]/
            └── page.tsx                        # Candidate profile page

lib/
├── auth.ts                                     # NextAuth configuration
├── prisma.ts                                   # Prisma client
└── bpoc-db.ts                                  # BPOC database connection

prisma/
└── schema.prisma                               # Database schema
```

---

## 🎨 Key UI Components

### Admin Interview Card (Statuses & Actions)

```typescript
// Status-based color coding
const getStatusColor = (status: string) => {
  switch(status) {
    case 'pending': return 'yellow'
    case 'scheduled': return 'blue'
    case 'reschedule-requested': return 'amber'
    case 'hire-requested': return 'orange'
    case 'offer-sent': return 'indigo'
    case 'offer-accepted': return 'emerald'
    case 'offer-declined': return 'red'
    case 'hired': return 'purple'
    case 'completed': return 'green'
    case 'cancelled': return 'gray'
    case 'rejected': return 'slate'
    default: return 'gray'
  }
}

// Action buttons based on status
{status === 'pending' && (
  <Button onClick={handleSchedule}>Schedule Interview</Button>
)}
{status === 'scheduled' && (
  <Button onClick={handleComplete}>Mark as Completed</Button>
)}
{status === 'hire-requested' && (
  <Button onClick={handleSendOffer}>Send Job Offer</Button>
)}
{status === 'offer-sent' && (
  <>
    <Button onClick={handleConfirmAcceptance}>Confirm Acceptance</Button>
    <Button onClick={handleMarkDeclined}>Mark Declined</Button>
  </>
)}
```

### Client Interview Status Display

```typescript
// Status messages for clients
const getClientStatusMessage = (status: string) => {
  switch(status) {
    case 'pending':
      return "Waiting for coordination. You'll be notified once a time is confirmed."
    case 'scheduled':
      return "Interview has been scheduled. Check the interviews tab for meeting details."
    case 'reschedule-requested':
      return "Your reschedule request has been submitted."
    case 'completed':
      return "Interview complete. You can now request to hire this candidate."
    case 'hire-requested':
      return "Your hire request has been submitted to our admin team."
    case 'offer-sent':
      return "A formal job offer has been sent to the candidate."
    case 'offer-accepted':
      return "Great news! The candidate has accepted your job offer."
    case 'hired':
      return "Candidate hired and moving forward with onboarding."
    default:
      return "Status unknown"
  }
}
```

---

## 🚀 Implementation Steps

### Step 1: Get Database Access

**You DON'T need to create tables** - they already exist in ShoreAgents!

1. **Get DATABASE_URL** (Main database connection string)
   - Ask ShoreAgents admin for the connection string
   - Or check your hosting provider (Railway/Supabase/Heroku)
   - Format: `postgresql://user:pass@host:port/db`

2. **Get BPOC_DATABASE_URL** (Candidate database connection string)
   - This is a separate external database
   - Ask ShoreAgents admin for access credentials
   - Format: `postgresql://user:pass@host:port/bpoc_db`

3. **Set up environment variables**
   ```bash
   # Create .env.local file
   DATABASE_URL="postgresql://..."
   BPOC_DATABASE_URL="postgresql://..."
   AUTH_SECRET="your-32-char-secret"
   AUTH_URL="http://localhost:3000"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

---

### Step 2: Install Dependencies

```bash
# Install required packages
npm install @prisma/client pg
npm install -D prisma

# If not already installed
npm install next-auth
npm install date-fns date-fns-tz
```

---

### Step 3: Set Up Prisma

**Option A: Use existing Prisma schema**
```bash
# Copy the schema from ShoreAgents
# The schema already includes all interview tables

# Generate Prisma Client
npx prisma generate

# Verify connection
npx prisma db pull  # This will show existing tables
```

**Option B: Use provided schema**
The `prisma/schema.prisma` file already exists with all tables defined.

```bash
# Just generate the client
npx prisma generate
```

---

### Step 4: Set Up BPOC Database Connection

Create `lib/bpoc-db.ts`:

```typescript
import { Pool } from 'pg'

// Create connection pool for BPOC database
const pool = new Pool({
  connectionString: process.env.BPOC_DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
})

// Query helper
export async function queryBPOC<T = any>(sql: string, params?: any[]) {
  const client = await pool.connect()
  try {
    const result = await client.query<T>(sql, params)
    return result
  } finally {
    client.release()
  }
}

// Get candidate by ID
export async function getCandidateById(candidateId: string) {
  const sql = `
    SELECT 
      u.id, u.first_name, u.last_name, u.email, u.phone,
      u.avatar_url, u.position, u.location_city, u.location_country,
      re.resume_data,
      dps.latest_primary_type, dps.latest_secondary_type,
      dps.latest_d_score, dps.latest_i_score, 
      dps.latest_s_score, dps.latest_c_score,
      ths.latest_wpm, ths.latest_accuracy,
      air.overall_score, air.key_strengths
    FROM users u
    LEFT JOIN resumes_extracted re ON u.id = re.user_id
    LEFT JOIN disc_personality_stats dps ON u.id = dps.user_id
    LEFT JOIN typing_hero_stats ths ON u.id = ths.user_id
    LEFT JOIN ai_analysis_results air ON u.id = air.user_id
    WHERE u.id = $1
  `
  
  const result = await queryBPOC(sql, [candidateId])
  return result.rows[0] || null
}
```

---

### Step 5: Test Database Connections

Create `test-connection.ts`:

```typescript
import { prisma } from './lib/prisma'
import { getCandidateById } from './lib/bpoc-db'

async function testConnection() {
  try {
    // Test main database
    console.log('Testing main database...')
    const interviews = await prisma.interview_requests.findMany({
      take: 5
    })
    console.log(`✅ Found ${interviews.length} interviews`)
    
    // Test BPOC database
    console.log('\nTesting BPOC database...')
    if (interviews[0]?.bpocCandidateId) {
      const candidate = await getCandidateById(interviews[0].bpocCandidateId)
      console.log(`✅ Found candidate: ${candidate?.first_name}`)
    }
    
    console.log('\n🎉 All connections working!')
  } catch (error) {
    console.error('❌ Connection error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
```

Run:
```bash
npx tsx test-connection.ts
```

---

### Step 6: Copy API Routes

Copy the API route files from the ShoreAgents repository:

```
app/api/
├── admin/
│   └── recruitment/
│       └── interviews/
│           ├── route.ts                    # GET all interviews
│           ├── hire/route.ts               # POST send offer
│           ├── confirm-acceptance/route.ts # POST finalize
│           └── [id]/
│               ├── schedule/route.ts       # PATCH schedule
│               ├── complete/route.ts       # PATCH complete
│               └── cancel/route.ts         # PATCH cancel
└── client/
    └── interviews/
        ├── route.ts                        # GET client interviews
        └── request/route.ts                # POST request interview
```

All these files are provided in the ShoreAgents codebase and work with the existing database structure.

---

### Step 7: Build UI Components

Copy the UI components from ShoreAgents:

**Admin Page**:
- `app/admin/recruitment/page.tsx` - Full admin interviews tab

**Client Page**:
- `app/client/recruitment/page.tsx` - Client interviews view
- `app/client/talent-pool/[id]/page.tsx` - Candidate profile with "Request Interview" button

All UI components are already styled and functional.

---

### Step 8: Set Up Authentication

Ensure your NextAuth configuration includes role-based access:

```typescript
// lib/auth.ts
import NextAuth from 'next-auth'

export const { handlers, auth, signIn, signOut } = NextAuth({
  // ... your config
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    }
  }
})
```

---

### Step 9: Verify Everything Works

**Test Checklist**:

```bash
# 1. Database connections work
npx tsx test-connection.ts

# 2. Prisma client generated
npx prisma generate

# 3. Environment variables set
echo $DATABASE_URL
echo $BPOC_DATABASE_URL

# 4. Start your app
npm run dev

# 5. Test admin access
# Navigate to: http://localhost:3000/admin/recruitment?tab=interviews

# 6. Test client access  
# Navigate to: http://localhost:3000/client/recruitment?tab=interviews
```

---

### Step 10: Optional Enhancements

**Add email notifications** (optional):
```bash
npm install @sendgrid/mail
# or
npm install nodemailer
```

**Add video call integration** (optional):
```bash
npm install @daily-co/daily-js
# Set DAILY_API_KEY in .env
```

---

---

## 📊 Admin Dashboard Stats

```typescript
// Calculate interview statistics
const stats = {
  pending: interviews.filter(i => i.status === 'pending').length,
  offersPending: interviews.filter(i => 
    ['hire-requested', 'offer-sent'].includes(i.status)
  ).length,
  offerAccepted: interviews.filter(i => 
    i.status === 'offer-accepted'
  ).length,
  completed: interviews.filter(i => i.status === 'completed').length,
  hired: interviews.filter(i => i.status === 'hired').length
}
```

---

## 🔔 Optional: Email Notifications

Consider adding email notifications for:
- Client: Interview scheduled
- Client: Offer accepted/declined
- Admin: New interview request
- Admin: Hire requested
- Candidate: Job offer received

Use services like:
- SendGrid
- AWS SES
- Resend
- Postmark

---

## 🎯 Key Features

### 1. **Timezone Handling**
- Store client timezone in `client_profiles`
- Display times in both client timezone and PH time
- Convert times using `date-fns-tz` or similar

### 2. **Work Schedule Flexibility**
- Support Mon-Fri standard schedule
- Support custom hours per day
- Calculate end time (start + 9 hours including break)

### 3. **Interview Notes**
- Admin can add notes at any stage
- Notes are timestamped
- Notes visible only to admin

### 4. **Status Transitions**
```
PENDING → SCHEDULED → COMPLETED → HIRE_REQUESTED → 
OFFER_SENT → OFFER_ACCEPTED → HIRED
```

Alternative paths:
```
PENDING → CANCELLED
SCHEDULED → RESCHEDULE_REQUESTED → SCHEDULED
COMPLETED → REJECTED
OFFER_SENT → OFFER_DECLINED
```

---

## 🔒 Security Considerations

1. **Authentication**: Verify user role on every API call
2. **Authorization**: Clients can only access their own interviews
3. **Input Validation**: Sanitize all user inputs
4. **SQL Injection**: Use parameterized queries (Prisma handles this)
5. **Rate Limiting**: Prevent abuse of interview requests

---

## 📝 Testing Checklist

- [ ] Client can request interview
- [ ] Admin can see all interview requests
- [ ] Admin can schedule interview
- [ ] Client receives scheduled interview details
- [ ] Admin can mark interview complete
- [ ] Client can request to hire
- [ ] Admin can send job offer
- [ ] Admin can finalize hire
- [ ] Status updates correctly at each stage
- [ ] Timezones display correctly
- [ ] Work schedules save correctly
- [ ] Notes system works
- [ ] Cancellation and reschedule work
- [ ] BPOC candidate data fetches correctly

---

## 🐛 Common Issues & Solutions

### Issue: "interview_requests table does not exist"
**Solution**: Run Prisma migration
```bash
npx prisma migrate dev
```

### Issue: Can't fetch candidate from BPOC
**Solution**: Check `BPOC_DATABASE_URL` is correct and database is accessible

### Issue: Timezone conversion wrong
**Solution**: Ensure you're storing IANA timezone names (e.g., "America/New_York" not "EST")

### Issue: Work schedule not saving
**Solution**: Check JSONB column type in PostgreSQL, use `JSON.stringify()` when saving

---

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Guide](https://next-auth.js.org)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)
- [IANA Timezone Database](https://www.iana.org/time-zones)

---

## 💡 Tips

1. **Use UUIDs** for all IDs to prevent conflicts
2. **Log everything** - helps debug issues in production
3. **Validate timezones** - ensure they're valid IANA names
4. **Test with different timezones** - use VPN or timezone utilities
5. **Add indexes** - especially on `status` and `clientUserId`
6. **Cache BPOC data** - consider Redis for frequently accessed candidates
7. **Monitor performance** - external DB calls can be slow
8. **Handle connection errors** - BPOC database might be unavailable

---

## 🎓 Example: Full Interview Flow Code

```typescript
// 1. CLIENT: Request Interview
const requestInterview = async (candidateId: string) => {
  const response = await fetch('/api/client/interviews/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bpoc_candidate_id: candidateId,
      preferred_times: [
        {
          datetime: '2025-12-15T09:00',
          timezone: 'Australia/Brisbane',
          timezoneDisplay: 'Brisbane Time (AEST)'
        }
      ],
      client_notes: 'Looking forward to the interview',
      client_timezone: 'Australia/Brisbane'
    })
  })
  return response.json()
}

// 2. ADMIN: Schedule Interview
const scheduleInterview = async (interviewId: string) => {
  const response = await fetch(`/api/admin/recruitment/interviews/${interviewId}/schedule`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scheduledTime: '2025-12-15T09:00:00Z',
      meetingLink: 'https://daily.co/interview-123',
      adminNotes: 'Scheduled for first available time'
    })
  })
  return response.json()
}

// 3. ADMIN: Mark Complete
const completeInterview = async (interviewId: string) => {
  const response = await fetch(`/api/admin/recruitment/interviews/${interviewId}/complete`, {
    method: 'PATCH'
  })
  return response.json()
}

// 4. CLIENT: Request Hire
const requestHire = async (interviewId: string) => {
  const response = await fetch('/api/client/interviews/hire-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      interviewRequestId: interviewId,
      preferredStartDate: '2025-12-20',
      workSchedule: {
        workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        workStartTime: '09:00',
        isMonToFri: true,
        hasCustomHours: false,
        customHours: null
      }
    })
  })
  return response.json()
}

// 5. ADMIN: Send Offer
const sendOffer = async (interviewId: string, candidateData: any) => {
  const response = await fetch('/api/admin/recruitment/interviews/hire', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      interviewRequestId: interviewId,
      position: candidateData.position,
      companyId: candidateData.companyId,
      candidateEmail: candidateData.email,
      candidatePhone: candidateData.phone,
      bpocCandidateId: candidateData.id,
      clientPreferredStart: '2025-12-20',
      salary: 30000,
      shiftType: 'DAY_SHIFT',
      workLocation: 'WORK_FROM_HOME',
      hmoIncluded: true,
      leaveCredits: 15,
      clientTimezone: 'Australia/Brisbane',
      workHours: '9 hours including 1 hour break',
      workSchedule: {
        workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        workStartTime: '09:00',
        isMonToFri: true,
        clientTimezone: 'Australia/Brisbane',
        hasCustomHours: false,
        customHours: null
      }
    })
  })
  return response.json()
}

// 6. ADMIN: Finalize Hire
const finalizeHire = async (interviewId: string, staffEmail: string) => {
  const response = await fetch('/api/admin/recruitment/interviews/confirm-acceptance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      interviewRequestId: interviewId,
      bpocCandidateId: 'candidate-uuid',
      confirmedStartDate: '2025-12-20',
      staffEmail: staffEmail,
      adminNotes: 'All documents verified, ready to start'
    })
  })
  return response.json()
}
```

---

This guide provides everything you need to implement the complete interview and hiring system. Good luck with your implementation! 🚀

