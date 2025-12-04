import { NextResponse } from 'next/server'
import pool from '@/lib/database'

export async function GET() {
  try {
    // Count active jobs from job_requests table
    const jobRequestsResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM job_requests 
      WHERE status = 'active'
    `)
    const jobRequestsCount = parseInt(jobRequestsResult.rows[0].count || 0)
    
    return NextResponse.json({ 
      active_jobs: jobRequestsCount,
      breakdown: {
        job_requests: jobRequestsCount
      }
    })
  } catch (error) {
    console.error('Error getting active jobs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
