import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import pool from '@/lib/database';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  // Get the base URL for the site
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.bpoc.io');

  try {
    // Fetch resume data server-side
    const client = await pool.connect();
    try {
      const res = await client.query(
        `SELECT 
          sr.id, sr.resume_title, sr.resume_slug, sr.template_used,
          u.id as user_id, u.full_name, u.avatar_url, u.position, u.location,
          u.location_city, u.location_country
         FROM saved_resumes sr
         LEFT JOIN users u ON u.id = sr.user_id
         WHERE sr.resume_slug = $1
         LIMIT 1`,
        [slug]
      );

      if (res.rowCount === 0) {
        return {
          title: 'Resume Not Found | BPOC.IO',
          description: 'Resume not found on BPOC.IO',
        };
      }

      const resume = res.rows[0];
      const fullName = resume.full_name || 'Professional';
      const title = resume.resume_title || 'Resume';
      const position = resume.position || 'BPO Professional';
      const description = `View ${fullName}'s professional resume on BPOC.IO - ${position}`;

      // Construct OG image URL with version parameter to bust cache
      const ogImageUrl = `${baseUrl}/api/og/resume?slug=${slug}&v=3`;

      return {
        title: `${title} - ${fullName} | BPOC.IO`,
        description,
        openGraph: {
          title: `${fullName} - ${title}`,
          description,
          url: `${baseUrl}/resume/${slug}`,
          siteName: 'BPOC.IO',
          images: [
            {
              url: ogImageUrl,
              width: 1200,
              height: 630,
              alt: `${fullName}'s resume on BPOC.IO`,
              type: 'image/png',
            },
          ],
          locale: 'en_US',
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title: `${fullName} - ${title}`,
          description,
          images: [ogImageUrl],
        },
        other: {
          'og:image:width': '1200',
          'og:image:height': '630',
          'og:image:type': 'image/png',
        },
      };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching resume metadata:', error);
  }

  // Fallback metadata if fetch fails
  const ogImageUrl = `${baseUrl}/api/og/resume?slug=${slug}&v=3`;
  return {
    title: `Resume | BPOC.IO`,
    description: 'View professional resume on BPOC.IO - Where BPO Careers Begin',
    openGraph: {
      title: `Resume | BPOC.IO`,
      description: 'View professional resume on BPOC.IO - Where BPO Careers Begin',
      url: `${baseUrl}/resume/${slug}`,
      siteName: 'BPOC.IO',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `Resume on BPOC.IO`,
          type: 'image/png',
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Resume | BPOC.IO`,
      description: 'View professional resume on BPOC.IO - Where BPO Careers Begin',
      images: [ogImageUrl],
    },
    other: {
      'og:image:width': '1200',
      'og:image:height': '630',
      'og:image:type': 'image/png',
    },
  };
}

export default function ResumeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

