import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'

export async function DELETE(request: NextRequest) {
  const client = await pool.connect()
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Delete all applications for this user
    await client.query('DELETE FROM applications WHERE user_id = $1', [userId])
    
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete applications' }, { status: 500 })
  } finally {
    client.release()
  }
}

export async function POST(request: NextRequest) {
  const client = await pool.connect()
  let requestBody: any = {};
  try {
    const userId = request.headers.get('x-user-id')
    console.log('📝 Application POST request:', {
      userId,
      hasAuth: !!request.headers.get('authorization'),
      contentType: request.headers.get('content-type')
    })
    
    if (!userId) {
      console.error('❌ Missing x-user-id header')
      return NextResponse.json({ error: 'Unauthorized - User ID required' }, { status: 401 })
    }

    requestBody = await request.json().catch((e) => {
      console.error('❌ Failed to parse request body:', e)
      return {}
    })
    
    console.log('📝 Request body:', { jobId: requestBody?.jobId, resumeId: requestBody?.resumeId, resumeSlug: requestBody?.resumeSlug })
    
    const jobId = requestBody?.jobId
    let resumeId = requestBody?.resumeId
    let resumeSlug = requestBody?.resumeSlug
    
    // Validate and convert resumeId to string (handle UUID format)
    if (resumeId) {
      resumeId = String(resumeId).trim()
    } else {
      resumeId = ''
    }
    
    if (resumeSlug) {
      resumeSlug = String(resumeSlug).trim()
    } else {
      resumeSlug = ''
    }
    
    console.log('📝 Validated input:', { jobId, resumeId, resumeSlug, resumeIdType: typeof resumeId })
    
    if (!jobId) {
      console.error('❌ Missing jobId')
      return NextResponse.json({ error: 'jobId required' }, { status: 400 })
    }
    if (!resumeId || resumeId === '' || resumeId === 'undefined' || resumeId === 'null') {
      console.error('❌ Invalid resumeId:', { resumeId, original: requestBody?.resumeId })
      return NextResponse.json({ error: 'resumeId is required and must be valid' }, { status: 400 })
    }
    if (!resumeSlug || resumeSlug === '' || resumeSlug === 'undefined' || resumeSlug === 'null') {
      console.error('❌ Invalid resumeSlug:', { resumeSlug, original: requestBody?.resumeSlug })
      return NextResponse.json({ error: 'resumeSlug is required and must be valid' }, { status: 400 })
    }

    // Determine job type and validate job exists
    let jobType: 'processed' | 'recruiter' | 'job_request'
    let numericJobId: number | null = null
    let uuidJobId: string | null = null

    // Extract actual database ID (remove prefixes if present)
    let actualJobId = jobId;
    if (typeof jobId === 'string') {
      if (jobId.startsWith('recruiter_')) {
        actualJobId = jobId.replace('recruiter_', '');
      } else if (jobId.startsWith('processed_')) {
        actualJobId = jobId.replace('processed_', '');
      } else if (jobId.startsWith('job_request_')) {
        actualJobId = jobId.replace('job_request_', '');
      }
    }
    
    // Check if it's a UUID (recruiter job) or number (processed/job_request job)
    if (typeof actualJobId === 'string' && actualJobId.includes('-')) {
      // Recruiter jobs removed - reject recruiter job applications
      await client.query('ROLLBACK')
      return NextResponse.json({ error: 'Recruiter jobs have been removed. Cannot apply to this job.' }, { status: 410 })
    } else {
      // It's a number - check which table it's in
      numericJobId = Number(actualJobId)
      
      if (Number.isNaN(numericJobId)) {
        return NextResponse.json({ error: 'Invalid job ID format' }, { status: 400 })
      }
      
      // Check job_requests table
      const jobRequestCheck = await client.query('SELECT id, status FROM job_requests WHERE id = $1', [numericJobId])
      
      if (jobRequestCheck.rows.length > 0) {
        // Job exists in job_requests
        const job = jobRequestCheck.rows[0]
        // Accept both 'active' and 'processed' status jobs (both are active/hiring)
        if (job.status !== 'active' && job.status !== 'processed') {
            return NextResponse.json({ 
              error: 'This job is not available',
              details: 'This job is not active and cannot be applied to.'
            }, { status: 400 })
          }
        jobType = 'job_request'
        console.log('📝 Job found in job_requests:', numericJobId)
      } else {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      }
    }

    // Start transaction for application processing
    // Start transaction for application processing
    // But to be safe, we'll check if we need to start it
    try {
      await client.query('BEGIN')
    } catch (e: any) {
      // If already in transaction, that's fine - continue
      if (!e.message?.includes('already in transaction')) {
        throw e
      }
    }

    // Ensure resume belongs to user
    console.log('📝 Checking resume:', { resumeId, resumeIdType: typeof resumeId, resumeIdLength: resumeId?.length, userId })
    
    // Validate resumeId is a valid UUID format (PostgreSQL UUIDs)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(resumeId)) {
      await client.query('ROLLBACK')
      console.error('❌ Invalid resumeId format (not a UUID):', { resumeId, length: resumeId?.length })
      return NextResponse.json({ error: 'Invalid resume ID format - must be a valid UUID' }, { status: 400 })
    }
    
    const r = await client.query('SELECT id, user_id FROM saved_resumes WHERE id = $1', [resumeId])
    console.log('📝 Resume query result:', { 
      found: r.rows.length > 0, 
      resumeUserId: r.rows[0]?.user_id, 
      requestUserId: userId,
      match: r.rows.length > 0 && String(r.rows[0].user_id) === String(userId)
    })
    
    if (r.rows.length === 0 || String(r.rows[0].user_id) !== String(userId)) {
      await client.query('ROLLBACK')
      console.error('❌ Invalid resume:', { resumeId, resumeUserId: r.rows[0]?.user_id, requestUserId: userId })
      return NextResponse.json({ error: 'Invalid resume - Resume not found or does not belong to user' }, { status: 400 })
    }

    // Check for existing application and insert new one
    let existing, ins
    if (jobType === 'job_request') {
      // Use applications table for job_requests
      console.log('📝 Checking for existing application:', { userId, numericJobId })
      existing = await client.query('SELECT * FROM applications WHERE user_id = $1 AND job_id = $2 LIMIT 1', [userId, numericJobId])
      
      if (existing.rows.length > 0) {
        console.log('✅ Application already exists')
        await client.query('COMMIT')
        return NextResponse.json({ application: existing.rows[0], created: false })
      }

      console.log('📝 Inserting new application:', { userId, numericJobId, resumeId, resumeSlug })
      try {
        ins = await client.query(
          `INSERT INTO applications (user_id, job_id, resume_id, resume_slug, status)
           VALUES ($1, $2, $3, $4, 'submitted')
           RETURNING *`,
          [userId, numericJobId, resumeId, resumeSlug]
        )
        console.log('✅ Application created:', ins.rows[0]?.id)
      } catch (insertError: any) {
        console.error('❌ Error inserting application:', insertError)
        throw insertError
      }
    }
    // Recruiter jobs removed - this branch should never be reached now

    await client.query('COMMIT')
    console.log('✅ Application submitted successfully')
    return NextResponse.json({ application: ins.rows[0], created: true })
  } catch (e: any) {
    try {
      await client.query('ROLLBACK').catch(() => {}) // Ignore rollback errors if transaction already closed
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError)
    }
    
    console.error('❌ Error in applications POST:', e)
    console.error('❌ Error details:', {
      message: e?.message,
      code: e?.code,
      detail: e?.detail,
      constraint: e?.constraint,
      stack: e?.stack,
      userId: request.headers.get('x-user-id'),
      body: requestBody
    })
    
    // Return a proper error response with all available details
    const errorMessage = e?.message || e?.detail || 'Unknown error occurred'
    const errorResponse: any = { 
      error: 'Failed to submit application',
      details: errorMessage,
      code: e?.code || 'UNKNOWN_ERROR'
    }
    
    // Add constraint information if it's a database constraint error
    if (e?.constraint) {
      errorResponse.constraint = e.constraint
    }
    
    // Add more context for foreign key violations
    if (e?.code === '23503') {
      errorResponse.error = 'Database constraint violation'
      errorResponse.details = e.detail || errorMessage
      errorResponse.hint = 'The job or resume may not exist, or there may be a data integrity issue.'
    }
    
    console.error('❌ Returning error response:', JSON.stringify(errorResponse, null, 2))
    
    try {
      return NextResponse.json(errorResponse, { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    } catch (jsonError) {
      console.error('❌ Failed to create JSON response:', jsonError)
      // Fallback to plain text if JSON fails
      return new NextResponse(
        JSON.stringify(errorResponse),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }
  } finally {
    try {
      client.release()
    } catch (releaseError) {
      console.error('Error releasing database connection:', releaseError)
    }
  }
}


