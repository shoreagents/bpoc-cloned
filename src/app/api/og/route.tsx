import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import pool from '@/lib/database';

// Use Node.js runtime to access database
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');

    if (!username) {
      return new Response('Missing username parameter', { status: 400 });
    }

    // Fetch user data directly from database
    let profile: any = null;
    try {
      const client = await pool.connect();
      try {
        const res = await client.query(
          `SELECT u.id, u.email, u.first_name, u.last_name, u.full_name, u.location, u.avatar_url, u.position, u.location_city, u.location_country,
           aar.overall_score as resume_score
           FROM users u
           LEFT JOIN ai_analysis_results aar ON u.id = aar.user_id
           WHERE u.slug = $1 OR u.username = $1
           LIMIT 1`,
          [username]
        );
        
        if (res.rowCount && res.rowCount > 0) {
          profile = res.rows[0];
        }
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching user data from database:', error);
    }

    // Default values if profile not found
    const displayName = username;
    const title = profile?.position || 'BPO Professional';
    const location = profile?.location || 
      (profile?.location_city 
        ? `${profile.location_city}${profile?.location_country ? ', ' + profile.location_country : ''}`
        : null);
        
    // Ensure high-quality avatar if it's from Supabase or Vercel Blob
    let avatarUrl = profile?.avatar_url || null;
    
    // Aggressive quality fix: remove any existing sizing params first
    if (avatarUrl) {
       // Remove existing query params if any to get the original raw image
       // This often returns the full resolution original upload
       const urlObj = new URL(avatarUrl);
       urlObj.search = ''; 
       avatarUrl = urlObj.toString();
    }

    const resumeScore = profile?.resume_score || null;

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
            {/* Left: Identity Block */}
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
                    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="50%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                  </defs>
                  <g>
                    <path fill="url(#logoGradient)" d="M226.42,485.24s78.8-350.4,437.6-350.4c0,0,328.4-19.2,440,320.4,0,0-80.4-330-438.8-338.4-385.52-9.04-464.8,368.4-464.8,368.4"/>
                    <rect fill="url(#logoGradient)" x="138.09" y="485.24" width="140.8" height="226.6" rx="54.4" ry="54.4"/>
                    <rect fill="url(#logoGradient)" x="632.05" y="982.21" width="74.4" height="175.02" rx="37.2" ry="37.2" transform="translate(-400.48 1738.97) rotate(-90)"/>
                    <path fill="url(#logoGradient)" d="M231.82,706.64s19.47,127.47,140.27,233.87,240,103.2,240,103.2v39.2s-192-19.2-296-148c-34.31-42.49-62.89-82.41-80-116-34.76-68.23-38.8-112-38.8-112l34.53-.27Z"/>
                    <path fill="url(#logoGradient)" d="M489.15,393.97h87.73v-55.73s74.13-18.4,134.93-6.13,220.4,80.13,220.4,263.33-155.2,272.8-262.4,272.8-309.6-83.4-261.6-345h261.6s68-.6,68,85-76.8,77.6-76.8,77.6c0,0-84,6.2-84-87.3,0-29.5-.8-39.1-.8-39.1h-88.8v72s6,144.8,172.8,144.8c147.2,0,168.8-116.35,168.8-178.17s-63.2-165.83-156-165.83h-322.4s-38.8,58.47-38.8,166.3,74.45,359.03,357.43,359.03,351.37-240.47,351.37-359.03-90-357.37-310.8-357.37-220.8,39.6-220.8,39.6c0,0-.93,113.2.13,113.2Z"/>
                  </g>
                </svg>
                <div style={{ color: '#38bdf8', fontSize: 24, fontWeight: 800, letterSpacing: '1px', display: 'flex' }}>BPOC.IO</div>
                <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)', margin: '0 15px', display: 'flex' }} />
                <div style={{ color: '#e0f2fe', fontSize: 20, fontWeight: 500, display: 'flex' }}>Where BPO Careers Begin</div>
              </div>

              {/* Name - Massive & Bright */}
              <div
                style={{
                  fontSize: 84,
                  fontWeight: 900,
                  color: '#ffffff',
                  lineHeight: 1,
                  letterSpacing: '-0.03em',
                  marginBottom: 20,
                  display: 'flex',
                  textShadow: '0 4px 30px rgba(0,0,0,0.8)',
                }}
              >
                {displayName}
              </div>

              {/* Role - Gradient Text */}
              <div
                style={{
                  fontSize: 42,
                  fontWeight: 700,
                  background: 'linear-gradient(90deg, #38bdf8, #c084fc, #34d399)',
                  backgroundClip: 'text',
                  color: 'transparent',
                  display: 'flex',
                  marginBottom: 30,
                  letterSpacing: '-0.01em',
                }}
              >
                {title}
              </div>

              {/* Location with Icon */}
              {location && (
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 50 }}>
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
                <div style={{ color: 'black', fontSize: 28, fontWeight: 800, marginRight: 10, display: 'flex' }}>Join {displayName.split(' ')[0]}</div>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </div>

            {/* Right: Avatar Spotlight */}
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
                  animation: 'spin 10s linear infinite',
                }}
              />

              {/* Avatar Image - Using standard img for consistent rendering */}
              <div
                style={{
                  display: 'flex',
                  width: '252px', // Container size
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
                {avatarUrl ? (
                  /* using img tag with explicit dimensions and object-fit to prevent tiling/collage effect */
                  <img
                    src={avatarUrl}
                    width="240"
                    height="240"
                    style={{
                      borderRadius: '50%',
                      objectFit: 'cover',
                      backgroundColor: '#000',
                      border: '4px solid #000',
                    }}
                  />
                ) : (
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
                    }}
                  >
                    <div
                      style={{
                        fontSize: '96px',
                        fontWeight: 900,
                        background: 'linear-gradient(135deg, #fff, #aaa)',
                        backgroundClip: 'text',
                        color: 'transparent',
                        display: 'flex',
                      }}
                    >
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  </div>
                )}
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
    console.error('Error generating OG image:', error);
    return new Response('Error generating image', { status: 500 });
  }
}
