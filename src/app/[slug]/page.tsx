import { Metadata } from 'next';
import ProfilePageClient from './ProfilePageClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  // Get the base URL for the site
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.bpoc.io');

  try {
    // Fetch profile data server-side
    const response = await fetch(`${baseUrl}/api/public/user-by-slug?slug=${slug}`, {
      next: { revalidate: 60 }, // Revalidate every 60 seconds
    });
        
        if (response.ok) {
          const data = await response.json();
      const profile = data.user;

      // Construct OG image URL with version parameter for cache busting
      const ogImageUrl = `${baseUrl}/api/og?username=${slug}&v=2`;

      // Build dynamic metadata
      const fullName = profile.full_name || profile.first_name || slug;
      const position = profile.position || 'BPO Professional';
      const bio = profile.bio || `Experienced ${position} on BPOC.IO - Where BPO Careers Begin`;
      const title = `${fullName} - ${position} | BPOC.IO`;
      const description = bio.length > 160 ? bio.substring(0, 157) + '...' : bio;

      return {
        title,
        description,
        openGraph: {
          title: `${fullName} - ${position}`,
          description,
          url: `${baseUrl}/${slug}`,
          siteName: 'BPOC.IO',
          images: [
            {
              url: ogImageUrl,
              width: 1200,
              height: 630,
              alt: `${fullName} - ${position} profile on BPOC.IO`,
              type: 'image/png',
            },
          ],
          locale: 'en_US',
          type: 'profile',
        },
        twitter: {
          card: 'summary_large_image',
          title: `${fullName} - ${position}`,
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
    } catch (error) {
    console.error('Error fetching profile metadata:', error);
  }

  // Fallback metadata if fetch fails
  const ogImageUrl = `${baseUrl}/api/og?username=${slug}&v=2`;
  return {
    title: `${slug} | BPOC.IO`,
    description: 'View profile on BPOC.IO - Where BPO Careers Begin',
    openGraph: {
      title: `${slug} | BPOC.IO`,
      description: 'View profile on BPOC.IO - Where BPO Careers Begin',
      url: `${baseUrl}/${slug}`,
      siteName: 'BPOC.IO',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${slug} profile on BPOC.IO`,
          type: 'image/png',
        },
      ],
      locale: 'en_US',
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${slug} | BPOC.IO`,
      description: 'View profile on BPOC.IO - Where BPO Careers Begin',
      images: [ogImageUrl],
    },
    other: {
      'og:image:width': '1200',
      'og:image:height': '630',
      'og:image:type': 'image/png',
    },
  };
}

export default function Page() {
  return <ProfilePageClient />;
}
