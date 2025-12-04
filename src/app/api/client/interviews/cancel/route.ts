/**
 * POST /api/client/interviews/cancel
 * Client cancels an interview request
 */

import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { CancelInterviewBody } from '@/types/interview'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function POST(req: NextRequest) {
  try {
    const body: CancelInterviewBody = await req.json()
    
    const {
      interviewRequestId,
      cancelReason,
    } = body

    if (!interviewRequestId) {
      return NextResponse.json(
        { success: false, error: 'Interview request ID is required' },
        { status: 400 }
      )
    }

    const client = await pool.connect()

    try {
      const result = await client.query(
        `
        UPDATE interview_requests
        SET 
          status = 'CANCELLED',
          client_notes = CASE 
            WHEN client_notes IS NULL THEN $1
            ELSE client_notes || '\n\nCancellation reason: ' || $1
          END,
          updated_at = NOW()
        WHERE id = $2
        RETURNING *
        `,
        [cancelReason || 'No reason provided', interviewRequestId]
      )

      if (result.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Interview request not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Interview cancelled successfully',
        interview: result.rows[0],
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error cancelling interview:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cancel interview',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

