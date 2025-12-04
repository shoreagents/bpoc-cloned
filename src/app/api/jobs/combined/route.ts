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

export async function GET(_request: NextRequest) {
  try {
    // Fetch from job_requests (all jobs - includes 'inactive', 'active', 'processed', and 'closed' status)
    const jobRequestsRes = await pool.query(`
      SELECT jr.*, m.company AS company_name
      FROM job_requests jr
      LEFT JOIN members m ON m.company_id = jr.company_id
      WHERE jr.status IN ('inactive', 'active', 'processed', 'closed')
      ORDER BY jr.created_at DESC
    `)

    // Recruiter jobs removed - table dropped
    const recruiterJobsRes = { rows: [] }

    // Process job_requests
    const jobRequests = await Promise.all(jobRequestsRes.rows.map(async (row: any) => {
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
      
      let postedDays: number | string
      if (days > 0) {
        postedDays = days
      } else if (hours > 0) {
        postedDays = hours === 1 ? '1 hour ago' : `${hours} hours ago`
      } else if (minutes > 0) {
        postedDays = minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`
      } else {
        postedDays = 'Just now'
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
        id: `job_request_${row.id}`,
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
        status: row.status === 'closed' ? 'closed' : (row.status === 'active' || row.status === 'processed' ? 'hiring' : 'inactive'),
        priority,
        application_deadline: row.application_deadline,
        experience_level: row.experience_level,
        work_arrangement: row.work_arrangement,
        shift: row.shift,
        industry: row.industry,
        department: row.department,
        work_type: row.work_type,
        currency: row.currency,
        salary_type: row.salary_type,
        salary_min: row.salary_min,
        salary_max: row.salary_max,
        created_at: row.created_at,
        updated_at: row.updated_at,
        // Include full details for initial load with proper parsing
        job_description: row.job_description || '',
        requirements: (() => {
          if (Array.isArray(row.requirements)) {
            return row.requirements.flatMap((item: any) => 
              typeof item === 'string' ? item.split('\n\n').filter((s: string) => s.trim()) : [item]
            );
          }
          if (typeof row.requirements === 'string') {
            try {
              const parsed = JSON.parse(row.requirements);
              return Array.isArray(parsed) ? parsed : [row.requirements];
            } catch {
              return row.requirements.split('\n\n').filter((s: string) => s.trim());
            }
          }
          return [];
        })(),
        responsibilities: (() => {
          if (Array.isArray(row.responsibilities)) {
            return row.responsibilities.flatMap((item: any) => 
              typeof item === 'string' ? item.split('\n\n').filter((s: string) => s.trim()) : [item]
            );
          }
          if (typeof row.responsibilities === 'string') {
            try {
              const parsed = JSON.parse(row.responsibilities);
              return Array.isArray(parsed) ? parsed : [row.responsibilities];
            } catch {
              return row.responsibilities.split('\n\n').filter((s: string) => s.trim());
            }
          }
          return [];
        })(),
        benefits: (() => {
          if (Array.isArray(row.benefits)) {
            return row.benefits.flatMap((item: any) => 
              typeof item === 'string' ? item.split('\n\n').filter((s: string) => s.trim()) : [item]
            );
          }
          if (typeof row.benefits === 'string') {
            try {
              const parsed = JSON.parse(row.benefits);
              return Array.isArray(parsed) ? parsed : [row.benefits];
            } catch {
              return row.benefits.split('\n\n').filter((s: string) => s.trim());
            }
          }
          return [];
        })(),
        skills: row.skills || []
      }
    }))

    // Recruiter jobs removed - table dropped
    const recruiterJobs: any[] = []

    // Combine all jobs and sort by creation date
    const allJobs = [...jobRequests, ...recruiterJobs].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return NextResponse.json({ jobs: allJobs })
  } catch (e) {
    console.error('Error fetching combined jobs:', e)
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
  }
}