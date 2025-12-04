import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import pool from '@/lib/database';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');

    if (!username) {
      return new Response('Missing username parameter', { status: 400 });
    }

    // Fetch user data from database
    let profile: any = null;
    let discStats: any = null;
    
    try {
      const client = await pool.connect();
      try {
        // Get user info
        const userRes = await client.query(
          `SELECT u.id, u.first_name, u.username, u.avatar_url
           FROM users u
           WHERE u.slug = $1 OR u.username = $1
           LIMIT 1`,
          [username]
        );
        
        if (userRes.rowCount > 0) {
          profile = userRes.rows[0];
          
          // Get DISC personality stats
          const statsRes = await client.query(
            `SELECT latest_primary_type, latest_d_score, latest_i_score, latest_s_score, latest_c_score
             FROM disc_personality_stats
             WHERE user_id = $1
             LIMIT 1`,
            [profile.id]
          );
          
          if (statsRes.rowCount > 0) {
            discStats = statsRes.rows[0];
          }
        }
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching DISC data:', error);
    }

    const displayName = username;
    // Aggressive quality fix: remove any existing sizing params first for avatar
    let avatarUrl = profile?.avatar_url || null;
    if (avatarUrl) {
       const urlObj = new URL(avatarUrl);
       urlObj.search = ''; 
       avatarUrl = urlObj.toString();
    }

    const primaryType = discStats?.latest_primary_type || 'D';
    const dScore = discStats?.latest_d_score || 0;
    const iScore = discStats?.latest_i_score || 0;
    const sScore = discStats?.latest_s_score || 0;
    const cScore = discStats?.latest_c_score || 0;

    // Get animal emoji and name based on primary type
    const getAnimalInfo = (type: string) => {
      switch (type) {
        case 'I':
          return { emoji: '🦚', name: 'PEACOCK', description: 'The Social Star' };
        case 'S':
          return { emoji: '🐢', name: 'TURTLE', description: 'The Steady Guardian' };
        case 'C':
          return { emoji: '🦉', name: 'OWL', description: 'The Wise Analyst' };
        default: // 'D'
          return { emoji: '🦅', name: 'EAGLE', description: 'The Sky Dominator' };
      }
    };

    const animalInfo = getAnimalInfo(primaryType);

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
            padding: '50px',
            justifyContent: 'center',
            alignItems: 'center',
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

          {/* Main Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              width: '100%',
              gap: '40px',
              alignItems: 'center',
              position: 'relative',
              zIndex: 10,
            }}
          >
            {/* Left Side - Animal & User - Styled to match Profile Identity Block */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'center',
                width: '40%',
              }}
            >
               {/* Glowing Brand Tag */}
               <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '40px',
                  background: 'rgba(14, 165, 233, 0.1)',
                  border: '1px solid rgba(14, 165, 233, 0.3)',
                  padding: '10px 24px',
                  borderRadius: '50px',
                  width: 'auto',
                  boxShadow: '0 0 20px rgba(14, 165, 233, 0.15)',
                }}
              >
                {/* Logo SVG with Gradient */}
                <svg width="32" height="32" viewBox="0 0 1242.1 1223.6" style={{ marginRight: 12, display: 'flex' }}>
                  <defs>
                    <linearGradient id="logoGradientDisc" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="50%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                  </defs>
                  <path fill="url(#logoGradientDisc)" d="M226.42,485.24s78.8-350.4,437.6-350.4c0,0,328.4-19.2,440,320.4,0,0-80.4-330-438.8-338.4-385.52-9.04-464.8,368.4-464.8,368.4"/>
                  <rect fill="url(#logoGradientDisc)" x="138.09" y="485.24" width="140.8" height="226.6" rx="54.4" ry="54.4"/>
                  <rect fill="url(#logoGradientDisc)" x="632.05" y="982.21" width="74.4" height="175.02" rx="37.2" ry="37.2" transform="translate(-400.48 1738.97) rotate(-90)"/>
                  <path fill="url(#logoGradientDisc)" d="M231.82,706.64s19.47,127.47,140.27,233.87,240,103.2,240,103.2v39.2s-192-19.2-296-148c-34.31-42.49-62.89-82.41-80-116-34.76-68.23-38.8-112-38.8-112l34.53-.27Z"/>
                  <path fill="url(#logoGradientDisc)" d="M489.15,393.97h87.73v-55.73s74.13-18.4,134.93-6.13,220.4,80.13,220.4,263.33-155.2,272.8-262.4,272.8-309.6-83.4-261.6-345h261.6s68-.6,68,85-76.8,77.6-76.8,77.6c0,0-84,6.2-84-87.3,0-29.5-.8-39.1-.8-39.1h-88.8v72s6,144.8,172.8,144.8c147.2,0,168.8-116.35,168.8-178.17s-63.2-165.83-156-165.83h-322.4s-38.8,58.47-38.8,166.3,74.45,359.03,357.43,359.03,351.37-240.47,351.37-359.03-90-357.37-310.8-357.37-220.8,39.6-220.8,39.6c0,0-.93,113.2.13,113.2Z"/>
                </svg>
                <div style={{ color: '#38bdf8', fontSize: 24, fontWeight: 800, letterSpacing: '1px', display: 'flex' }}>BPOC.IO</div>
              </div>

              {/* Animal Emoji */}
              <div
                style={{
                  fontSize: '140px',
                  marginBottom: '10px',
                  display: 'flex',
                  filter: 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.3))',
                }}
              >
                {animalInfo.emoji}
              </div>

              {/* Animal Name */}
              <div
                style={{
                  fontSize: '52px',
                  fontWeight: 900,
                  color: 'white',
                  marginBottom: '5px',
                  display: 'flex',
                  letterSpacing: '-0.02em',
                }}
              >
                {animalInfo.name}
              </div>

              {/* Description */}
              <div
                style={{
                  fontSize: '24px',
                  background: 'linear-gradient(90deg, #38bdf8, #c084fc)',
                  backgroundClip: 'text',
                  color: 'transparent',
                  marginBottom: '30px',
                  display: 'flex',
                  fontWeight: 600,
                }}
              >
                {animalInfo.description}
              </div>

              {/* Avatar & Username */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: '15px',
                  background: 'rgba(255,255,255,0.05)',
                  padding: '10px 20px',
                  borderRadius: '40px',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    width="60"
                    height="60"
                    style={{
                      borderRadius: '50%',
                      border: '2px solid #a855f7',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      border: '2px solid #a855f7',
                      background: 'linear-gradient(135deg, #111, #222)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '28px',
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
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#e2e8f0',
                    display: 'flex',
                  }}
                >
                  @{displayName}
                </div>
              </div>
            </div>

            {/* Right Side - DISC Scores */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '60%',
                gap: '20px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(168, 85, 247, 0.1)',
                borderRadius: '24px',
                padding: '30px',
              }}
            >
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#e2e8f0',
                  marginBottom: '10px',
                  display: 'flex',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  paddingBottom: '10px',
                }}
              >
                DISC Personality Profile
              </div>

              {/* D - Dominance */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: 600,
                      color: '#EF4444', // Keep Red for D
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <span style={{ display: 'flex' }}>🦅</span>
                    <span style={{ display: 'flex' }}>Dominance</span>
                  </div>
                  <div
                    style={{
                      fontSize: '28px',
                      fontWeight: 800,
                      color: 'white',
                      display: 'flex',
                    }}
                  >
                    {dScore}%
                  </div>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '10px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    display: 'flex',
                  }}
                >
                  <div
                    style={{
                      width: `${dScore}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)',
                      borderRadius: '6px',
                      display: 'flex',
                    }}
                  />
                </div>
              </div>

              {/* I - Influence */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: 600,
                      color: '#FBBF24', // Keep Yellow for I
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <span style={{ display: 'flex' }}>🦚</span>
                    <span style={{ display: 'flex' }}>Influence</span>
                  </div>
                  <div
                    style={{
                      fontSize: '28px',
                      fontWeight: 800,
                      color: 'white',
                      display: 'flex',
                    }}
                  >
                    {iScore}%
                  </div>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '10px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    display: 'flex',
                  }}
                >
                  <div
                    style={{
                      width: `${iScore}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #FBBF24 0%, #F59E0B 100%)',
                      borderRadius: '6px',
                      display: 'flex',
                    }}
                  />
                </div>
              </div>

              {/* S - Steadiness */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: 600,
                      color: '#10B981', // Keep Green for S
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <span style={{ display: 'flex' }}>🐢</span>
                    <span style={{ display: 'flex' }}>Steadiness</span>
                  </div>
                  <div
                    style={{
                      fontSize: '28px',
                      fontWeight: 800,
                      color: 'white',
                      display: 'flex',
                    }}
                  >
                    {sScore}%
                  </div>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '10px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    display: 'flex',
                  }}
                >
                  <div
                    style={{
                      width: `${sScore}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
                      borderRadius: '6px',
                      display: 'flex',
                    }}
                  />
                </div>
              </div>

              {/* C - Conscientiousness */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: 600,
                      color: '#3B82F6', // Keep Blue for C
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <span style={{ display: 'flex' }}>🦉</span>
                    <span style={{ display: 'flex' }}>Conscientiousness</span>
                  </div>
                  <div
                    style={{
                      fontSize: '28px',
                      fontWeight: 800,
                      color: 'white',
                      display: 'flex',
                    }}
                  >
                    {cScore}%
                  </div>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '10px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    display: 'flex',
                  }}
                >
                  <div
                    style={{
                      width: `${cScore}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)',
                      borderRadius: '6px',
                      display: 'flex',
                    }}
                  />
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
    console.error('Error generating BPOC DISC OG image:', error);
    return new Response('Error generating image', { status: 500 });
  }
}
