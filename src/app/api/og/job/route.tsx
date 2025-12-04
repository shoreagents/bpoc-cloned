import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import pool from '@/lib/database';

// Use Node.js runtime to access database
export const runtime = 'nodejs';

function capitalize(s: string): string { 
  return !s ? s : s.charAt(0).toUpperCase() + s.slice(1) 
}

function formatSalary(currency: string, min: number | null, max: number | null, type: string): string {
  const symbol = String(currency || 'PHP').toUpperCase() === 'PHP' ? '₱' : String(currency || 'PHP').toUpperCase() + ' '
  const fmt = (n: number) => n.toLocaleString('en-PH')
  if (min != null && max != null) return `${symbol}${fmt(min)} - ${symbol}${fmt(max)} / ${type}`
  if (min != null) return `${symbol}${fmt(min)} / ${type}`
  if (max != null) return `${symbol}${fmt(max)} / ${type}`
  return 'Salary not specified'
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('id');

    if (!jobId) {
      return new Response('Missing job id parameter', { status: 400 });
    }

    // Parse prefixed IDs: processed_{id}, job_request_{id}, recruiter_{id}
    let actualId: number | string | null = null;
    let source: 'processed' | 'job_request' | 'recruiter' | null = null;

    if (jobId.startsWith('processed_')) {
      actualId = Number(jobId.replace('processed_', ''));
      source = 'processed';
    } else if (jobId.startsWith('job_request_')) {
      actualId = Number(jobId.replace('job_request_', ''));
      source = 'job_request';
    } else if (jobId.startsWith('recruiter_')) {
      actualId = jobId.replace('recruiter_', '');
      source = 'recruiter';
    } else {
      // Fallback: try as numeric ID (for backward compatibility)
      actualId = Number(jobId);
      source = 'processed';
    }

    if (!actualId || (typeof actualId === 'number' && Number.isNaN(actualId))) {
      return new Response('Invalid job id', { status: 400 });
    }

    // Fetch job data directly from database
    let job: any = null;
    try {
      const client = await pool.connect();
      try {
        let res;
        if (source === 'recruiter') {
          // Recruiter jobs removed - return null
          res = { rows: [] };
        } else if (source === 'job_request') {
          res = await client.query(
            `SELECT jr.*, m.company AS company_name
             FROM job_requests jr
             LEFT JOIN members m ON m.company_id = jr.company_id
             WHERE jr.id = $1 AND jr.status = 'active'
             LIMIT 1`,
            [actualId]
          );
        } else {
          res = await client.query(
            `SELECT p.*, m.company AS company_name
             FROM job_requests jr
             LEFT JOIN members m ON m.company_id = jr.company_id
             WHERE jr.id = $1 AND jr.status = 'active'
             LIMIT 1`,
            [actualId]
          );
        }
        
        if (res.rowCount && res.rowCount > 0) {
          job = res.rows[0];
        }
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching job data from database:', error);
    }

    // Default values if job not found
    const jobTitle = job?.job_title || 'Job Opportunity';
    const companyName = job?.company_name || 'Company';
    const salary = formatSalary(
      String(job?.currency || 'PHP'),
      job?.salary_min != null ? Number(job?.salary_min) : null,
      job?.salary_max != null ? Number(job?.salary_max) : null,
      String(job?.salary_type || 'monthly')
    );
    const workArrangement = job?.work_arrangement || 'onsite';
    const experienceLevel = job?.experience_level || '';
    const location = job?.location || '';

    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#000000',
            backgroundImage: `
              radial-gradient(circle at 100% 0%, rgba(168, 85, 247, 0.2) 0%, transparent 40%),
              radial-gradient(circle at 0% 100%, rgba(14, 165, 233, 0.2) 0%, transparent 40%)
            `,
            position: 'relative',
            fontFamily: '"Inter", sans-serif',
          }}
        >
          {/* High Contrast Cyber Grid */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)',
              width: '100%',
              height: '100%',
            }}
          />

          <div
            style={{
              display: 'flex',
              flex: 1,
              padding: '50px',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'relative',
              zIndex: 10,
            }}
          >
            {/* Left: Job Details Block */}
            <div style={{ display: 'flex', flexDirection: 'column', width: '62%', justifyContent: 'center', alignItems: 'flex-start' }}>
              
              {/* Glowing Brand Tag */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: 40,
                  background: 'rgba(14, 165, 233, 0.1)',
                  border: '1px solid rgba(14, 165, 233, 0.3)',
                  padding: '10px 24px',
                  borderRadius: '50px',
                  width: 'auto',
                  zIndex: 10,
                  boxShadow: '0 0 20px rgba(14, 165, 233, 0.15)',
                }}
              >
                {/* Logo SVG with Gradient */}
                <svg width="32" height="32" viewBox="0 0 1242.1 1223.6" style={{ marginRight: 12, display: 'flex' }}>
                  <defs>
                    <linearGradient id="logoGradientJob" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="50%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                  </defs>
                  <g>
                    <path fill="url(#logoGradientJob)" d="M226.42,485.24s78.8-350.4,437.6-350.4c0,0,328.4-19.2,440,320.4,0,0-80.4-330-438.8-338.4-385.52-9.04-464.8,368.4-464.8,368.4"/>
                    <rect fill="url(#logoGradientJob)" x="138.09" y="485.24" width="140.8" height="226.6" rx="54.4" ry="54.4"/>
                    <rect fill="url(#logoGradientJob)" x="632.05" y="982.21" width="74.4" height="175.02" rx="37.2" ry="37.2" transform="translate(-400.48 1738.97) rotate(-90)"/>
                    <path fill="url(#logoGradientJob)" d="M231.82,706.64s19.47,127.47,140.27,233.87,240,103.2,240,103.2v39.2s-192-19.2-296-148c-34.31-42.49-62.89-82.41-80-116-34.76-68.23-38.8-112-38.8-112l34.53-.27Z"/>
                    <path fill="url(#logoGradientJob)" d="M489.15,393.97h87.73v-55.73s74.13-18.4,134.93-6.13,220.4,80.13,220.4,263.33-155.2,272.8-262.4,272.8-309.6-83.4-261.6-345h261.6s68-.6,68,85-76.8,77.6-76.8,77.6c0,0-84,6.2-84-87.3,0-29.5-.8-39.1-.8-39.1h-88.8v72s6,144.8,172.8,144.8c147.2,0,168.8-116.35,168.8-178.17s-63.2-165.83-156-165.83h-322.4s-38.8,58.47-38.8,166.3,74.45,359.03,357.43,359.03,351.37-240.47,351.37-359.03-90-357.37-310.8-357.37-220.8,39.6-220.8,39.6c0,0-.93,113.2.13,113.2Z"/>
                  </g>
                </svg>
                <div style={{ color: '#38bdf8', fontSize: 24, fontWeight: 800, letterSpacing: '1px', display: 'flex' }}>BPOC.IO</div>
                <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)', margin: '0 15px', display: 'flex' }} />
                <div style={{ color: '#e0f2fe', fontSize: 20, fontWeight: 500, display: 'flex' }}>Where BPO Careers Begin</div>
              </div>

              {/* Company Name */}
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  color: '#38bdf8',
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                  marginBottom: 20,
                  display: 'flex',
                  textShadow: '0 2px 20px rgba(56, 189, 248, 0.3)',
                }}
              >
                {companyName}
              </div>

              {/* Job Title - Massive & Bright */}
              <div
                style={{
                  fontSize: 72,
                  fontWeight: 900,
                  color: '#ffffff',
                  lineHeight: 1.1,
                  letterSpacing: '-0.03em',
                  marginBottom: 30,
                  display: 'flex',
                  textShadow: '0 4px 30px rgba(0,0,0,0.8)',
                }}
              >
                {jobTitle}
              </div>

              {/* Job Details Row */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
                {/* Salary */}
                {salary && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: 'rgba(34, 197, 94, 0.2)',
                        marginRight: 12,
                      }}
                    >
                      <div style={{ color: '#22c55e', fontSize: 20, fontWeight: 700, display: 'flex' }}>₱</div>
                    </div>
                    <div style={{ color: '#22c55e', fontSize: 28, fontWeight: 600, display: 'flex' }}>{salary}</div>
                  </div>
                )}

                {/* Work Arrangement */}
                {workArrangement && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: 'rgba(14, 165, 233, 0.2)',
                        marginRight: 12,
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="3" y1="9" x2="21" y2="9"></line>
                        <line x1="9" y1="21" x2="9" y2="9"></line>
                      </svg>
                    </div>
                    <div style={{ color: '#0ea5e9', fontSize: 26, fontWeight: 500, display: 'flex' }}>
                      {capitalize(workArrangement)} {experienceLevel ? `• ${capitalize(experienceLevel)}` : ''}
                    </div>
                  </div>
                )}

                {/* Location */}
                {location && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)',
                        marginRight: 12,
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <div style={{ color: '#e2e8f0', fontSize: 26, fontWeight: 500, display: 'flex' }}>{location}</div>
                  </div>
                )}
              </div>

              {/* High Contrast CTA Button */}
              <div
                style={{
                  background: 'white',
                  padding: '20px 40px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  width: 'auto',
                  boxShadow: '0 0 40px rgba(14, 165, 233, 0.2)',
                }}
              >
                <div style={{ color: 'black', fontSize: 28, fontWeight: 800, marginRight: 10, display: 'flex' }}>Apply Now</div>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </div>

            {/* Right: Job Icon/Visual */}
            <div style={{ display: 'flex', width: '38%', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
              {/* Concentric Glow Rings */}
              <div
                style={{
                  position: 'absolute',
                  width: '420px',
                  height: '420px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 70%)',
                  border: '1px solid rgba(14, 165, 233, 0.1)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  width: '340px',
                  height: '340px',
                  borderRadius: '50%',
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                }}
              />

              {/* BPOC Logo */}
              <div
                style={{
                  display: 'flex',
                  width: '252px',
                  height: '252px',
                  padding: '6px',
                  background: 'linear-gradient(135deg, #0ea5e9, #a855f7)',
                  borderRadius: '50%',
                  boxShadow: '0 0 50px rgba(14, 165, 233, 0.3)',
                  overflow: 'hidden',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: '240px',
                    height: '240px',
                    borderRadius: '50%',
                    backgroundColor: '#000',
                    border: '4px solid #000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #111, #222)',
                    padding: '20px',
                  }}
                >
                  <svg width="200" height="200" viewBox="0 0 1242.1 1223.6" style={{ display: 'flex' }}>
                    <defs>
                      <linearGradient id="logoGradientJobIcon" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="50%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#34d399" />
                      </linearGradient>
                    </defs>
                    <path fill="url(#logoGradientJobIcon)" d="M226.42,485.24s78.8-350.4,437.6-350.4c0,0,328.4-19.2,440,320.4,0,0-80.4-330-438.8-338.4-385.52-9.04-464.8,368.4-464.8,368.4"/>
                    <rect fill="url(#logoGradientJobIcon)" x="138.09" y="485.24" width="140.8" height="226.6" rx="54.4" ry="54.4"/>
                    <rect fill="url(#logoGradientJobIcon)" x="632.05" y="982.21" width="74.4" height="175.02" rx="37.2" ry="37.2" transform="translate(-400.48 1738.97) rotate(-90)"/>
                    <path fill="url(#logoGradientJobIcon)" d="M231.82,706.64s19.47,127.47,140.27,233.87,240,103.2,240,103.2v39.2s-192-19.2-296-148c-34.31-42.49-62.89-82.41-80-116-34.76-68.23-38.8-112-38.8-112l34.53-.27Z"/>
                    <path fill="url(#logoGradientJobIcon)" d="M489.15,393.97h87.73v-55.73s74.13-18.4,134.93-6.13,220.4,80.13,220.4,263.33-155.2,272.8-262.4,272.8-309.6-83.4-261.6-345h261.6s68-.6,68,85-76.8,77.6-76.8,77.6c0,0-84,6.2-84-87.3,0-29.5-.8-39.1-.8-39.1h-88.8v72s6,144.8,172.8,144.8c147.2,0,168.8-116.35,168.8-178.17s-63.2-165.83-156-165.83h-322.4s-38.8,58.47-38.8,166.3,74.45,359.03,357.43,359.03,351.37-240.47,351.37-359.03-90-357.37-310.8-357.37-220.8,39.6-220.8,39.6c0,0-.93,113.2.13,113.2Z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      }
    );

    return imageResponse;
  } catch (error) {
    console.error('Error generating job OG image:', error);
    return new Response('Error generating image', { status: 500 });
  }
}

