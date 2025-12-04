# 🎯 Interview System - Complete Implementation Guide

## Overview
This is a complete guide to implementing the interview request and hiring system used in ShoreAgents. The system handles the entire flow from client interview requests to final candidate hiring.

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

## 🗄️ Database Tables Required

### 1. `interview_requests` Table

**Purpose**: Stores all interview requests from clients

```sql
CREATE TABLE interview_requests (
  id VARCHAR(255) PRIMARY KEY,
  clientUserId VARCHAR(255) NOT NULL,
  bpocCandidateId VARCHAR(255) NOT NULL,
  candidateFirstName VARCHAR(255) NOT NULL,
  preferredTimes JSONB NOT NULL,
  clientNotes TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL,
  adminNotes TEXT,
  clientPreferredStart TIMESTAMP,
  finalStartDate TIMESTAMP,
  hireRequestedAt TIMESTAMP,
  hireRequestedBy VARCHAR(255),
  meetingLink TEXT,
  offerDeclineReason TEXT,
  offerResponseAt TIMESTAMP,
  offerSentAt TIMESTAMP,
  scheduledTime TIMESTAMP,
  status VARCHAR(50) DEFAULT 'PENDING',
  workSchedule JSONB,
  clientTimezone VARCHAR(100),
  FOREIGN KEY (clientUserId) REFERENCES client_users(id) ON DELETE CASCADE
);

CREATE INDEX idx_interview_requests_client ON interview_requests(clientUserId);
CREATE INDEX idx_interview_requests_status ON interview_requests(status);
CREATE INDEX idx_interview_requests_bpoc_candidate ON interview_requests(bpocCandidateId);
```

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

```sql
CREATE TABLE job_acceptances (
  id VARCHAR(255) PRIMARY KEY,
  interviewRequestId VARCHAR(255) UNIQUE NOT NULL,
  bpocCandidateId VARCHAR(255) NOT NULL,
  candidateEmail VARCHAR(255) NOT NULL,
  candidatePhone VARCHAR(50),
  position VARCHAR(255) NOT NULL,
  companyId VARCHAR(255) NOT NULL,
  acceptedByAdminId VARCHAR(255) NOT NULL,
  acceptedAt TIMESTAMP DEFAULT NOW(),
  signupEmailSent BOOLEAN DEFAULT FALSE,
  signupEmailSentAt TIMESTAMP,
  staffUserId VARCHAR(255) UNIQUE,
  contractSigned BOOLEAN DEFAULT FALSE,
  contractSignedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL,
  clientTimezone VARCHAR(100) DEFAULT 'UTC',
  isDefaultSchedule BOOLEAN DEFAULT TRUE,
  workDays TEXT[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  workEndTime VARCHAR(10) DEFAULT '18:00',
  workStartTime VARCHAR(10) DEFAULT '09:00',
  customHours JSONB,
  salary DECIMAL(10, 2),
  shiftType VARCHAR(255),
  workLocation VARCHAR(255),
  hmoIncluded BOOLEAN DEFAULT FALSE,
  leaveCredits INT DEFAULT 12,
  workHours TEXT,
  preferredStartDate TIMESTAMP,
  FOREIGN KEY (interviewRequestId) REFERENCES interview_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (companyId) REFERENCES company(id),
  FOREIGN KEY (staffUserId) REFERENCES staff_users(id)
);

CREATE INDEX idx_job_acceptances_interview ON job_acceptances(interviewRequestId);
CREATE INDEX idx_job_acceptances_candidate ON job_acceptances(bpocCandidateId);
CREATE INDEX idx_job_acceptances_staff ON job_acceptances(staffUserId);
```

**Employment Terms Fields**:
- `salary`: Monthly salary in PHP
- `shiftType`: "DAY_SHIFT", "NIGHT_SHIFT", "FLEXIBLE"
- `workLocation`: "WORK_FROM_HOME", "OFFICE", "HYBRID"
- `hmoIncluded`: Boolean - HMO from day 1
- `leaveCredits`: Number of leave days per year
- `workHours`: Description of work hours (e.g., "9 hours including 1 hour break")

### 3. Supporting Tables

You'll also need these existing tables:
- `client_users` - Client user accounts
- `company` - Client companies
- `staff_users` - Staff/employee accounts
- `management_users` - Admin users

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

```bash
# Main Database (Your Application)
DATABASE_URL="postgresql://user:password@host:port/database"

# BPOC Candidate Database (External)
BPOC_DATABASE_URL="postgresql://user:password@host:port/bpoc_database"

# Authentication
AUTH_SECRET="your-secret-key"
AUTH_URL="http://localhost:3000"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional: Video Call Integration
DAILY_API_KEY="your-daily-api-key"  # If using Daily.co for video interviews
```

### What is BPOC?

BPOC (BPO Candidates) is an **external candidate database** that stores:
- Candidate profiles (name, email, phone, avatar, bio)
- Resumes (extracted data in JSON format)
- Assessment results (DISC personality, typing speed, cultural fit)
- AI analysis (strengths, career recommendations)
- Applications to job postings

**Why separate?** The BPOC database is a talent pool platform where candidates create profiles. Your main application references candidates by `bpocCandidateId` and fetches their data when needed.

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

### 1. Database Setup
```bash
# Add tables to your Prisma schema
# Run migration
npx prisma migrate dev --name add_interview_system
```

### 2. Install Dependencies
```bash
npm install pg  # For BPOC database connection
```

### 3. Configure Environment
- Set up `DATABASE_URL` (main database)
- Set up `BPOC_DATABASE_URL` (candidate database)
- Configure authentication

### 4. Create API Routes
- Copy API route files from this guide
- Implement authentication middleware
- Test each endpoint

### 5. Build UI Components
- Admin interviews page with status filtering
- Client interviews page
- Interview request modals
- Status cards and action buttons

### 6. Add BPOC Integration
- Create `lib/bpoc-db.ts` for candidate data fetching
- Implement `getCandidateById()` function
- Test connection to external database

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

