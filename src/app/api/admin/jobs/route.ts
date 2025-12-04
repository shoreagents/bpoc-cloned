import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'

function capitalize(s: string): string { return !s ? s : s.charAt(0).toUpperCase() + s.slice(1) }

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Starting admin jobs API...');
    
    // Automatically close jobs with passed deadlines
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
      
      const closeExpiredJobs = await pool.query(`
        UPDATE job_requests 
        SET status = 'closed', updated_at = NOW()
        WHERE application_deadline IS NOT NULL
          AND application_deadline < $1
          AND status != 'closed'
        RETURNING id, job_title, application_deadline
      `, [today]);
      
      if (closeExpiredJobs.rows.length > 0) {
        console.log(`✅ Automatically closed ${closeExpiredJobs.rows.length} job(s) with passed deadlines`);
        closeExpiredJobs.rows.forEach((row: any) => {
          console.log(`   - Job ID ${row.id} (${row.job_title}): deadline was ${row.application_deadline}`);
        });
      }
    } catch (error) {
      console.error('⚠️ Error auto-closing expired jobs:', error);
      // Continue even if auto-closure fails
    }
    
    // Get jobs from job_requests table (only unprocessed ones)
    console.log('📊 Fetching unprocessed job_requests...');
    let jobRequestsResult;
    try {
      jobRequestsResult = await pool.query(`
      SELECT 
        j.*, 
        m.company AS company_name,
        COALESCE(app_counts.applicant_count, 0) AS real_applicants,
        'job_requests' as source_table
      FROM job_requests j
      LEFT JOIN members m ON m.company_id = j.company_id
      LEFT JOIN (
        SELECT job_id, COUNT(*) as applicant_count
        FROM applications
        GROUP BY job_id
      ) app_counts ON app_counts.job_id = j.id
      WHERE j.status IN ('active', 'processed', 'inactive', 'closed')
      ORDER BY j.created_at DESC
    `)
      console.log(`✅ unprocessed job_requests query completed: ${jobRequestsResult.rows.length} rows`);
    } catch (error) {
      console.error('❌ Error in job_requests query:', error);
      throw error;
    }

    // Recruiter jobs removed - table dropped
    console.log('📊 Recruiter jobs removed - skipping...');
    const recruiterJobsResult = { rows: [] };

    // Process job_requests (admin jobs)
    console.log('🔄 Processing job_requests...');
    const jobRequests = await Promise.all(jobRequestsResult.rows.map(async (row: any) => {
      const apps = await pool.query('SELECT COUNT(*)::int AS cnt FROM applications WHERE job_id = $1', [row.id])
      const realApplicants = apps.rows?.[0]?.cnt ?? 0
      const employmentType: string[] = []
      if (row.work_type) employmentType.push(capitalize(String(row.work_type)))
      if (row.experience_level) employmentType.push(capitalize(String(row.experience_level)))
      const salary = formatSalary(String(row.currency || 'PHP'), row.salary_min != null ? Number(row.salary_min) : null, row.salary_max != null ? Number(row.salary_max) : null, String(row.salary_type || 'monthly'))
      const createdAt = row.created_at ? new Date(row.created_at) : new Date()
      const ms = Date.now() - createdAt.getTime()
      const minutes = Math.floor(ms / (1000 * 60))
      const hours = Math.floor(minutes / 60)
      const days = Math.floor(hours / 24)
      
      let postedDays: number
      if (days > 0) {
        postedDays = days
      } else if (hours > 0) {
        postedDays = 0 // Will show as "Just now" in frontend
      } else if (minutes > 0) {
        postedDays = 0 // Will show as "Just now" in frontend
      } else {
        postedDays = 0 // Will show as "Just now" in frontend
      }
      const locationType = String(row.work_arrangement || 'onsite')
      const priorityFromDb = String(row.priority ?? '').toLowerCase()
      const priority: 'low' | 'medium' | 'high' | 'urgent' =
        ['low', 'medium', 'high', 'urgent'].includes(priorityFromDb)
          ? (priorityFromDb as any)
          : ((): 'low' | 'medium' | 'high' => {
              if (realApplicants >= 50) return 'high'
              if (realApplicants >= 10) return 'medium'
              return 'low'
            })()

      return {
        id: `job_requests_${row.id}`,
        originalId: String(row.id),
        source: 'job_requests',
        company: 'ShoreAgents',
        companyLogo: row.company_logo || '🏢',
        title: row.job_title || 'Untitled Role',
        location: row.location || row['location'] || '',
        locationType: locationType === 'onsite' ? 'on-site' : locationType,
        salary,
        employmentType,
        postedDays,
        applicants: realApplicants,
        status: mapStatusFromEnum(row.status),
        priority,
        createdAt: row.created_at,
        applicationDeadline: row.application_deadline ? (() => {
          const date = row.application_deadline;
          if (date instanceof Date) {
            // If it's a Date object, format as YYYY-MM-DD
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          }
          // If it's a string, extract YYYY-MM-DD part
          const dateStr = String(date).split('T')[0].trim();
          return dateStr.match(/^\d{4}-\d{2}-\d{2}$/) ? dateStr : null;
        })() : null,
        experienceLevel: row.experience_level,
        workArrangement: row.work_arrangement,
        shift: row.shift,
        industry: row.industry,
        department: row.department,
        workType: row.work_type,
        currency: row.currency,
        salaryType: row.salary_type,
        salary_min: row.salary_min,
        salary_max: row.salary_max,
        created_at: row.created_at,
        updated_at: row.updated_at
      }
    }))

    // Recruiter jobs removed - table dropped
    console.log('🔄 Recruiter jobs removed - skipping...');
    const recruiterJobs: any[] = [];

    // Combine all jobs and sort by creation date
    const allJobs = [...jobRequests, ...recruiterJobs].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    console.log(`🔍 Admin Jobs API: Found ${jobRequests.length} jobs from job_requests, ${recruiterJobs.length} jobs from recruiter_jobs`)
    console.log(`📊 Total: ${allJobs.length} active jobs`)

    // Jobs are already processed, just return them
    const jobs = allJobs

    return NextResponse.json({ jobs })
  } catch (error) {
    console.error('❌ Error fetching job requests:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json({ 
      error: 'Failed to fetch job requests',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const action = body?.action

    // In development, allow all authenticated users to use this endpoint
    if (process.env.NODE_ENV !== 'development') {
      // Ensure the caller is an admin in non-dev environments
      const adminCheck = await pool.query('SELECT admin_level FROM users WHERE id = $1', [userId])
      if (adminCheck.rows[0]?.admin_level !== 'admin') {
        return NextResponse.json({ error: 'Admin only' }, { status: 403 })
      }
    }

    switch (action) {
      case 'create': {
        const {
          company,
          title,
          location,
          salary,
          status: uiStatus,
          workArrangement,
          workType,
          experienceLevel,
          application_deadline,
          industry,
          department,
          requirements,
          responsibilities,
          benefits,
          skills,
          jobDescription,
          priority,
          shift
        } = body?.data || {}

        // Find or create member
        let companyId: string | null = null
        if (company) {
          const found = await pool.query('SELECT company_id FROM members WHERE company = $1 LIMIT 1', [company])
          if (found.rows.length > 0) {
            companyId = found.rows[0].company_id
          } else {
            const inserted = await pool.query('INSERT INTO members (company) VALUES ($1) RETURNING company_id', [company])
            companyId = inserted.rows[0].company_id
          }
        }

        const parsedSalary = parseSalary(String(salary || ''))
        const dbStatus = uiStatusToDbStatus(uiStatus || 'job-request')
        const dbWorkArrangement = normalizeWorkArrangement(workArrangement || 'onsite')
        const dbWorkType = (workType || 'full-time')
        const dbExperience = experienceLevel || null

        const insert = await pool.query(
          `INSERT INTO job_requests (
            company_id, job_title, work_arrangement, salary_min, salary_max, job_description,
            requirements, responsibilities, benefits, skills,
            experience_level, application_deadline, industry, department,
            work_type, currency, salary_type, status, priority, shift
          ) VALUES (
            $1, $2, $3::work_arrangement_enum, $4, $5, $6,
            $7::text[], $8::text[], $9::text[], $10::text[],
            $11::experience_level_enum, $12::date, $13, $14,
            $15, $16, $17, $18::job_status_enum, $19::priority_enum, $20::shift_enum
          )
          RETURNING *`,
          [
            companyId,
            title,
            dbWorkArrangement,
            parsedSalary.min,
            parsedSalary.max,
            jobDescription || 'Pending description',
            Array.isArray(requirements) ? requirements : [],
            Array.isArray(responsibilities) ? responsibilities : [],
            Array.isArray(benefits) ? benefits : [],
            Array.isArray(skills) ? skills : [],
            dbExperience,
            application_deadline || null,
            industry || null,
            department || null,
            dbWorkType,
            parsedSalary.currency,
            parsedSalary.type,
            dbStatus,
            (priority as any) || 'medium',
            (shift as any) || 'day'
          ]
        )

        const row = insert.rows[0]
        const companyName = company || (await getCompanyName(row.company_id)) || 'Unknown Company'
        const payload = rowToJobCard({ ...row, company_name: companyName })
        return NextResponse.json({ job: payload })
      }

      case 'update': {
        const { id, title, location, salary, status: uiStatus, workArrangement, workType, experienceLevel, companyId, salaryType, currency, applicants, jobDescription, industry, department, application_deadline, requirements, responsibilities, benefits, skills, priority, shift } = body?.data || {}
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
        const parsedSalary = parseSalary(String(salary || ''))
        const dbStatus = uiStatus ? uiStatusToDbStatus(uiStatus) : undefined
        const fields: string[] = []
        const values: any[] = []
        const push = (f: string, v: any) => { fields.push(f); values.push(v) }
        if (title != null) push('job_title', title)
        // location/city column not present in this schema; ignore
        if (workArrangement != null) push('work_arrangement', normalizeWorkArrangement(workArrangement))
        if (workType != null) push('work_type', workType)
        if (experienceLevel != null) push('experience_level', experienceLevel)
        if (companyId != null) push('company_id', companyId)
        if (jobDescription != null) push('job_description', jobDescription)
        if (industry != null) push('industry', industry)
        if (department != null) push('department', department)
        if (application_deadline != null) push('application_deadline', application_deadline)
        if (Array.isArray(requirements)) push('requirements', requirements)
        if (Array.isArray(responsibilities)) push('responsibilities', responsibilities)
        if (Array.isArray(benefits)) push('benefits', benefits)
        if (Array.isArray(skills)) push('skills', skills)
        if (salary != null) {
          push('salary_min', parsedSalary.min)
          push('salary_max', parsedSalary.max)
          push('currency', parsedSalary.currency)
          push('salary_type', parsedSalary.type)
        }
        if (currency != null && salary == null) push('currency', currency)
        if (salaryType != null && salary == null) push('salary_type', salaryType)
        if (applicants != null) push('applicants', applicants)
        if (priority != null) push('priority', priority)
        if (shift != null) push('shift', shift)
        if (dbStatus != null) push('status', dbStatus)
        if (fields.length === 0) return NextResponse.json({ error: 'no fields' }, { status: 400 })
        const setSql = fields.map((f, i) => `${f} = $${i + 1}`).join(', ')
        const update = await pool.query(`UPDATE job_requests SET ${setSql}, updated_at = NOW() WHERE id = $${fields.length + 1} RETURNING *`, [...values, id])
        if (update.rows.length === 0) return NextResponse.json({ error: 'not found' }, { status: 404 })
        const row = update.rows[0]
        const companyName = await getCompanyName(row.company_id)
        return NextResponse.json({ job: rowToJobCard({ ...row, company_name: companyName }) })
      }

      case 'move': {
        const { id, toStatus } = body?.data || {}
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
        const dbStatus = uiStatusToDbStatus(toStatus)
        const update = await pool.query('UPDATE job_requests SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [dbStatus, id])
        if (update.rows.length === 0) return NextResponse.json({ error: 'not found' }, { status: 404 })
        const row = update.rows[0]
        const companyName = await getCompanyName(row.company_id)
        return NextResponse.json({ job: rowToJobCard({ ...row, company_name: companyName }) })
      }

      case 'delete': {
        const { id } = body?.data || {}
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
        const client = await pool.connect()
        try {
          await client.query('BEGIN')
          // Ensure processed row is removed even if FK is missing
          // Job deletion now only affects job_requests table
          await client.query('DELETE FROM job_requests WHERE id = $1', [id])
          await client.query('COMMIT')
          return NextResponse.json({ success: true })
        } catch (e) {
          await client.query('ROLLBACK')
          throw e
        } finally {
          client.release()
        }
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error mutating job requests:', error)
    const message = error instanceof Error ? error.message : 'Failed to process request'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


function formatSalary(currency: string, min: number | null, max: number | null, type: string): string {
  const symbol = currency.toUpperCase() === 'PHP' ? '₱' : currency.toUpperCase() + ' '
  const fmt = (n: number) => n.toLocaleString('en-PH')
  if (min != null && max != null) return `${symbol}${fmt(min)} - ${symbol}${fmt(max)} / ${type}`
  if (min != null) return `${symbol}${fmt(min)} / ${type}`
  if (max != null) return `${symbol}${fmt(max)} / ${type}`
  return ''
}

function mapStatusFromEnum(dbStatus: any): 'job-request' | 'approved' | 'hiring' | 'closed' {
  // job_status_enum: active | inactive | closed | processed
  const s = String(dbStatus ?? '').toLowerCase()
  if (s === 'active') return 'hiring'
  if (s === 'inactive') return 'job-request'
  if (s === 'processed') return 'approved'
  if (s === 'closed') return 'closed'
  return 'job-request'
}

function uiStatusToDbStatus(ui: any): 'active' | 'inactive' | 'closed' | 'processed' {
  const s = String(ui ?? '').toLowerCase()
  if (s === 'hiring') return 'active'
  if (s === 'approved') return 'processed'
  if (s === 'closed') return 'closed'
  return 'inactive' // job-request
}

function normalizeWorkArrangement(val: any): 'onsite' | 'remote' | 'hybrid' {
  const s = String(val ?? '').toLowerCase()
  if (s === 'remote') return 'remote'
  if (s === 'hybrid') return 'hybrid'
  return 'onsite'
}

async function getCompanyName(companyId: string | null): Promise<string | null> {
  if (!companyId) return null
  const res = await pool.query('SELECT company FROM members WHERE company_id = $1', [companyId])
  return res.rows[0]?.company ?? null
}

function rowToJobCard(row: any) {
  const employmentType: string[] = []
  if (row.work_type) employmentType.push(capitalize(String(row.work_type)))
  if (row.experience_level) employmentType.push(capitalize(String(row.experience_level)))
  const salary = formatSalary(String(row.currency || 'PHP'), row.salary_min != null ? Number(row.salary_min) : null, row.salary_max != null ? Number(row.salary_max) : null, String(row.salary_type || 'monthly'))
  const createdAt = row.created_at ? new Date(row.created_at) : new Date()
  const ms = Date.now() - createdAt.getTime()
  const postedDays = Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
  const locationType = String(row.work_arrangement || 'onsite')
  const derivedPriority = ((): 'low' | 'medium' | 'high' => {
    const a = Number(row.applicants ?? 0)
    if (a >= 50) return 'high'
    if (a >= 10) return 'medium'
    return 'low'
  })()
  const priorityFromDb = String(row.priority ?? '').toLowerCase()
  const priority: 'low' | 'medium' | 'high' | 'urgent' =
    ['low', 'medium', 'high', 'urgent'].includes(priorityFromDb)
      ? (priorityFromDb as any)
      : derivedPriority
  return {
    id: `${row.source_table || 'job_requests'}_${row.id}`,
    company: row.company_name || 'Unknown Company',
    companyLogo: row.company_logo || '🏢',
    title: row.job_title || 'Untitled Role',
    location: row.location || row["location"] || '',
    locationType: locationType === 'onsite' ? 'on-site' : locationType,
    salary,
    employmentType,
    postedDays,
    applicants: row.applicants ?? 0,
    status: mapStatusFromEnum(row.status),
    priority,
    createdAt: row.created_at,
    shift: row.shift || 'day',
    applicationDeadline: row.application_deadline ? (() => {
      const date = row.application_deadline;
      if (date instanceof Date) {
        // If it's a Date object, format as YYYY-MM-DD
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      // If it's a string, extract YYYY-MM-DD part
      const dateStr = String(date).split('T')[0].trim();
      return dateStr.match(/^\d{4}-\d{2}-\d{2}$/) ? dateStr : null;
    })() : null,
  }
}

function parseSalary(input: string): { currency: string, min: number | null, max: number | null, type: string } {
  const lower = input.toLowerCase()
  const type = lower.includes('/hr') || lower.includes('per hour') ? 'hourly' : (lower.includes('/day') ? 'daily' : (lower.includes('/year') ? 'yearly' : 'monthly'))
  const currency = lower.includes('₱') || lower.includes('php') ? 'PHP' : (lower.includes('usd') || lower.includes('$') ? 'USD' : 'PHP')
  const nums = input.replace(/[^0-9\-–,]/g, ' ').split(/\s+/).filter(Boolean).map(n => Number(n.replace(/,/g, ''))).filter(n => !isNaN(n))
  let min: number | null = null
  let max: number | null = null
  if (nums.length >= 2) {
    min = Math.min(nums[0], nums[1])
    max = Math.max(nums[0], nums[1])
  } else if (nums.length === 1) {
    min = nums[0]
  }
  return { currency, min, max, type }
}


