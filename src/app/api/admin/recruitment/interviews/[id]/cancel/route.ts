/**
 * PATCH /api/admin/recruitment/interviews/[id]/cancel
 * Cancel an interview
 */

import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await req.json()
    const { reason } = body

    const client = await pool.connect()

    try {
      const result = await client.query(
        `
        UPDATE interview_requests
        SET 
          status = 'CANCELLED',
          admin_notes = CASE 
            WHEN admin_notes IS NULL THEN $1
            ELSE admin_notes || '\n\nCancellation reason: ' || $1
          END,
          updated_at = NOW()
        WHERE id = $2
        RETURNING *
        `,
        [reason || 'No reason provided', id]
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

