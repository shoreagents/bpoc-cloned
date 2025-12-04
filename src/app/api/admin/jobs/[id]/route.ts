import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check for Authorization token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, skip user validation in development
    if (process.env.NODE_ENV !== 'development') {
      // TODO: Implement proper token validation and user extraction
      // const userId = await validateToken(authHeader.replace('Bearer ', ''))
      // if (!userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { id } = await params
    const res = await pool.query(
      `SELECT j.*, m.company as company_name
       FROM job_requests j
       LEFT JOIN members m ON m.company_id = j.company_id
       WHERE j.id = $1`,
      [id]
    )
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    
    const job = { ...res.rows[0], company: res.rows[0].company_name || 'ShoreAgents' }
    return NextResponse.json({ job })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 })
  }
}


