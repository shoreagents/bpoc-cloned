import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const jobId = id

    // Recruiter jobs removed - table dropped
    if (jobId.startsWith('recruiter_')) {
      return NextResponse.json({ error: 'Recruiter jobs have been removed' }, { status: 404 })
    } else if (jobId.startsWith('job_request_')) {
      // Handle job_requests (admin jobs)
      const actualJobId = jobId.replace('job_request_', '')
      
      const result = await pool.query(`
        SELECT jr.*, m.company AS company_name
        FROM job_requests jr
        LEFT JOIN members m ON m.company_id = jr.company_id
        WHERE jr.id = $1
      `, [actualJobId])

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      }

      const row = result.rows[0]
      
      // Get application count
      const apps = await pool.query('SELECT COUNT(*)::int AS cnt FROM applications WHERE job_id = $1', [row.id])
      const realApplicants = apps.rows?.[0]?.cnt ?? 0

      return NextResponse.json({
        job: {
          id: `job_request_${row.id}`,
          originalId: String(row.id),
          source: 'job_requests',
          company: 'ShoreAgents',
          companyLogo: row.company_logo || '🏢',
          title: row.job_title || 'Untitled Role',
          description: row.job_description || 'No description available',
          location: row.location || '',
          work_arrangement: row.work_arrangement,
          shift: row.shift,
          industry: row.industry,
          department: row.department,
          experience_level: row.experience_level,
          work_type: row.work_type,
          application_deadline: row.application_deadline,
          salary_min: row.salary_min,
          salary_max: row.salary_max,
          currency: row.currency,
          salary_type: row.salary_type,
          priority: row.priority,
          status: row.status,
          applicants: realApplicants,
          views: row.views || 0,
          created_at: row.created_at,
          updated_at: row.updated_at,
          requirements: Array.isArray(row.requirements) ? row.requirements.flatMap((item: any) => 
            typeof item === 'string' ? item.split('\n\n').filter((s: string) => s.trim()) : [item]
          ) : [],
          responsibilities: Array.isArray(row.responsibilities) ? row.responsibilities.flatMap((item: any) => 
            typeof item === 'string' ? item.split('\n\n').filter((s: string) => s.trim()) : [item]
          ) : [],
          benefits: Array.isArray(row.benefits) ? row.benefits.flatMap((item: any) => 
            typeof item === 'string' ? item.split('\n\n').filter((s: string) => s.trim()) : [item]
          ) : [],
          skills: row.skills || []
        }
      })
    } else {
      // Handle numeric ID (fallback to job_requests)
      const actualJobId = jobId.startsWith('processed_') ? jobId.replace('processed_', '') : jobId
      
      const result = await pool.query(`
        SELECT jr.*, m.company AS company_name
        FROM job_requests jr
        LEFT JOIN members m ON m.company_id = jr.company_id
        WHERE jr.id = $1
      `, [actualJobId])

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      }

      const row = result.rows[0]
      
      // Get application count
      const apps = await pool.query('SELECT COUNT(*)::int AS cnt FROM applications WHERE job_id = $1', [row.id])
      const realApplicants = apps.rows?.[0]?.cnt ?? 0

      return NextResponse.json({
        job: {
          id: `job_request_${row.id}`,
          originalId: String(row.id),
          source: 'job_requests',
          company: 'ShoreAgents',
          companyLogo: row.company_logo || '🏢',
          title: row.job_title || 'Untitled Role',
          description: row.job_description || 'No description available',
          location: row.location || '',
          work_arrangement: row.work_arrangement,
          shift: row.shift,
          industry: row.industry,
          department: row.department,
          experience_level: row.experience_level,
          work_type: row.work_type,
          application_deadline: row.application_deadline,
          salary_min: row.salary_min,
          salary_max: row.salary_max,
          currency: row.currency,
          salary_type: row.salary_type,
          priority: row.priority,
          status: row.status,
          applicants: realApplicants,
          views: row.views || 0,
          created_at: row.created_at,
          updated_at: row.updated_at,
          requirements: Array.isArray(row.requirements) ? row.requirements.flatMap((item: any) => 
            typeof item === 'string' ? item.split('\n\n').filter((s: string) => s.trim()) : [item]
          ) : [],
          responsibilities: Array.isArray(row.responsibilities) ? row.responsibilities.flatMap((item: any) => 
            typeof item === 'string' ? item.split('\n\n').filter((s: string) => s.trim()) : [item]
          ) : [],
          benefits: Array.isArray(row.benefits) ? row.benefits.flatMap((item: any) => 
            typeof item === 'string' ? item.split('\n\n').filter((s: string) => s.trim()) : [item]
          ) : [],
          skills: row.skills || []
        }
      })
    }
  } catch (e) {
    console.error('Error fetching job details:', e)
    return NextResponse.json({ error: 'Failed to fetch job details' }, { status: 500 })
  }
}