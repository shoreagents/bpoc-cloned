import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import pool from '@/lib/database';

// Use Node.js runtime to access database
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const personalityType = searchParams.get('type'); // D, I, S, or C
    const animal = searchParams.get('animal'); // Eagle, Peacock, Turtle, or Owl
    const title = searchParams.get('title') || 'BPO Professional';

    // Animal emoji mapping
    const animalEmoji: { [key: string]: string } = {
      'Eagle': '🦅',
      'Peacock': '🦚',
      'Turtle': '🐢',
      'Owl': '🦉',
      'D': '🦅',
      'I': '🦚',
      'S': '🐢',
      'C': '🦉'
    };

    // Personality type titles
    const personalityTitles: { [key: string]: string } = {
      'D': 'The Sky Dominator',
      'I': 'The Social Star',
      'S': 'The Steady Guardian',
      'C': 'The Wise Analyst'
    };

    if (!userId || !personalityType) {
      return new Response('Missing required parameters', { status: 400 });
    }

    // Fetch user data
    let user: any = null;
    try {
      const client = await pool.connect();
      try {
        const res = await client.query(
          `SELECT 
            u.id, u.full_name, u.avatar_url, u.position, u.location,
            u.location_city, u.location_country, u.slug as user_slug, u.username
           FROM users u
           WHERE u.id = $1
           LIMIT 1`,
          [userId]
        );
        
        if (res.rowCount > 0) {
          user = res.rows[0];
        }
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching user data from database:', error);
      // Continue with default values instead of failing - this ensures image is always generated
    }

    // Handle default userId case (for fallback OG images)
    const isDefaultUser = userId === 'default';
    
    const displayName = isDefaultUser ? 'BPOC User' : (user?.username || user?.user_slug || user?.full_name || 'Professional');
    const firstName = isDefaultUser ? 'BPOC' : (user?.full_name?.split(' ')[0] || displayName?.split(' ')[0] || 'Professional');
    const userTitle = isDefaultUser ? 'BPO Professional' : (user?.position || title);
    const location = isDefaultUser ? 'Philippines' : (user?.location || 
      (user?.location_city 
        ? `${user.location_city}${user?.location_country ? ', ' + user.location_country : ''}`
        : null));
    const avatarUrl = isDefaultUser ? null : (user?.avatar_url || null);
    const animalName = animal || (personalityType === 'D' ? 'Eagle' : personalityType === 'I' ? 'Peacock' : personalityType === 'S' ? 'Turtle' : 'Owl');
    const animalEmojiDisplay = animalEmoji[animalName] || animalEmoji[personalityType] || '🎯';
    const personalityTitle = personalityTitles[personalityType] || 'BPO Professional';

    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            backgroundColor: '#0f172a',
            backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(6, 182, 212, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(168, 85, 247, 0.15) 0%, transparent 50%)',
            position: 'relative',
          }}
        >
          {/* Left Side - Profile Info & Animal */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '80px',
              width: '60%',
            }}
          >
            {/* Profile Photo & Username */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 40,
              }}
            >
              {/* Avatar */}
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  width="160"
                  height="160"
                  style={{
                    borderRadius: '50%',
                    border: '5px solid #06B6D4',
                    objectFit: 'cover',
                    boxShadow: '0 10px 40px rgba(6, 182, 212, 0.5)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '160px',
                    height: '160px',
                    borderRadius: '50%',
                    border: '5px solid #06B6D4',
                    background: 'linear-gradient(135deg, #06B6D4 0%, #A855F7 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 40px rgba(6, 182, 212, 0.5)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '64px',
                      color: 'white',
                      fontWeight: 'bold',
                      display: 'flex',
                    }}
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}

              {/* Username & Location */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  marginLeft: 30,
                }}
              >
                <div
                  style={{
                    fontSize: 52,
                    fontWeight: 'bold',
                    color: 'white',
                    display: 'flex',
                  }}
                >
                  @{displayName}
                </div>
                {location && (
                  <div
                    style={{
                      fontSize: 24,
                      color: '#67E8F9',
                      marginTop: 10,
                      display: 'flex',
                    }}
                  >
                    {location}
                  </div>
                )}
              </div>
            </div>

            {/* Job Title */}
            <div
              style={{
                fontSize: 36,
                color: 'white',
                marginBottom: 30,
                display: 'flex',
                fontWeight: '600',
              }}
            >
              {userTitle}
            </div>

            {/* Animal & Personality Info */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 40,
              }}
            >
              <div
                style={{
                  fontSize: '80px',
                  marginRight: 20,
                  lineHeight: 1,
                }}
              >
                {animalEmojiDisplay}
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 'bold',
                    color: 'white',
                    marginBottom: 6,
                    lineHeight: 1.2,
                  }}
                >
                  {personalityTitle}
                </div>
                <div
                  style={{
                    fontSize: 24,
                    color: '#67E8F9',
                    lineHeight: 1.2,
                  }}
                >
                  {animalName} Personality
                </div>
              </div>
            </div>

            {/* BPOC Logo/Text */}
            <div
              style={{
                fontSize: 48,
                fontWeight: 'bold',
                display: 'flex',
                letterSpacing: '2px',
                color: '#06B6D4',
              }}
            >
              BPOC.IO
            </div>
          </div>

          {/* Right Side - CTA */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              width: '40%',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
              borderLeft: '2px solid rgba(6, 182, 212, 0.4)',
              padding: '60px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 'bold',
                  color: 'white',
                  lineHeight: 1.2,
                  display: 'flex',
                }}
              >
                {displayName}'s BPO Animal
              </div>
              <div
                style={{
                  fontSize: 38,
                  fontWeight: 'bold',
                  color: 'white',
                  marginTop: 10,
                  display: 'flex',
                }}
              >
                {animalName} {animalEmojiDisplay}
              </div>

              <div
                style={{
                  fontSize: 24,
                  color: '#67E8F9',
                  marginTop: 30,
                  lineHeight: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex' }}>Discover Your</div>
                <div style={{ display: 'flex', marginTop: 10 }}>BPO Animal Spirit</div>
              </div>

              {/* CTA Button */}
              <div
                style={{
                  marginTop: 40,
                  background: 'linear-gradient(135deg, #06B6D4 0%, #A855F7 100%)',
                  borderRadius: '12px',
                  padding: '20px 50px',
                  display: 'flex',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 10px 30px rgba(6, 182, 212, 0.5)',
                }}
              >
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 'bold',
                    color: 'white',
                    display: 'flex',
                  }}
                >
                  Sign Up Now
                </div>
              </div>

              <div
                style={{
                  fontSize: 20,
                  color: '#94A3B8',
                  marginTop: 30,
                  display: 'flex',
                }}
              >
                Where BPO Careers Begin
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
          'Cache-Control': 'public, max-age=3600, s-maxage=3600, must-revalidate',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    );

    return imageResponse;
  } catch (error) {
    console.error('Error generating DISC results OG image:', error);
    return new Response('Error generating image', { status: 500 });
  }
}

