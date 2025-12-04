/**
 * GET/POST /api/client/interviews
 * Get client's interview requests or create a new one
 */

import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { RequestInterviewBody } from '@/types/interview'
import { getCandidateById } from '@/lib/bpoc-db'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// GET - Get all interviews for the current client
export async function GET(req: NextRequest) {
  try {
    // TODO: Get client user ID from session
    const clientUserId = 'client-user-id' // Replace with actual client ID from session

    const client = await pool.connect()

    try {
      const result = await client.query(
        `
        SELECT * FROM interview_requests
        WHERE client_user_id = $1
        ORDER BY created_at DESC
        `,
        [clientUserId]
      )

      return NextResponse.json({
        success: true,
        interviews: result.rows,
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error fetching client interviews:', error)
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

// POST - Request a new interview
export async function POST(req: NextRequest) {
  try {
    const body: RequestInterviewBody = await req.json()
    
    const {
      bpoc_candidate_id,
      preferred_times,
      client_notes,
      client_timezone,
    } = body

    // Validate required fields
    if (!bpoc_candidate_id || !preferred_times || preferred_times.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // TODO: Get client user ID from session
    const clientUserId = 'client-user-id' // Replace with actual client ID from session

    // Fetch candidate info from BPOC database
    const candidate = await getCandidateById(bpoc_candidate_id)
    
    if (!candidate) {
      return NextResponse.json(
        { success: false, error: 'Candidate not found' },
        { status: 404 }
      )
    }

    const client = await pool.connect()

    try {
      const result = await client.query(
        `
        INSERT INTO interview_requests (
          client_user_id,
          bpoc_candidate_id,
          candidate_first_name,
          preferred_times,
          client_notes,
          client_timezone,
          status,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', NOW())
        RETURNING *
        `,
        [
          clientUserId,
          bpoc_candidate_id,
          candidate.first_name,
          JSON.stringify(preferred_times),
          client_notes,
          client_timezone,
        ]
      )

      // TODO: Send notification to admin about new interview request

      return NextResponse.json({
        success: true,
        message: 'Interview request submitted successfully',
        request: result.rows[0],
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error creating interview request:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create interview request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

