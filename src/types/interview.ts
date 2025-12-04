/**
 * Interview System Types
 * Type definitions for the interview request and hiring system
 */

export type InterviewStatus =
  | 'PENDING'
  | 'SCHEDULED'
  | 'RESCHEDULE_REQUESTED'
  | 'COMPLETED'
  | 'HIRE_REQUESTED'
  | 'OFFER_SENT'
  | 'OFFER_ACCEPTED'
  | 'OFFER_DECLINED'
  | 'HIRED'
  | 'REJECTED'
  | 'CANCELLED'

export interface PreferredTime {
  datetime: string // ISO 8601 format
  timezone: string // IANA timezone
  timezoneDisplay: string // Human-readable timezone
}

export interface WorkSchedule {
  workDays: string[]
  workStartTime: string | null
  isMonToFri: boolean
  clientTimezone: string
  hasCustomHours: boolean
  customHours: Record<string, string> | null
}

export interface InterviewRequest {
  id: string
  clientUserId: string
  bpocCandidateId: string
  candidateFirstName: string
  preferredTimes: PreferredTime[]
  clientNotes: string | null
  createdAt: Date
  updatedAt: Date
  adminNotes: string | null
  clientPreferredStart: Date | null
  finalStartDate: Date | null
  hireRequestedAt: Date | null
  hireRequestedBy: string | null
  meetingLink: string | null
  offerDeclineReason: string | null
  offerResponseAt: Date | null
  offerSentAt: Date | null
  scheduledTime: Date | null
  status: InterviewStatus
  workSchedule: WorkSchedule | null
  clientTimezone: string | null
}

export interface InterviewRequestWithDetails extends InterviewRequest {
  client_name: string
  client_email: string
  client_phone: string | null
  company_name: string
  candidate_avatar_url: string | null
  candidate_position: string | null
  candidate_location: string | null
  candidate_email: string | null
  candidate_phone: string | null
  candidate_full_name: string
}

export type ShiftType = 'DAY_SHIFT' | 'NIGHT_SHIFT' | 'FLEXIBLE'
export type WorkLocation = 'WORK_FROM_HOME' | 'OFFICE' | 'HYBRID'

export interface JobAcceptance {
  id: string
  interviewRequestId: string
  bpocCandidateId: string
  candidateEmail: string
  candidatePhone: string | null
  position: string
  companyId: string
  acceptedByAdminId: string
  acceptedAt: Date
  signupEmailSent: boolean
  signupEmailSentAt: Date | null
  staffUserId: string | null
  contractSigned: boolean
  contractSignedAt: Date | null
  createdAt: Date
  updatedAt: Date
  clientTimezone: string
  isDefaultSchedule: boolean
  workDays: string[]
  workEndTime: string
  workStartTime: string
  customHours: Record<string, string> | null
  salary: number | null
  shiftType: ShiftType | null
  workLocation: WorkLocation | null
  hmoIncluded: boolean
  leaveCredits: number
  workHours: string | null
  preferredStartDate: Date | null
}

// API Request/Response Types

export interface RequestInterviewBody {
  bpoc_candidate_id: string
  preferred_times: PreferredTime[]
  client_notes: string | null
  client_timezone: string
}

export interface ScheduleInterviewBody {
  scheduledTime: string // ISO 8601
  meetingLink: string
  adminNotes: string
}

export interface HireRequestBody {
  interviewRequestId: string
  preferredStartDate: string // ISO date
  workSchedule: WorkSchedule
}

export interface SendOfferBody {
  interviewRequestId: string
  position: string
  companyId: string
  candidateEmail: string
  candidatePhone: string
  bpocCandidateId: string
  clientPreferredStart: string // ISO date
  salary: number
  shiftType: ShiftType
  workLocation: WorkLocation
  hmoIncluded: boolean
  leaveCredits: number
  clientTimezone: string
  workHours: string
  workSchedule: WorkSchedule
}

export interface ConfirmAcceptanceBody {
  interviewRequestId: string
  bpocCandidateId: string
  confirmedStartDate: string // ISO date
  staffEmail: string
  adminNotes: string
}

export interface MarkDeclinedBody {
  interviewRequestId: string
  declineReason: string
}

export interface RescheduleInterviewBody {
  interviewRequestId: string
  newPreferredTimes: PreferredTime[]
  rescheduleNotes: string
}

export interface CancelInterviewBody {
  interviewRequestId: string
  cancelReason: string
}

export interface AddNotesBody {
  notes: string
}

// API Response Types

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

export interface InterviewsListResponse {
  success: boolean
  interviews: InterviewRequestWithDetails[]
  count: number
}

export interface SingleInterviewResponse {
  success: boolean
  interview: InterviewRequest | InterviewRequestWithDetails
}

export interface JobAcceptanceResponse {
  success: boolean
  message: string
  jobAcceptance: JobAcceptance
  offerDetails: {
    position: string
    companyName: string
    salary: string
    shiftType: string
    workLocation: string
    hmoIncluded: boolean
    leaveCredits: number
    clientTimezone: string
    workHours: string
    preferredStartDate: string
  }
  offerLink: string
  nextSteps: string
}

export interface ConfirmAcceptanceResponse {
  success: boolean
  message: string
  interview: InterviewRequest
  jobAcceptanceId: string
  staffEmail: string
  instructions: string
}

