import type { Metadata } from 'next';
import { NextRequest } from 'next/server';
import pool from '@/lib/database';

interface PageProps {
  params: Promise<{ id: string }>;
}

function capitalize(s: string): string { 
  return !s ? s : s.charAt(0).toUpperCase() + s.slice(1) 
}

function formatSalary(currency: string, min: number | null, max: number | null, type: string): string {
  const symbol = String(currency || 'PHP').toUpperCase() === 'PHP' ? '₱' : String(currency || 'PHP').toUpperCase() + ' '
  const fmt = (n: number) => n.toLocaleString('en-PH')
  if (min != null && max != null) return `${symbol}${fmt(min)} - ${symbol}${fmt(max)} / ${type}`
  if (min != null) return `${symbol}${fmt(min)} / ${type}`
  if (max != null) return `${symbol}${fmt(max)} / ${type}`
  return ''
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  // Get the base URL for the site
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.bpoc.io');

  try {
    // Parse prefixed IDs: processed_{id}, job_request_{id}, recruiter_{id}
    let actualId: number | string | null = null;
    let source: 'processed' | 'job_request' | 'recruiter' | null = null;

    if (id.startsWith('processed_')) {
      actualId = Number(id.replace('processed_', ''));
      source = 'processed';
    } else if (id.startsWith('job_request_')) {
      actualId = Number(id.replace('job_request_', ''));
      source = 'job_request';
    } else if (id.startsWith('recruiter_')) {
      actualId = id.replace('recruiter_', '');
      source = 'recruiter';
    } else {
      // Fallback: try as numeric ID (for backward compatibility)
      actualId = Number(id);
      source = 'processed';
    }

    if (!actualId || (typeof actualId === 'number' && Number.isNaN(actualId))) {
      // Fallback metadata
      const ogImageUrl = `${baseUrl}/api/og/job?id=${encodeURIComponent(id)}&v=1`;
      return {
        title: `Job Opportunity | BPOC.IO`,
        description: 'View this job opportunity on BPOC.IO - Where BPO Careers Begin',
        openGraph: {
          title: `Job Opportunity | BPOC.IO`,
          description: 'View this job opportunity on BPOC.IO - Where BPO Careers Begin',
          url: `${baseUrl}/jobs/${id}`,
          siteName: 'BPOC.IO',
          images: [
            {
              url: ogImageUrl,
              width: 1200,
              height: 630,
              alt: `Job opportunity on BPOC.IO`,
              type: 'image/png',
            },
          ],
          locale: 'en_US',
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title: `Job Opportunity | BPOC.IO`,
          description: 'View this job opportunity on BPOC.IO - Where BPO Careers Begin',
          images: [ogImageUrl],
        },
      };
    }

    // Fetch job data from database
    const client = await pool.connect();
    try {
      let res;
      if (source === 'recruiter') {
        // Recruiter jobs removed - return empty result
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

      if (res.rows.length > 0) {
        const job = res.rows[0];
        const jobTitle = job.job_title || 'Job Opportunity';
        const companyName = job.company_name || 'Company';
        const salary = formatSalary(
          String(job.currency || 'PHP'),
          job.salary_min != null ? Number(job.salary_min) : null,
          job.salary_max != null ? Number(job.salary_max) : null,
          String(job.salary_type || 'monthly')
        );
        const workArrangement = job.work_arrangement || '';
        const experienceLevel = job.experience_level || '';
        const location = job.location || '';

        // Build description
        const descriptionParts = [];
        if (salary) descriptionParts.push(salary);
        if (workArrangement) descriptionParts.push(capitalize(workArrangement));
        if (experienceLevel) descriptionParts.push(capitalize(experienceLevel));
        if (location) descriptionParts.push(location);
        
        const description = descriptionParts.length > 0 
          ? `${jobTitle} at ${companyName} - ${descriptionParts.join(' • ')}`
          : `${jobTitle} at ${companyName} - Join BPOC.IO to apply for this opportunity`;

        // Construct OG image URL with version parameter to bust cache
        const ogImageUrl = `${baseUrl}/api/og/job?id=${encodeURIComponent(id)}&v=1`;

        return {
          title: `${jobTitle} at ${companyName} | BPOC.IO`,
          description,
          openGraph: {
            title: `${jobTitle} at ${companyName}`,
            description,
            url: `${baseUrl}/jobs/${id}`,
            siteName: 'BPOC.IO',
            images: [
              {
                url: ogImageUrl,
                width: 1200,
                height: 630,
                alt: `${jobTitle} at ${companyName} - Job opportunity on BPOC.IO`,
                type: 'image/png',
              },
            ],
            locale: 'en_US',
            type: 'website',
          },
          twitter: {
            card: 'summary_large_image',
            title: `${jobTitle} at ${companyName}`,
            description,
            images: [ogImageUrl],
          },
          other: {
            'og:image:width': '1200',
            'og:image:height': '630',
            'og:image:type': 'image/png',
          },
        };
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching job metadata:', error);
  }

  // Fallback metadata if fetch fails
  const ogImageUrl = `${baseUrl}/api/og/job?id=${encodeURIComponent(id)}&v=1`;
  return {
    title: `Job Opportunity | BPOC.IO`,
    description: 'View this job opportunity on BPOC.IO - Where BPO Careers Begin',
    openGraph: {
      title: `Job Opportunity | BPOC.IO`,
      description: 'View this job opportunity on BPOC.IO - Where BPO Careers Begin',
      url: `${baseUrl}/jobs/${id}`,
      siteName: 'BPOC.IO',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `Job opportunity on BPOC.IO`,
          type: 'image/png',
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Job Opportunity | BPOC.IO`,
      description: 'View this job opportunity on BPOC.IO - Where BPO Careers Begin',
      images: [ogImageUrl],
    },
    other: {
      'og:image:width': '1200',
      'og:image:height': '630',
      'og:image:type': 'image/png',
    },
  };
}

export default function JobLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

