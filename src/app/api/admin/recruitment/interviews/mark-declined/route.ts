/**
 * POST /api/admin/recruitment/interviews/mark-declined
 * Mark that candidate declined the job offer
 */

import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { MarkDeclinedBody } from '@/types/interview'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function POST(req: NextRequest) {
  try {
    const body: MarkDeclinedBody = await req.json()
    
    const { interviewRequestId, declineReason } = body

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
          status = 'OFFER_DECLINED',
          offer_decline_reason = $1,
          offer_response_at = NOW(),
          updated_at = NOW()
        WHERE id = $2
        RETURNING *
        `,
        [declineReason || 'No reason provided', interviewRequestId]
      )

      if (result.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Interview request not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Offer marked as declined',
        interview: result.rows[0],
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error marking offer as declined:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to mark offer as declined',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

