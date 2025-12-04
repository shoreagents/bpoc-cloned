/**
 * POST /api/admin/recruitment/interviews/confirm-acceptance
 * Confirm that candidate accepted offer and finalize hire
 */

import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { ConfirmAcceptanceBody } from '@/types/interview'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function POST(req: NextRequest) {
  try {
    const body: ConfirmAcceptanceBody = await req.json()
    
    const {
      interviewRequestId,
      bpocCandidateId,
      confirmedStartDate,
      staffEmail,
      adminNotes,
    } = body

    // Validate required fields
    if (!interviewRequestId || !bpocCandidateId || !confirmedStartDate || !staffEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // Update interview request to HIRED status
      const interviewResult = await client.query(
        `
        UPDATE interview_requests
        SET 
          status = 'HIRED',
          final_start_date = $1,
          admin_notes = CASE 
            WHEN admin_notes IS NULL THEN $2
            ELSE admin_notes || '\n\n' || $2
          END,
          updated_at = NOW()
        WHERE id = $3
        RETURNING *
        `,
        [confirmedStartDate, adminNotes || 'Offer accepted and hire finalized', interviewRequestId]
      )

      if (interviewResult.rows.length === 0) {
        throw new Error('Interview request not found')
      }

      // Update job acceptance record
      const jobAcceptanceResult = await client.query(
        `
        SELECT id FROM job_acceptances
        WHERE interview_request_id = $1
        `,
        [interviewRequestId]
      )

      if (jobAcceptanceResult.rows.length === 0) {
        throw new Error('Job acceptance record not found')
      }

      const jobAcceptanceId = jobAcceptanceResult.rows[0].id

      // Mark signup email to be sent
      await client.query(
        `
        UPDATE job_acceptances
        SET 
          signup_email_sent = true,
          signup_email_sent_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
        `,
        [jobAcceptanceId]
      )

      await client.query('COMMIT')

      // TODO: Send email to candidate with staff account creation link
      // await sendStaffAccountCreationEmail(staffEmail, { jobAcceptanceId, ...otherDetails })

      return NextResponse.json({
        success: true,
        message: 'Hire finalized successfully',
        interview: interviewResult.rows[0],
        jobAcceptanceId,
        staffEmail,
        instructions: `Next steps:
1. Send staff account creation link to ${staffEmail}
2. Candidate will create their staff account
3. Onboarding process will begin on ${new Date(confirmedStartDate).toLocaleDateString()}`,
      })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error confirming acceptance:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to confirm acceptance',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

