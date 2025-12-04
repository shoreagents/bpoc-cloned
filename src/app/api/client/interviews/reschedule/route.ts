/**
 * POST /api/client/interviews/reschedule
 * Client requests to reschedule an interview
 */

import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { RescheduleInterviewBody } from '@/types/interview'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function POST(req: NextRequest) {
  try {
    const body: RescheduleInterviewBody = await req.json()
    
    const {
      interviewRequestId,
      newPreferredTimes,
      rescheduleNotes,
    } = body

    if (!interviewRequestId || !newPreferredTimes || newPreferredTimes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const client = await pool.connect()

    try {
      const result = await client.query(
        `
        UPDATE interview_requests
        SET 
          status = 'RESCHEDULE_REQUESTED',
          preferred_times = $1,
          client_notes = CASE 
            WHEN client_notes IS NULL THEN $2
            ELSE client_notes || '\n\nReschedule request: ' || $2
          END,
          updated_at = NOW()
        WHERE id = $3
        RETURNING *
        `,
        [
          JSON.stringify(newPreferredTimes),
          rescheduleNotes || 'Client requested to reschedule',
          interviewRequestId,
        ]
      )

      if (result.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Interview request not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Reschedule request submitted successfully',
        interview: result.rows[0],
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error rescheduling interview:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reschedule interview',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

