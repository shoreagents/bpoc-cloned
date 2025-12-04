import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Trophy, Zap, BarChart3, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageProps {
  params: Promise<{ username: string }>;
}

async function getTypingHeroResults(username: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    
    const response = await fetch(`${baseUrl}/api/public/user-by-slug?slug=${username}`, {
      next: { revalidate: 60 },
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.user;
    }
  } catch (error) {
    console.error('Error fetching typing hero results:', error);
  }
  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.bpoc.io');
  
  const profile = await getTypingHeroResults(username);
  const ogImageUrl = `${baseUrl}/api/og/typing-hero?username=${username}&v=2`;
  
  const fullName = profile?.full_name || profile?.first_name || username;
  const bestWpm = profile?.game_stats?.typing_hero_stats?.best_wpm || 0;
  
  return {
    title: `${fullName}'s Typing Hero Results - ${bestWpm} WPM | BPOC.IO`,
    description: `Check out ${fullName}'s typing speed performance on BPOC.IO! Can you beat ${bestWpm} WPM?`,
    openGraph: {
      title: `${fullName}'s Typing Hero Results`,
      description: `Can you beat my typing speed? Best WPM: ${bestWpm}`,
      url: `${baseUrl}/results/typing-hero/${username}`,
      siteName: 'BPOC.IO',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${fullName}'s Typing Hero Results`,
          type: 'image/png',
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${fullName}'s Typing Hero Results`,
      description: `Can you beat my typing speed? Best WPM: ${bestWpm}`,
      images: [ogImageUrl],
    },
    other: {
      'og:image:width': '1200',
      'og:image:height': '630',
      'og:image:type': 'image/png',
    },
  };
}

export default async function TypingHeroResultPage({ params }: PageProps) {
  const { username } = await params;
  const profile = await getTypingHeroResults(username);
  
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Results Not Found</h1>
          <p className="text-gray-400 mb-6">We couldn't find typing results for this user.</p>
          <Link href="/">
            <Button className="bg-blue-500 hover:bg-blue-600">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const typingStats = profile.game_stats?.typing_hero_stats;
  const bestWpm = typingStats?.best_wpm || 0;
  const latestWpm = typingStats?.latest_wpm || 0;
  const avgWpm = typingStats?.avg_wpm || 0;
  const displayName = profile.username || username;
  const fullName = profile.full_name || profile.first_name || displayName;
  
  // Parse AI analysis
  let aiAnalysis: any = null;
  try {
    if (typingStats?.ai_analysis) {
      if (typeof typingStats.ai_analysis === 'string') {
        // Try to parse as JSON first
        try {
          aiAnalysis = JSON.parse(typingStats.ai_analysis);
        } catch (jsonError) {
          // If it's not JSON, it might be markdown/text or an error message - skip it
          console.warn('AI analysis is not valid JSON, skipping:', typingStats.ai_analysis.substring(0, 100));
          aiAnalysis = null;
        }
      } else {
        // Already an object
        aiAnalysis = typingStats.ai_analysis;
      }
    }
  } catch (error) {
    console.error('Error parsing AI analysis:', error);
    aiAnalysis = null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(34,197,94,0.1)_0%,transparent_50%)] pointer-events-none"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(16,185,129,0.1)_0%,transparent_50%)] pointer-events-none"></div>

      <div className="relative max-w-4xl mx-auto px-4 py-12">
        {/* Back Button */}
        <Link href={`/${username}`}>
          <Button variant="ghost" className="mb-8 text-gray-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">
            <span 
              className="inline-block"
              style={{
                animation: 'typingHero 2s ease-in-out infinite, typingGlow 3s ease-in-out infinite',
                transformOrigin: 'center',
                filter: 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.4))'
              }}
            >
              ⌨️
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">
            Typing Hero Performance
          </h1>
          <p className="text-sm text-gray-300">
            {fullName}'s keyboard mastery in action!
          </p>
        </div>

        {/* Stats Cards - Matching Profile Page Style */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* Best WPM */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl border border-green-400/20 hover:border-green-400/40 transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-4 text-center">
              <div className="text-2xl mb-2">🏆</div>
              <div className="text-green-400 font-bold text-2xl mb-1">{bestWpm}</div>
              <div className="text-green-300 text-sm font-medium">Best WPM</div>
              <div className="text-green-400/60 text-xs mt-1">Personal Record</div>
            </div>
          </div>

          {/* Latest WPM */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-400/20 hover:border-blue-400/40 transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-4 text-center">
              <div className="text-2xl mb-2">⚡</div>
              <div className="text-blue-400 font-bold text-2xl mb-1">{latestWpm}</div>
              <div className="text-blue-300 text-sm font-medium">Latest WPM</div>
              <div className="text-blue-400/60 text-xs mt-1">Most Recent</div>
            </div>
          </div>

          {/* Average WPM */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-400/20 hover:border-purple-400/40 transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-4 text-center">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-purple-400 font-bold text-2xl mb-1">{Math.round(avgWpm)}</div>
              <div className="text-purple-300 text-sm font-medium">Avg WPM</div>
              <div className="text-purple-400/60 text-xs mt-1">Consistent</div>
            </div>
          </div>
        </div>

        {/* Performance Analysis - Matching Profile Page Style */}
        {aiAnalysis?.aiAssessment && (
          <div className="mb-8 space-y-4">
            {/* Performance Analysis Section */}
            <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-400/30">
              <h3 className="text-sm font-semibold text-green-300 mb-3">Performance Analysis</h3>
              <div className="text-gray-300 text-sm leading-relaxed space-y-4">
                {/* Performance Level & Overall Assessment */}
                <div className="grid grid-cols-1 gap-3">
                  {aiAnalysis.aiAssessment.performanceLevel && (
                    <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded">
                      <span className="text-green-400 font-semibold">Performance Level:</span>
                      <span className="text-white font-bold">{aiAnalysis.aiAssessment.performanceLevel}</span>
                    </div>
                  )}
                  
                  {aiAnalysis.aiAssessment.overallAssessment && (
                    <div className="p-3 bg-gray-700/20 rounded">
                      <span className="text-green-400 font-semibold">Assessment:</span>
                      <p className="text-gray-300 mt-1">{aiAnalysis.aiAssessment.overallAssessment}</p>
                    </div>
                  )}
                </div>
                
                {/* Real-World Estimate */}
                <div className="p-4 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-lg border border-orange-400/30">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">💡</div>
                    <div>
                      <div className="text-yellow-400 font-semibold">Real-World Estimate</div>
                      <div className="text-2xl font-bold text-yellow-400">
                        {(() => {
                          const realWorldMin = Math.max(0, Math.round((latestWpm * 0.7) - 5));
                          const realWorldMax = Math.round((latestWpm * 0.8) + 5);
                          return `${realWorldMin}-${realWorldMax} WPM`;
                        })()}
                      </div>
                      <div className="text-gray-400 text-xs">Expected performance on standard typing tests</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Strengths Section */}
            {aiAnalysis.aiAssessment.strengths && aiAnalysis.aiAssessment.strengths.length > 0 && (
              <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-400/30">
                <h3 className="text-sm font-semibold text-yellow-300 mb-3">Strengths</h3>
                <div className="text-gray-300 text-sm leading-relaxed">
                  <div className="space-y-3">
                    {aiAnalysis.aiAssessment.strengths.map((strength: string, index: number) => (
                      <div key={index} className="flex items-start gap-3">
                        <span className="text-yellow-400 mt-1 flex-shrink-0">-</span>
                        <span className="text-gray-300 leading-relaxed">{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CTA Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 rounded-2xl blur-xl"></div>
          <div className="relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-2xl p-8 border border-green-500/20">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">💪 Can You Beat This?</h2>
              <p className="text-gray-400 mb-6">
                Test your typing speed and see how you compare!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/career-tools/games/typing-hero">
                  <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold px-8 py-6 text-lg">
                    Play Typing Hero
                  </Button>
                </Link>
                <Link href={`/${username}`}>
                  <Button variant="outline" className="border-green-400/30 text-green-300 hover:bg-green-500/10 px-8 py-6 text-lg">
                    <User className="w-5 h-5 mr-2" />
                    View Full Profile
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>Powered by <span className="text-green-400 font-semibold">BPOC.IO</span> - Where BPO Careers Begin</p>
        </div>
      </div>
    </div>
  );
}

