/**
 * POST /api/client/interviews/hire-request
 * Client requests to hire a candidate after completing interview
 */

import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { HireRequestBody } from '@/types/interview'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function POST(req: NextRequest) {
  try {
    const body: HireRequestBody = await req.json()
    
    const {
      interviewRequestId,
      preferredStartDate,
      workSchedule,
    } = body

    // Validate required fields
    if (!interviewRequestId || !preferredStartDate || !workSchedule) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // TODO: Get client user ID from session and verify they own this interview request
    const clientUserId = 'client-user-id' // Replace with actual client ID from session

    const client = await pool.connect()

    try {
      // Check if interview is completed
      const checkResult = await client.query(
        `
        SELECT status, client_user_id 
        FROM interview_requests 
        WHERE id = $1
        `,
        [interviewRequestId]
      )

      if (checkResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Interview request not found' },
          { status: 404 }
        )
      }

      const interview = checkResult.rows[0]

      if (interview.status !== 'COMPLETED') {
        return NextResponse.json(
          {
            success: false,
            error: 'Interview must be completed before requesting to hire',
          },
          { status: 400 }
        )
      }

      // Update interview request with hire request
      const result = await client.query(
        `
        UPDATE interview_requests
        SET 
          status = 'HIRE_REQUESTED',
          hire_requested_at = NOW(),
          hire_requested_by = $1,
          client_preferred_start = $2,
          work_schedule = $3,
          updated_at = NOW()
        WHERE id = $4
        RETURNING *
        `,
        [
          clientUserId,
          preferredStartDate,
          JSON.stringify(workSchedule),
          interviewRequestId,
        ]
      )

      // TODO: Send notification to admin about hire request

      return NextResponse.json({
        success: true,
        message: 'Hire request submitted successfully. Admin will send job offer to the candidate.',
        interview: result.rows[0],
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error creating hire request:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create hire request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

