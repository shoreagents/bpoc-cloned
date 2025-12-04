import { Metadata } from 'next';
import { headers } from 'next/headers';

// Force dynamic rendering since we use headers() to get query params
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

interface LayoutProps {
  children: React.ReactNode;
}

export async function generateMetadata({ 
  params 
}: { 
  params?: Promise<{ [key: string]: string | string[] }> 
}): Promise<Metadata> {
  // Get the base URL for the site - ensure it's always absolute
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.bpoc.io');
  
  // Ensure baseUrl is always absolute (starts with http:// or https://)
  const absoluteBaseUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;

  // Try to get search params from the request URL
  let userId: string | null = null;
  let type: string | null = null;
  let animal: string | null = null;

  try {
    const headersList = await headers();
    
    // Get the full request URL from various headers
    const host = headersList.get('host') || headersList.get('x-forwarded-host') || '';
    const protocol = headersList.get('x-forwarded-proto') || headersList.get('x-forwarded-protocol') || 'https';
    const pathname = headersList.get('x-pathname') || '/career-tools/games/disc-personality';
    const queryString = headersList.get('x-query-string') || '';
    
    // Try to construct the full URL
    let fullUrl = '';
    
    // First, try to get from x-url header (if set by middleware) - this is the most reliable
    const xUrl = headersList.get('x-url');
    if (xUrl) {
      fullUrl = xUrl;
      console.log('✅ DISC Layout: Using x-url header:', xUrl);
    } else if (host && queryString) {
      // If we have query string from header, use it
      const path = pathname + (queryString.startsWith('?') ? queryString : `?${queryString}`);
      fullUrl = `${protocol}://${host}${path}`;
      console.log('✅ DISC Layout: Constructed URL from headers:', fullUrl);
    } else if (host) {
      // Try to get from referer header (for crawlers)
      const referer = headersList.get('referer') || headersList.get('referrer');
      if (referer && referer.includes('/career-tools/games/disc-personality')) {
        fullUrl = referer;
        console.log('✅ DISC Layout: Using referer header:', referer);
      } else {
        // Fallback: construct from host and pathname
        fullUrl = `${protocol}://${host}${pathname}`;
        console.log('⚠️ DISC Layout: No query string found, using pathname only:', fullUrl);
      }
    }
    
    if (fullUrl) {
      try {
        const url = new URL(fullUrl);
        userId = url.searchParams.get('userId');
        type = url.searchParams.get('type');
        animal = url.searchParams.get('animal');
        console.log('✅ DISC Layout: Parsed URL params:', { userId, type, animal, fullUrl });
      } catch (urlError) {
        console.error('❌ DISC Layout: URL parsing error:', urlError);
        // If URL parsing fails, try to parse query string directly
        if (queryString) {
          const params = new URLSearchParams(queryString);
          userId = params.get('userId');
          type = params.get('type');
          animal = params.get('animal');
          console.log('✅ DISC Layout: Parsed query string directly:', { userId, type, animal });
        }
      }
    }
    
    // Log for debugging
    if (userId && type) {
      console.log('✅ DISC Layout: Successfully extracted params:', { userId, type, animal });
    } else {
      console.log('⚠️ DISC Layout: Could not extract params. Headers:', {
        host,
        protocol,
        pathname,
        queryString,
        xUrl: headersList.get('x-url'),
        referer: headersList.get('referer') || headersList.get('referrer'),
        allHeaders: Object.fromEntries(headersList.entries())
      });
    }
  } catch (error) {
    // If we can't get search params, use defaults
    console.error('❌ DISC Layout: Error extracting search params:', error);
  }

  // If we have the required parameters, generate DISC-specific metadata
  if (userId && type) {
    const animalName = animal || (type === 'D' ? 'Eagle' : type === 'I' ? 'Peacock' : type === 'S' ? 'Turtle' : 'Owl');
    const personalityTitles: { [key: string]: string } = {
      'D': 'The Sky Dominator',
      'I': 'The Social Star',
      'S': 'The Steady Guardian',
      'C': 'The Wise Analyst'
    };
    const personalityTitle = personalityTitles[type] || 'BPO Professional';
    
    // Construct OG image URL - ensure it's absolute and includes all parameters
    // Use version 5 for cache busting (increment when OG image design changes)
    const ogImageUrl = `${absoluteBaseUrl}/api/og/disc-results?userId=${encodeURIComponent(userId)}&type=${encodeURIComponent(type)}&animal=${encodeURIComponent(animalName)}&v=5`;
    const pageUrl = `${absoluteBaseUrl}/career-tools/games/disc-personality?userId=${encodeURIComponent(userId)}&type=${encodeURIComponent(type)}&animal=${encodeURIComponent(animalName)}`;
    const description = `Discover your BPO animal spirit! I'm a ${animalName} - ${personalityTitle}. Take the BPOC DISC Personality Assessment to find your perfect BPO role.`;

    console.log('🎨 DISC Layout: Generating metadata with OG image URL:', ogImageUrl);

    return {
      title: `${personalityTitle} - ${animalName} Personality | BPOC DISC Assessment`,
      description,
      metadataBase: new URL(absoluteBaseUrl),
      openGraph: {
        title: `${personalityTitle} - ${animalName} Personality`,
        description,
        url: pageUrl,
        siteName: 'BPOC.IO',
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `${personalityTitle} - ${animalName} Personality Assessment Results`,
            type: 'image/png',
          },
        ],
        locale: 'en_US',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${personalityTitle} - ${animalName} Personality`,
        description,
        images: [ogImageUrl],
      },
      other: {
        'og:image': ogImageUrl,
        'og:image:url': ogImageUrl,
        'og:image:secure_url': ogImageUrl,
        'og:image:width': '1200',
        'og:image:height': '630',
        'og:image:type': 'image/png',
        'og:image:alt': `${personalityTitle} - ${animalName} Personality Assessment Results`,
      },
    };
  }

  // Default metadata for the DISC personality game page
  // Always provide OG image even if query params are missing
  const defaultOgImageUrl = `${absoluteBaseUrl}/api/og/disc-results?userId=default&type=D&animal=Eagle&v=5`;
  console.log('⚠️ DISC Layout: Using default OG image URL:', defaultOgImageUrl);
  
  return {
    title: 'BPOC DISC Personality Assessment | BPOC.IO',
    description: 'Discover your BPO animal spirit! Take the BPOC DISC Personality Assessment to find your perfect BPO role and understand your workplace personality.',
    metadataBase: new URL(absoluteBaseUrl),
    openGraph: {
      title: 'BPOC DISC Personality Assessment | BPOC.IO',
      description: 'Discover your BPO animal spirit! Take the BPOC DISC Personality Assessment to find your perfect BPO role and understand your workplace personality.',
      url: `${absoluteBaseUrl}/career-tools/games/disc-personality`,
      siteName: 'BPOC.IO',
      images: [
        {
          url: defaultOgImageUrl,
          width: 1200,
          height: 630,
          alt: 'BPOC DISC Personality Assessment',
          type: 'image/png',
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'BPOC DISC Personality Assessment | BPOC.IO',
      description: 'Discover your BPO animal spirit! Take the BPOC DISC Personality Assessment to find your perfect BPO role.',
      images: [defaultOgImageUrl],
    },
    other: {
      'og:image': defaultOgImageUrl,
      'og:image:url': defaultOgImageUrl,
      'og:image:secure_url': defaultOgImageUrl,
      'og:image:width': '1200',
      'og:image:height': '630',
      'og:image:type': 'image/png',
      'og:image:alt': 'BPOC DISC Personality Assessment',
    },
  };
}

export default function DiscPersonalityLayout({
  children,
}: LayoutProps) {
  return <>{children}</>;
}

