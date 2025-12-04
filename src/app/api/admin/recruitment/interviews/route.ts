/**
 * GET /api/admin/recruitment/interviews
 * Get all interview requests from ShoreAgents database
 */

import { NextResponse } from 'next/server'
import { getInterviewRequests } from '@/lib/shoreagents-db'
import { getCandidateById } from '@/lib/bpoc-db'

export async function GET() {
  try {
    // TODO: Add authentication check - verify user is admin
    // const session = await getServerSession()
    // if (!session || session.user.role !== 'admin') {
    //   return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    // }

    // Fetch interviews from ShoreAgents database
    const { data: interviews, error } = await getInterviewRequests()

    if (error || !interviews) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch interviews',
          details: error?.message || 'No data returned',
        },
        { status: 500 }
      )
    }

    // Enrich with candidate details from BPOC database
    const interviewsWithDetails = await Promise.all(
      interviews.map(async (interview: any) => {
        try {
          // Fetch candidate from BPOC database
          const candidate = await getCandidateById(interview.bpocCandidateId || interview.bpoc_candidate_id)
          
          return {
            ...interview,
            // Convert snake_case to camelCase for consistency
            id: interview.id,
            clientUserId: interview.client_user_id || interview.clientUserId,
            bpocCandidateId: interview.bpoc_candidate_id || interview.bpocCandidateId,
            candidateFirstName: interview.candidate_first_name || interview.candidateFirstName,
            preferredTimes: interview.preferred_times || interview.preferredTimes,
            clientNotes: interview.client_notes || interview.clientNotes,
            createdAt: interview.created_at || interview.createdAt,
            updatedAt: interview.updated_at || interview.updatedAt,
            adminNotes: interview.admin_notes || interview.adminNotes,
            clientPreferredStart: interview.client_preferred_start || interview.clientPreferredStart,
            finalStartDate: interview.final_start_date || interview.finalStartDate,
            hireRequestedAt: interview.hire_requested_at || interview.hireRequestedAt,
            hireRequestedBy: interview.hire_requested_by || interview.hireRequestedBy,
            meetingLink: interview.meeting_link || interview.meetingLink,
            offerDeclineReason: interview.offer_decline_reason || interview.offerDeclineReason,
            offerResponseAt: interview.offer_response_at || interview.offerResponseAt,
            offerSentAt: interview.offer_sent_at || interview.offerSentAt,
            scheduledTime: interview.scheduled_time || interview.scheduledTime,
            status: interview.status,
            workSchedule: interview.work_schedule || interview.workSchedule,
            clientTimezone: interview.client_timezone || interview.clientTimezone,
            // Add candidate details
            candidate_full_name: candidate?.full_name || interview.candidateFirstName,
            candidate_email: candidate?.email || null,
            candidate_phone: candidate?.phone || null,
            candidate_avatar_url: candidate?.avatar_url || null,
            candidate_position: candidate?.position || null,
            candidate_location: candidate?.location || null,
            // Placeholder for client details - will show from interview data
            client_name: interview.client_name || 'Client',
            client_email: interview.client_email || '',
            client_phone: interview.client_phone || null,
            company_name: interview.company_name || 'Company',
          }
        } catch (error) {
          console.error(`Error fetching candidate:`, error)
          // Return interview without candidate enrichment
          return {
            ...interview,
            candidate_full_name: interview.candidateFirstName || interview.candidate_first_name,
            candidate_email: null,
            candidate_phone: null,
            candidate_avatar_url: null,
            candidate_position: null,
            candidate_location: null,
            client_name: 'Client',
            client_email: '',
            client_phone: null,
            company_name: 'Company',
          }
        }
      })
    )

    return NextResponse.json({
      success: true,
      interviews: interviewsWithDetails,
      count: interviewsWithDetails.length,
    })
  } catch (error) {
    console.error('Error fetching interviews:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch interviews',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

