/**
 * POST /api/admin/recruitment/interviews/hire
 * Send job offer to candidate after hire request from client
 */

import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { SendOfferBody } from '@/types/interview'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function POST(req: NextRequest) {
  try {
    const body: SendOfferBody = await req.json()
    
    const {
      interviewRequestId,
      position,
      companyId,
      candidateEmail,
      candidatePhone,
      bpocCandidateId,
      clientPreferredStart,
      salary,
      shiftType,
      workLocation,
      hmoIncluded,
      leaveCredits,
      clientTimezone,
      workHours,
      workSchedule,
    } = body

    // Validate required fields
    if (!interviewRequestId || !position || !companyId || !candidateEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // Update interview request status to OFFER_SENT
      await client.query(
        `
        UPDATE interview_requests
        SET 
          status = 'OFFER_SENT',
          offer_sent_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
        `,
        [interviewRequestId]
      )

      // Create job acceptance record
      const jobAcceptanceResult = await client.query(
        `
        INSERT INTO job_acceptances (
          interview_request_id,
          bpoc_candidate_id,
          candidate_email,
          candidate_phone,
          position,
          company_id,
          accepted_by_admin_id,
          client_timezone,
          salary,
          shift_type,
          work_location,
          hmo_included,
          leave_credits,
          work_hours,
          preferred_start_date,
          work_days,
          work_start_time,
          custom_hours,
          is_default_schedule,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW()
        )
        RETURNING *
        `,
        [
          interviewRequestId,
          bpocCandidateId,
          candidateEmail,
          candidatePhone,
          position,
          companyId,
          'admin-user-id', // TODO: Replace with actual admin user ID from session
          clientTimezone,
          salary,
          shiftType,
          workLocation,
          hmoIncluded,
          leaveCredits,
          workHours,
          clientPreferredStart,
          workSchedule.workDays,
          workSchedule.workStartTime,
          workSchedule.customHours ? JSON.stringify(workSchedule.customHours) : null,
          workSchedule.isMonToFri,
        ]
      )

      await client.query('COMMIT')

      const jobAcceptance = jobAcceptanceResult.rows[0]

      // TODO: Send email notification to candidate about job offer
      // await sendJobOfferEmail(candidateEmail, offerDetails)

      return NextResponse.json({
        success: true,
        message: 'Job offer sent successfully',
        jobAcceptance,
        offerDetails: {
          position,
          companyName: 'Company Name', // TODO: Fetch from company table
          salary: `₱${salary?.toLocaleString()}/month`,
          shiftType,
          workLocation,
          hmoIncluded,
          leaveCredits,
          clientTimezone,
          workHours,
          preferredStartDate: clientPreferredStart,
        },
        offerLink: `${process.env.NEXT_PUBLIC_APP_URL}/offer/${jobAcceptance.id}`,
        nextSteps: 'Candidate will review the offer and respond. You will be notified once they accept or decline.',
      })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error sending job offer:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send job offer',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

