# 📊 Interview System - Database Tables Reference

## Overview
This document details all database tables used in the Admin Interviews Tab, including their fields, relationships, and how they connect together.

---

## 🗄️ Local Database Tables

### 1. `interview_requests` (Primary Table)

**Purpose**: Stores all interview requests from clients to candidates.

**Schema**:
```sql
CREATE TABLE interview_requests (
  id                   VARCHAR(255) PRIMARY KEY,
  clientUserId         VARCHAR(255) NOT NULL,
  bpocCandidateId      VARCHAR(255) NOT NULL,
  candidateFirstName   VARCHAR(255) NOT NULL,
  preferredTimes       JSONB NOT NULL,
  clientNotes          TEXT,
  adminNotes           TEXT,
  status               VARCHAR(50) DEFAULT 'PENDING',
  scheduledTime        TIMESTAMP,
  meetingLink          TEXT,
  clientPreferredStart TIMESTAMP,
  finalStartDate       TIMESTAMP,
  hireRequestedAt      TIMESTAMP,
  hireRequestedBy      VARCHAR(255),
  offerSentAt          TIMESTAMP,
  offerResponseAt      TIMESTAMP,
  offerDeclineReason   TEXT,
  workSchedule         JSONB,
  clientTimezone       VARCHAR(100),
  createdAt            TIMESTAMP DEFAULT NOW(),
  updatedAt            TIMESTAMP NOT NULL,
  
  FOREIGN KEY (clientUserId) REFERENCES client_users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_interview_requests_client ON interview_requests(clientUserId);
CREATE INDEX idx_interview_requests_status ON interview_requests(status);
CREATE INDEX idx_interview_requests_bpoc_candidate ON interview_requests(bpocCandidateId);
CREATE INDEX idx_interview_requests_updated ON interview_requests(updatedAt DESC);
```

**Fields Breakdown**:

| Field | Type | Description |
|-------|------|-------------|
| `id` | VARCHAR(255) | Primary key (UUID) |
| `clientUserId` | VARCHAR(255) | FK to client_users - who requested the interview |
| `bpocCandidateId` | VARCHAR(255) | Reference to external BPOC database candidate |
| `candidateFirstName` | VARCHAR(255) | Cached candidate name for quick display |
| `preferredTimes` | JSONB | Array of client's preferred interview times |
| `clientNotes` | TEXT | Optional notes from client about interview |
| `adminNotes` | TEXT | Admin notes (timestamped, appended) |
| `status` | VARCHAR(50) | Current interview status (see enum below) |
| `scheduledTime` | TIMESTAMP | When interview is scheduled |
| `meetingLink` | TEXT | Video call link (Daily.co, Zoom, etc.) |
| `clientPreferredStart` | TIMESTAMP | Client's preferred start date for hired candidate |
| `finalStartDate` | TIMESTAMP | Confirmed start date after hiring |
| `hireRequestedAt` | TIMESTAMP | When client requested to hire |
| `hireRequestedBy` | VARCHAR(255) | Who requested hire (client/admin) |
| `offerSentAt` | TIMESTAMP | When job offer was sent |
| `offerResponseAt` | TIMESTAMP | When candidate responded to offer |
| `offerDeclineReason` | TEXT | Reason if candidate declined offer |
| `workSchedule` | JSONB | Work schedule details (days, hours, timezone) |
| `clientTimezone` | VARCHAR(100) | Client's IANA timezone |
| `createdAt` | TIMESTAMP | Record creation timestamp |
| `updatedAt` | TIMESTAMP | Last update timestamp |

**Status Enum Values**:
```typescript
enum InterviewRequestStatus {
  PENDING                 // Waiting for admin to schedule
  SCHEDULED              // Interview time confirmed
  RESCHEDULE_REQUESTED   // Client wants to reschedule
  COMPLETED              // Interview finished
  HIRE_REQUESTED         // Client wants to hire candidate
  OFFER_SENT             // Admin sent job offer to candidate
  OFFER_ACCEPTED         // Candidate accepted offer
  OFFER_DECLINED         // Candidate declined offer
  HIRED                  // Finalized - candidate hired
  REJECTED               // Client rejected candidate
  CANCELLED              // Interview cancelled
}
```

**JSON Field Structures**:

**`preferredTimes`**:
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

**`workSchedule`** (Standard Mon-Fri):
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

**`workSchedule`** (Custom Hours):
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

---

### 2. `job_acceptances` (Offer & Hiring Table)

**Purpose**: Stores job offer details and tracks the hiring process after an offer is sent.

**Schema**:
```sql
CREATE TABLE job_acceptances (
  id                   VARCHAR(255) PRIMARY KEY,
  interviewRequestId   VARCHAR(255) UNIQUE NOT NULL,
  bpocCandidateId      VARCHAR(255) NOT NULL,
  candidateEmail       VARCHAR(255) NOT NULL,
  candidatePhone       VARCHAR(50),
  position             VARCHAR(255) NOT NULL,
  companyId            VARCHAR(255) NOT NULL,
  acceptedByAdminId    VARCHAR(255) NOT NULL,
  acceptedAt           TIMESTAMP DEFAULT NOW(),
  signupEmailSent      BOOLEAN DEFAULT FALSE,
  signupEmailSentAt    TIMESTAMP,
  staffUserId          VARCHAR(255) UNIQUE,
  contractSigned       BOOLEAN DEFAULT FALSE,
  contractSignedAt     TIMESTAMP,
  createdAt            TIMESTAMP DEFAULT NOW(),
  updatedAt            TIMESTAMP NOT NULL,
  
  -- Work Schedule
  clientTimezone       VARCHAR(100) DEFAULT 'UTC',
  isDefaultSchedule    BOOLEAN DEFAULT TRUE,
  workDays             TEXT[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  workStartTime        VARCHAR(10) DEFAULT '09:00',
  workEndTime          VARCHAR(10) DEFAULT '18:00',
  customHours          JSONB,
  
  -- Employment Terms
  salary               DECIMAL(10, 2),
  shiftType            VARCHAR(255),
  workLocation         VARCHAR(255),
  hmoIncluded          BOOLEAN DEFAULT FALSE,
  leaveCredits         INT DEFAULT 12,
  workHours            TEXT,
  preferredStartDate   TIMESTAMP,
  
  FOREIGN KEY (interviewRequestId) REFERENCES interview_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (companyId) REFERENCES company(id),
  FOREIGN KEY (staffUserId) REFERENCES staff_users(id)
);

-- Indexes
CREATE INDEX idx_job_acceptances_interview ON job_acceptances(interviewRequestId);
CREATE INDEX idx_job_acceptances_candidate ON job_acceptances(bpocCandidateId);
CREATE INDEX idx_job_acceptances_staff ON job_acceptances(staffUserId);
CREATE INDEX idx_job_acceptances_company ON job_acceptances(companyId);
```

**Fields Breakdown**:

| Field | Type | Description |
|-------|------|-------------|
| `id` | VARCHAR(255) | Primary key (UUID) |
| `interviewRequestId` | VARCHAR(255) | FK to interview_requests (UNIQUE - one-to-one) |
| `bpocCandidateId` | VARCHAR(255) | BPOC candidate reference |
| `candidateEmail` | VARCHAR(255) | Email for staff account creation |
| `candidatePhone` | VARCHAR(50) | Candidate phone number |
| `position` | VARCHAR(255) | Job position title |
| `companyId` | VARCHAR(255) | FK to company |
| `acceptedByAdminId` | VARCHAR(255) | Admin who processed the hire |
| `acceptedAt` | TIMESTAMP | When offer was accepted |
| `signupEmailSent` | BOOLEAN | Has signup email been sent? |
| `signupEmailSentAt` | TIMESTAMP | When signup email was sent |
| `staffUserId` | VARCHAR(255) | FK to staff_users (set after account created) |
| `contractSigned` | BOOLEAN | Has employment contract been signed? |
| `contractSignedAt` | TIMESTAMP | When contract was signed |
| `clientTimezone` | VARCHAR(100) | Work timezone (IANA format) |
| `isDefaultSchedule` | BOOLEAN | Is this Mon-Fri 9-6 schedule? |
| `workDays` | TEXT[] | Array of work days |
| `workStartTime` | VARCHAR(10) | Start time (HH:mm format) |
| `workEndTime` | VARCHAR(10) | End time (HH:mm format) |
| `customHours` | JSONB | Custom hours per day if applicable |
| `salary` | DECIMAL(10,2) | Monthly salary in PHP |
| `shiftType` | VARCHAR(255) | DAY_SHIFT, NIGHT_SHIFT, FLEXIBLE |
| `workLocation` | VARCHAR(255) | WORK_FROM_HOME, OFFICE, HYBRID |
| `hmoIncluded` | BOOLEAN | HMO coverage from day 1? |
| `leaveCredits` | INT | Leave days per year (default 12) |
| `workHours` | TEXT | Description of work hours |
| `preferredStartDate` | TIMESTAMP | Preferred start date |
| `createdAt` | TIMESTAMP | Record creation timestamp |
| `updatedAt` | TIMESTAMP | Last update timestamp |

**Employment Terms Values**:

**`shiftType`**:
- `DAY_SHIFT` - Standard daytime hours
- `NIGHT_SHIFT` - Night shift hours
- `FLEXIBLE` - Flexible hours
- `ROTATING` - Rotating shifts

**`workLocation`**:
- `WORK_FROM_HOME` - Remote work
- `OFFICE` - On-site work
- `HYBRID` - Mix of remote and office

---

### 3. `client_users` (Client Information)

**Purpose**: Stores client user accounts.

**Relevant Fields**:
```sql
CREATE TABLE client_users (
  id           VARCHAR(255) PRIMARY KEY,
  authUserId   VARCHAR(255) UNIQUE NOT NULL,
  name         VARCHAR(255) NOT NULL,
  email        VARCHAR(255) UNIQUE NOT NULL,
  companyId    VARCHAR(255) NOT NULL,
  role         VARCHAR(50) DEFAULT 'CLIENT',
  isActive     BOOLEAN DEFAULT TRUE,
  createdAt    TIMESTAMP DEFAULT NOW(),
  updatedAt    TIMESTAMP NOT NULL,
  
  FOREIGN KEY (authUserId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (companyId) REFERENCES company(id)
);
```

**Used in Interviews Tab**:
- `id` - To link interviews
- `name` - Client name display
- `email` - Client email display
- `companyId` - To get company info

---

### 4. `client_profiles` (Client Profile Details)

**Purpose**: Extended profile information for clients.

**Relevant Fields**:
```sql
CREATE TABLE client_profiles (
  id              VARCHAR(255) PRIMARY KEY,
  clientUserId    VARCHAR(255) UNIQUE NOT NULL,
  timezone        VARCHAR(100) DEFAULT 'Australia/Brisbane',
  mobilePhone     VARCHAR(50),
  directPhone     VARCHAR(50),
  avatar          TEXT,
  jobTitle        VARCHAR(255),
  department      VARCHAR(255),
  bio             TEXT,
  lastLoginAt     TIMESTAMP,
  createdAt       TIMESTAMP DEFAULT NOW(),
  updatedAt       TIMESTAMP NOT NULL,
  
  FOREIGN KEY (clientUserId) REFERENCES client_users(id) ON DELETE CASCADE
);
```

**Used in Interviews Tab**:
- `timezone` - **Critical!** Used to display times correctly
- `mobilePhone` - Client contact number
- `directPhone` - Alternative contact

---

### 5. `company` (Company Information)

**Purpose**: Stores company/organization details.

**Relevant Fields**:
```sql
CREATE TABLE company (
  id              VARCHAR(255) PRIMARY KEY,
  companyName     VARCHAR(255) NOT NULL,
  industry        VARCHAR(255),
  location        TEXT,
  logo            TEXT,
  website         VARCHAR(500),
  description     TEXT,
  employeeCount   INT,
  foundedYear     INT,
  createdAt       TIMESTAMP DEFAULT NOW(),
  updatedAt       TIMESTAMP NOT NULL
);
```

**Used in Interviews Tab**:
- `id` - To link interviews and job acceptances
- `companyName` - Display company name
- `location` - Company address
- `logo` - Company logo display

---

### 6. `management_users` (Admin Users)

**Purpose**: Stores admin/manager accounts.

**Relevant Fields**:
```sql
CREATE TABLE management_users (
  id           VARCHAR(255) PRIMARY KEY,
  authUserId   VARCHAR(255) UNIQUE NOT NULL,
  name         VARCHAR(255) NOT NULL,
  email        VARCHAR(255) UNIQUE NOT NULL,
  role         VARCHAR(50) NOT NULL, -- 'ADMIN' or 'MANAGER'
  isActive     BOOLEAN DEFAULT TRUE,
  createdAt    TIMESTAMP DEFAULT NOW(),
  updatedAt    TIMESTAMP NOT NULL,
  
  FOREIGN KEY (authUserId) REFERENCES users(id) ON DELETE CASCADE
);
```

**Used in Interviews Tab**:
- `id` - Track who performed actions
- `role` - Verify admin permissions

---

## 🌐 External Database Tables (BPOC)

**Connection**: Separate PostgreSQL database accessed via `BPOC_DATABASE_URL`

### 7. `users` (BPOC - Candidate Profiles)

**Purpose**: Stores candidate profile information in the external BPOC system.

**Schema**:
```sql
-- External BPOC Database
CREATE TABLE users (
  id                VARCHAR(255) PRIMARY KEY,
  email             VARCHAR(255) UNIQUE NOT NULL,
  first_name        VARCHAR(255),
  last_name         VARCHAR(255),
  phone             VARCHAR(50),
  avatar_url        TEXT,
  bio               TEXT,
  position          VARCHAR(255),
  location_city     VARCHAR(255),
  location_country  VARCHAR(255),
  location_province VARCHAR(255),
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP NOT NULL
);
```

**Used in Interviews Tab**:
- `id` - Matches `bpocCandidateId` in interview_requests
- `first_name` - Candidate display name
- `last_name` - Full name
- `email` - Candidate email
- `phone` - Candidate phone
- `avatar_url` - Profile picture
- `position` - Job title/role
- `location_city` - City
- `location_country` - Country

---

### 8. `resumes_extracted` (BPOC - Resume Data)

**Purpose**: Stores parsed resume data in JSON format.

**Schema**:
```sql
-- External BPOC Database
CREATE TABLE resumes_extracted (
  id           VARCHAR(255) PRIMARY KEY,
  user_id      VARCHAR(255) NOT NULL,
  resume_data  JSONB NOT NULL,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP NOT NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**resume_data JSON Structure**:
```json
{
  "summary": "Experienced developer...",
  "skills": ["JavaScript", "React", "Node.js"],
  "experience": [
    {
      "position": "Senior Developer",
      "company": "Tech Corp",
      "duration": "2020-2023",
      "description": "Led development team..."
    }
  ],
  "education": [
    {
      "degree": "Bachelor of Science",
      "institution": "University Name",
      "year": "2020"
    }
  ],
  "certifications": ["AWS Certified", "Google Cloud"],
  "languages": [
    {
      "language": "English",
      "proficiency": "Native"
    }
  ]
}
```

---

### 9. `disc_personality_stats` (BPOC - DISC Assessment)

**Purpose**: Stores DISC personality assessment results.

**Schema**:
```sql
-- External BPOC Database
CREATE TABLE disc_personality_stats (
  id                      VARCHAR(255) PRIMARY KEY,
  user_id                 VARCHAR(255) UNIQUE NOT NULL,
  latest_primary_type     VARCHAR(1),
  latest_secondary_type   VARCHAR(1),
  latest_d_score          INT,
  latest_i_score          INT,
  latest_s_score          INT,
  latest_c_score          INT,
  latest_ai_assessment    TEXT,
  created_at              TIMESTAMP DEFAULT NOW(),
  updated_at              TIMESTAMP NOT NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Used in Interviews Tab**:
- `latest_primary_type` - Primary DISC type (D/I/S/C)
- `latest_secondary_type` - Secondary DISC type
- `latest_d_score` - Dominance score (0-100)
- `latest_i_score` - Influence score (0-100)
- `latest_s_score` - Steadiness score (0-100)
- `latest_c_score` - Conscientiousness score (0-100)
- `latest_ai_assessment` - AI-generated personality description

---

### 10. `typing_hero_stats` (BPOC - Typing Metrics)

**Purpose**: Stores typing speed test results.

**Schema**:
```sql
-- External BPOC Database
CREATE TABLE typing_hero_stats (
  id               VARCHAR(255) PRIMARY KEY,
  user_id          VARCHAR(255) UNIQUE NOT NULL,
  latest_wpm       INT,
  latest_accuracy  DECIMAL(5,2),
  best_wpm         INT,
  best_accuracy    DECIMAL(5,2),
  total_tests      INT DEFAULT 0,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP NOT NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Used in Interviews Tab**:
- `latest_wpm` - Current words per minute
- `latest_accuracy` - Current accuracy %
- `best_wpm` - Best WPM achieved
- `best_accuracy` - Best accuracy achieved

---

### 11. `ai_analysis_results` (BPOC - AI Analysis)

**Purpose**: Stores AI-generated candidate analysis.

**Schema**:
```sql
-- External BPOC Database
CREATE TABLE ai_analysis_results (
  id                  VARCHAR(255) PRIMARY KEY,
  user_id             VARCHAR(255) UNIQUE NOT NULL,
  overall_score       INT,
  key_strengths       TEXT[],
  strengths_analysis  JSONB,
  improved_summary    TEXT,
  salary_analysis     TEXT,
  career_path         TEXT,
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP NOT NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Used in Interviews Tab**:
- `overall_score` - AI assessment score (0-100)
- `key_strengths` - Array of key strengths
- `strengths_analysis` - Detailed analysis

---

## 🔗 Table Relationships

### Relationship Diagram

```
┌─────────────────────┐
│  interview_requests │ (Primary)
└──────────┬──────────┘
           │
           ├─→ client_users (clientUserId)
           │   │
           │   ├─→ company (companyId)
           │   │   └─ Displays: companyName, location, logo
           │   │
           │   └─→ client_profiles (clientUserId)
           │       └─ Displays: timezone, mobilePhone, directPhone
           │
           ├─→ job_acceptances (interviewRequestId) [one-to-one]
           │   │
           │   ├─→ company (companyId)
           │   │
           │   └─→ staff_users (staffUserId) [after hire]
           │
           └─→ BPOC.users (bpocCandidateId) [external]
               │
               ├─→ BPOC.resumes_extracted (user_id)
               ├─→ BPOC.disc_personality_stats (user_id)
               ├─→ BPOC.typing_hero_stats (user_id)
               └─→ BPOC.ai_analysis_results (user_id)
```

### Join Logic

**Main Query** (Prisma):
```typescript
const interviews = await prisma.interview_requests.findMany({
  include: {
    client_users: {
      include: {
        company: true,
        client_profiles: true
      }
    }
  },
  orderBy: {
    updatedAt: 'desc'
  }
})
```

**BPOC Data Fetch** (for each interview):
```typescript
const candidate = await getCandidateById(interview.bpocCandidateId)
// Returns joined data from BPOC users, resumes_extracted, 
// disc_personality_stats, typing_hero_stats, ai_analysis_results
```

---

## 📊 Data Flow in Admin Interviews Tab

### 1. **Fetching Interviews**

```typescript
// Step 1: Fetch from local database
const interviews = await prisma.interview_requests.findMany({
  include: {
    client_users: {
      include: {
        company: true,
        client_profiles: true
      }
    }
  },
  orderBy: { updatedAt: 'desc' }
})

// Step 2: Enrich with BPOC candidate data
const enrichedInterviews = await Promise.all(
  interviews.map(async (interview) => {
    const candidate = await getCandidateById(interview.bpocCandidateId)
    return {
      ...interview,
      // From client_users
      client_name: interview.client_users.name,
      client_email: interview.client_users.email,
      // From client_profiles
      client_phone: interview.client_users.client_profiles?.mobilePhone,
      client_timezone: interview.client_users.client_profiles?.timezone,
      // From company
      company_name: interview.client_users.company.companyName,
      company_location: interview.client_users.company.location,
      // From BPOC users
      candidate_avatar_url: candidate?.avatar_url,
      candidate_position: candidate?.position,
      candidate_location: `${candidate?.location_city}, ${candidate?.location_country}`,
      candidate_email: candidate?.email,
      candidate_phone: candidate?.phone
    }
  })
)
```

### 2. **Status-Based Filtering**

The admin interviews tab displays statistics based on status:

```typescript
const stats = {
  pending: interviews.filter(i => i.status === 'PENDING').length,
  
  offersPending: interviews.filter(i => 
    ['HIRE_REQUESTED', 'OFFER_SENT'].includes(i.status)
  ).length,
  
  offerAccepted: interviews.filter(i => 
    i.status === 'OFFER_ACCEPTED'
  ).length,
  
  completed: interviews.filter(i => 
    i.status === 'COMPLETED'
  ).length,
  
  hired: interviews.filter(i => 
    i.status === 'HIRED'
  ).length
}
```

### 3. **Candidate Data Display**

Information displayed for each interview:

```typescript
// From interview_requests
- Interview status
- Preferred times
- Client notes
- Admin notes
- Scheduled time
- Meeting link

// From client_users + company + client_profiles
- Client name
- Client email
- Client phone
- Client timezone
- Company name
- Company location

// From BPOC (external)
- Candidate name
- Candidate avatar
- Candidate position
- Candidate location
- Candidate email
- Candidate phone
- DISC personality type
- Typing speed (WPM)
- Resume data

// From job_acceptances (if offer sent)
- Job position
- Salary
- Shift type
- Work location
- HMO inclusion
- Leave credits
- Work schedule
- Start date
```

---

## 🔍 Query Examples

### Get All Interviews with Full Details

```sql
-- Local database query
SELECT 
  ir.*,
  cu.name as client_name,
  cu.email as client_email,
  co.companyName as company_name,
  co.location as company_location,
  cp.timezone as client_timezone,
  cp.mobilePhone as client_phone
FROM interview_requests ir
LEFT JOIN client_users cu ON ir.clientUserId = cu.id
LEFT JOIN company co ON cu.companyId = co.id
LEFT JOIN client_profiles cp ON cu.id = cp.clientUserId
ORDER BY ir.updatedAt DESC;
```

### Get Candidate Details from BPOC

```sql
-- BPOC database query
SELECT 
  u.id,
  u.first_name,
  u.last_name,
  u.email,
  u.phone,
  u.avatar_url,
  u.position,
  u.location_city,
  u.location_country,
  re.resume_data,
  dps.latest_primary_type,
  dps.latest_secondary_type,
  dps.latest_d_score,
  dps.latest_i_score,
  dps.latest_s_score,
  dps.latest_c_score,
  ths.latest_wpm,
  ths.latest_accuracy,
  air.overall_score
FROM users u
LEFT JOIN resumes_extracted re ON u.id = re.user_id
LEFT JOIN disc_personality_stats dps ON u.id = dps.user_id
LEFT JOIN typing_hero_stats ths ON u.id = ths.user_id
LEFT JOIN ai_analysis_results air ON u.id = air.user_id
WHERE u.id = $1;
```

### Get Job Acceptance Details

```sql
-- Local database query
SELECT 
  ja.*,
  co.companyName,
  co.location as company_location
FROM job_acceptances ja
LEFT JOIN company co ON ja.companyId = co.id
WHERE ja.interviewRequestId = $1;
```

---

## 📝 Important Notes

### 1. **Two Databases**
- **Local Database**: Stores interview requests, job acceptances, client data
- **BPOC Database**: External database with candidate profiles and assessments
- Connection via `BPOC_DATABASE_URL` environment variable

### 2. **Timezone Handling**
- Always stored in IANA format (e.g., "America/New_York", "Australia/Brisbane")
- Critical for displaying interview times correctly
- Stored in both `interview_requests.clientTimezone` and `client_profiles.timezone`

### 3. **JSON Fields**
- `preferredTimes` - Array of time objects
- `workSchedule` - Work schedule configuration
- `customHours` - Custom hours per day (in job_acceptances)
- `resume_data` - Full resume in BPOC database

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

### 5. **One-to-One Relationship**
- `interview_requests` ↔ `job_acceptances` is one-to-one
- `job_acceptances.interviewRequestId` is UNIQUE
- Job acceptance created when admin sends offer

### 6. **Admin Notes**
- Timestamped and appended (never overwritten)
- Format: `(Action) MM/DD/YYYY HH:MM:SS AM/PM - Note text`
- Example: `(Scheduled) 12/15/2025 09:30:45 AM - Scheduled for first available time`

---

## 🔐 Access Patterns

### Admin Access
- Can view ALL interview requests
- Can modify ANY interview status
- Can add notes to ANY interview
- Can send offers and finalize hires

### Client Access
- Can only view THEIR OWN interview requests
- Can request interviews
- Can request to hire
- Can request reschedule
- Can cancel their own interviews
- Cannot see admin notes

---

## 🚀 Performance Considerations

### Indexes
All critical queries are indexed:
- `interview_requests.clientUserId` - Client's interviews
- `interview_requests.status` - Status filtering
- `interview_requests.bpocCandidateId` - Candidate lookup
- `interview_requests.updatedAt` - Recent interviews
- `job_acceptances.interviewRequestId` - Job acceptance lookup

### BPOC Query Optimization
- Use connection pooling (pg Pool)
- Set query timeouts (30 seconds)
- Cache frequently accessed candidate data
- Consider Redis for candidate profile caching

### Large Dataset Handling
- Paginate interview list (100 per page)
- Lazy load candidate details
- Use debounced search
- Implement virtual scrolling for large lists

---

## 📚 Reference

### Prisma Schema Snippet

```prisma
model interview_requests {
  id                   String                 @id
  clientUserId         String
  bpocCandidateId      String
  candidateFirstName   String
  preferredTimes       Json
  clientNotes          String?
  createdAt            DateTime               @default(now())
  updatedAt            DateTime
  adminNotes           String?
  clientPreferredStart DateTime?
  finalStartDate       DateTime?
  hireRequestedAt      DateTime?
  hireRequestedBy      String?
  meetingLink          String?
  offerDeclineReason   String?
  offerResponseAt      DateTime?
  offerSentAt          DateTime?
  scheduledTime        DateTime?
  status               InterviewRequestStatus @default(PENDING)
  workSchedule         Json?
  clientTimezone       String?
  client_users         client_users           @relation(fields: [clientUserId], references: [id], onDelete: Cascade)
  job_acceptances      job_acceptances?
}

model job_acceptances {
  id                   String                @id
  interviewRequestId   String                @unique
  bpocCandidateId      String
  candidateEmail       String
  candidatePhone       String?
  position             String
  companyId            String
  acceptedByAdminId    String
  acceptedAt           DateTime              @default(now())
  signupEmailSent      Boolean               @default(false)
  signupEmailSentAt    DateTime?
  staffUserId          String?               @unique
  contractSigned       Boolean               @default(false)
  contractSignedAt     DateTime?
  createdAt            DateTime              @default(now())
  updatedAt            DateTime
  clientTimezone       String                @default("UTC")
  isDefaultSchedule    Boolean               @default(true)
  workDays             String[]              @default(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"])
  workEndTime          String                @default("18:00")
  workStartTime        String                @default("09:00")
  customHours          Json?
  salary               Decimal?              @db.Decimal(10, 2)
  shiftType            String?
  workLocation         String?
  hmoIncluded          Boolean               @default(false)
  leaveCredits         Int                   @default(12)
  workHours            String?
  preferredStartDate   DateTime?
  company              company               @relation(fields: [companyId], references: [id])
  interview_requests   interview_requests    @relation(fields: [interviewRequestId], references: [id], onDelete: Cascade)
  staff_users          staff_users?          @relation(fields: [staffUserId], references: [id])
}

enum InterviewRequestStatus {
  PENDING
  APPROVED
  REJECTED
  SCHEDULED
  COMPLETED
  CANCELLED
  RESCHEDULE_REQUESTED
  HIRE_REQUESTED
  OFFER_SENT
  OFFER_ACCEPTED
  OFFER_DECLINED
  HIRED
}
```

---

## 🎯 Summary

**Tables Used in Admin Interviews Tab:**

**Local Database (9 tables):**
1. ✅ `interview_requests` - Main interview data
2. ✅ `job_acceptances` - Job offer and hiring details
3. ✅ `client_users` - Client accounts
4. ✅ `client_profiles` - Client extended info
5. ✅ `company` - Company information
6. ✅ `management_users` - Admin users
7. ⚠️ `staff_users` - Staff accounts (referenced after hire)
8. ⚠️ `employment_contracts` - Contracts (referenced from job_acceptances)
9. ⚠️ `users` - Auth users (referenced by authUserId)

**External BPOC Database (5+ tables):**
10. ✅ `users` - Candidate profiles
11. ✅ `resumes_extracted` - Resume data
12. ✅ `disc_personality_stats` - DISC assessments
13. ✅ `typing_hero_stats` - Typing metrics
14. ✅ `ai_analysis_results` - AI analysis
15. ⚠️ `user_leaderboard_scores` - Overall candidate scores
16. ⚠️ `bpoc_cultural_results` - Cultural fit assessments

**Total: 16 tables** (9 local + 7 external BPOC)

---

This document provides a complete reference for all database tables used in the interview system. Use it as a guide when implementing or troubleshooting the interviews functionality! 🚀

