import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'

function capitalize(s: string): string { return !s ? s : s.charAt(0).toUpperCase() + s.slice(1) }
function formatSalary(currency: string, min: number | null, max: number | null, type: string): string {
  const symbol = String(currency || 'PHP').toUpperCase() === 'PHP' ? '₱' : String(currency || 'PHP').toUpperCase() + ' '
  const fmt = (n: number) => n.toLocaleString('en-PH')
  if (min != null && max != null) return `${symbol}${fmt(min)} - ${symbol}${fmt(max)} / ${type}`
  if (min != null) return `${symbol}${fmt(min)} / ${type}`
  if (max != null) return `${symbol}${fmt(max)} / ${type}`
  return ''
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const rawId = (await params).id
    if (!rawId) return NextResponse.json({ error: 'id required' }, { status: 400 })

    // Parse prefixed IDs: processed_{id}, job_request_{id}, recruiter_{id}
    let actualId: number | string | null = null
    let source: 'processed' | 'job_request' | 'recruiter' | null = null

    if (rawId.startsWith('processed_')) {
      actualId = Number(rawId.replace('processed_', ''))
      source = 'processed'
    } else if (rawId.startsWith('job_request_')) {
      actualId = Number(rawId.replace('job_request_', ''))
      source = 'job_request'
    } else if (rawId.startsWith('recruiter_')) {
      actualId = rawId.replace('recruiter_', '')
      source = 'recruiter'
    } else {
      // Fallback: try as numeric ID (for backward compatibility)
      actualId = Number(rawId)
      source = 'processed'
    }

    if (!actualId || (typeof actualId === 'number' && Number.isNaN(actualId))) {
      return NextResponse.json({ error: 'invalid id' }, { status: 400 })
    }

    let res
    if (source === 'recruiter') {
      // Recruiter jobs removed - table dropped
      return NextResponse.json({ error: 'Recruiter jobs have been removed' }, { status: 404 })
    } else if (source === 'job_request') {
      // Query job_requests
      res = await pool.query(
        `SELECT jr.*, m.company AS company_name
         FROM job_requests jr
         LEFT JOIN members m ON m.company_id = jr.company_id
         WHERE jr.id = $1 AND jr.status = 'active'
         LIMIT 1`,
        [actualId]
      )
    } else {
      // Query job_requests (default fallback)
      res = await pool.query(
        `SELECT jr.*, m.company AS company_name
         FROM job_requests jr
         LEFT JOIN members m ON m.company_id = jr.company_id
         WHERE jr.id = $1 AND jr.status = 'active'
         LIMIT 1`,
        [actualId]
      )
    }

    if (res.rows.length === 0) return NextResponse.json({ error: 'not found' }, { status: 404 })
    const row = res.rows[0]

    const employmentType: string[] = []
    if (row.work_type) employmentType.push(capitalize(String(row.work_type)))
    if (row.experience_level) employmentType.push(capitalize(String(row.experience_level)))
    const salary = formatSalary(String(row.currency || 'PHP'), row.salary_min != null ? Number(row.salary_min) : null, row.salary_max != null ? Number(row.salary_max) : null, String(row.salary_type || 'monthly'))
    const createdAt = row.created_at ? new Date(row.created_at) : new Date()
    const ms = Date.now() - createdAt.getTime()
    const postedDays = Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
    const locationType = String(row.work_arrangement || 'onsite')

    // Count real applications from appropriate table
    let apps
    // Recruiter jobs removed - only use applications table
    apps = await pool.query('SELECT COUNT(*)::int AS cnt FROM applications WHERE job_id = $1', [actualId])
    const realApplicants = apps.rows?.[0]?.cnt ?? 0

    const job = {
      id: source === 'recruiter' ? `recruiter_${row.id}` : `job_request_${row.id}`,
      company: source === 'recruiter' ? (row.company_name || 'Company') : 'ShoreAgents',
      companyLogo: row.company_logo || '🏢',
      title: row.job_title || 'Untitled Role',
      location: row.location || row['location'] || '',
      locationType: locationType === 'onsite' ? 'on-site' : locationType,
      salary,
      employmentType,
      postedDays,
      applicants: realApplicants,
      status: row.status === 'active' ? 'hiring' : 'approved',
      priority: ((): 'low' | 'medium' | 'high' => {
        const a = Number(row.applicants ?? 0)
        if (a >= 50) return 'high'
        if (a >= 10) return 'medium'
        return 'low'
      })(),
      application_deadline: row.application_deadline,
      experience_level: row.experience_level,
      work_arrangement: row.work_arrangement,
      shift: row.shift,
      industry: row.industry,
      department: row.department,
      job_description: row.job_description,
      requirements: Array.isArray(row.requirements) ? row.requirements : [],
      responsibilities: Array.isArray(row.responsibilities) ? row.responsibilities : [],
      benefits: Array.isArray(row.benefits) ? row.benefits : [],
      skills: Array.isArray(row.skills) ? row.skills : []
    }

    return NextResponse.json({ job })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 })
  }
}


