import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageProps {
  params: Promise<{ username: string }>;
}

async function getBpocDiscResults(username: string) {
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
    console.error('Error fetching BPOC DISC results:', error);
  }
  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.bpoc.io');
  
  const profile = await getBpocDiscResults(username);
  const ogImageUrl = `${baseUrl}/api/og/bpoc-disc?username=${username}&v=2`;
  
  const fullName = profile?.full_name || profile?.first_name || username;
  const primaryType = profile?.game_stats?.disc_personality_stats?.primary_type || 'D';
  const animalMap: {[key: string]: string} = {
    'D': 'Eagle',
    'I': 'Peacock',
    'S': 'Turtle',
    'C': 'Owl'
  };
  const animalName = animalMap[primaryType] || 'Eagle';
  
  return {
    title: `${fullName}'s BPOC DISC Results - ${animalName} | BPOC.IO`,
    description: `${fullName} is a ${animalName} personality! Discover your DISC personality type on BPOC.IO.`,
    openGraph: {
      title: `${fullName}'s BPOC DISC Results`,
      description: `I'm a ${animalName}! What's your personality type?`,
      url: `${baseUrl}/results/bpoc-disc/${username}`,
      siteName: 'BPOC.IO',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${fullName}'s BPOC DISC Personality Results`,
          type: 'image/png',
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${fullName}'s BPOC DISC Results`,
      description: `I'm a ${animalName}! What's your personality type?`,
      images: [ogImageUrl],
    },
    other: {
      'og:image:width': '1200',
      'og:image:height': '630',
      'og:image:type': 'image/png',
    },
  };
}

export default async function BpocDiscResultPage({ params }: PageProps) {
  const { username } = await params;
  const profile = await getBpocDiscResults(username);
  
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Results Not Found</h1>
          <p className="text-gray-400 mb-6">We couldn't find DISC results for this user.</p>
          <Link href="/">
            <Button className="bg-blue-500 hover:bg-blue-600">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const discStats = profile.game_stats?.disc_personality_stats;
  
  // Calculate scores - use d_score, i_score, s_score, c_score if available, otherwise use d, i, s, c
  const dScore = discStats?.d_score ?? discStats?.d ?? 0;
  const iScore = discStats?.i_score ?? discStats?.i ?? 0;
  const sScore = discStats?.s_score ?? discStats?.s ?? 0;
  const cScore = discStats?.c_score ?? discStats?.c ?? 0;
  
  // Always recalculate primary type from scores to ensure accuracy (matching profile page)
  const scoreValues = {
    D: dScore,
    I: iScore,
    S: sScore,
    C: cScore
  };
  const maxScore = Math.max(...Object.values(scoreValues));
  const calculatedPrimaryType = Object.keys(scoreValues).find(key => scoreValues[key as keyof typeof scoreValues] === maxScore) || 'D';
  const primaryType = calculatedPrimaryType;
  
  const displayName = profile.username || username;
  const fullName = profile.full_name || profile.first_name || displayName;

  const animalInfo: {[key: string]: {emoji: string, name: string, description: string, color: string}} = {
    'D': { emoji: '🦅', name: 'EAGLE', description: 'The Sky Dominator - You soar above challenges and lead from the front!', color: 'red' },
    'I': { emoji: '🦚', name: 'PEACOCK', description: 'The Social Star - You light up rooms and connect with people effortlessly!', color: 'yellow' },
    'S': { emoji: '🐢', name: 'TURTLE', description: 'The Steady Guardian - You keep everything running smoothly!', color: 'green' },
    'C': { emoji: '🦉', name: 'OWL', description: 'The Wise Analyst - You spot what others miss!', color: 'blue' }
  };

  const animal = animalInfo[primaryType] || animalInfo['D'];
  
  // Parse AI assessment - use as string directly
  const aiAssessment = discStats?.latest_ai_assessment || null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.1)_0%,transparent_50%)] pointer-events-none"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(99,102,241,0.1)_0%,transparent_50%)] pointer-events-none"></div>

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
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            BPOC DISC Personality
          </h1>
          <p className="text-sm text-gray-300 mb-6">
            {fullName}'s personality assessment results
          </p>
        </div>

        {/* Animal Display - matching profile page */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-2">
            {primaryType === 'D' && (
              <span className="inline-block text-6xl animal-bounce">🦅</span>
            )}
            {primaryType === 'I' && (
              <span className="inline-block text-6xl animal-bounce">🦚</span>
            )}
            {primaryType === 'S' && (
              <span className="inline-block text-6xl animal-bounce">🐢</span>
            )}
            {primaryType === 'C' && (
              <span className="inline-block text-6xl animal-bounce">🦉</span>
            )}
          </div>
          <h4 className="text-xl font-bold text-white mb-2">
            {primaryType === 'D' && '🦅 EAGLE'}
            {primaryType === 'I' && '🦚 PEACOCK'}
            {primaryType === 'S' && '🐢 TURTLE'}
            {primaryType === 'C' && '🦉 OWL'}
          </h4>
          <p className="text-sm text-gray-300">
            {primaryType === 'D' && 'The Sky Dominator - You soar above challenges and lead from the front!'}
            {primaryType === 'I' && 'The Social Star - You light up rooms and connect with people effortlessly!'}
            {primaryType === 'S' && 'The Steady Guardian - You keep everything running smoothly and provide the foundation teams depend on!'}
            {primaryType === 'C' && 'The Wise Analyst - You spot what others miss and ensure everything meets the highest standards!'}
          </p>
        </div>

        {/* DISC Scores - Grid Layout matching profile page */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {(() => {
            const scores = [
              { type: 'D', label: '🦅 Dominance', score: dScore, color: 'red' },
              { type: 'I', label: '🦚 Influence', score: iScore, color: 'yellow' },
              { type: 'S', label: '🐢 Steadiness', score: sScore, color: 'green' },
              { type: 'C', label: '🦉 Conscientiousness', score: cScore, color: 'blue' }
            ];
            
            // Find the highest score
            const maxScore = Math.max(...scores.map(s => s.score));
            
            // Sort scores: primary type first, then highest score, then by score descending
            const sortedScores = scores.sort((a, b) => {
              const aIsPrimary = primaryType === a.type;
              const bIsPrimary = primaryType === b.type;
              const aIsHighest = a.score === maxScore && a.score > 0;
              const bIsHighest = b.score === maxScore && b.score > 0;
              
              // Primary type comes first
              if (aIsPrimary && !bIsPrimary) return -1;
              if (!aIsPrimary && bIsPrimary) return 1;
              
              // If both or neither are primary, highest score comes first
              if (aIsHighest && !bIsHighest) return -1;
              if (!aIsHighest && bIsHighest) return 1;
              
              // Otherwise sort by score descending
              return b.score - a.score;
            });
            
            return sortedScores.map((item) => {
              const isHighest = item.score === maxScore && item.score > 0;
              const isPrimary = primaryType === item.type;
              
              return (
                <div key={item.type} className={`flex flex-col p-3 rounded-lg border transition-all duration-300 ${
                  isHighest 
                    ? `bg-gradient-to-r from-${item.color}-500/20 to-${item.color}-600/20 border-${item.color}-400/50 shadow-lg shadow-${item.color}-400/20`
                    : `bg-gradient-to-r from-${item.color}-500/10 to-${item.color}-600/10 border-${item.color}-400/30`
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-semibold flex items-center gap-2 ${
                      isHighest 
                        ? `text-${item.color}-300 font-bold`
                        : `text-${item.color}-400`
                    }`}>
                      <span className="text-lg">{item.label.split(' ')[0]}</span>
                      <span>
                        {item.label.split(' ').slice(1).join(' ').split('').map((char, idx) => {
                          if (idx === 0) {
                            return <span key={idx} className={`font-bold text-lg ${
                              item.color === 'red' ? 'text-red-200' :
                              item.color === 'yellow' ? 'text-yellow-200' :
                              item.color === 'green' ? 'text-green-200' :
                              item.color === 'blue' ? 'text-blue-200' : 'text-cyan-300'
                            }`}>{char}</span>
                          }
                          return char
                        })}
                      </span>
                    </span>
                    <span className={`font-bold ${
                      isHighest 
                        ? `text-${item.color}-200 text-lg`
                        : 'text-white text-base'
                    }`}>
                      {item.score}%
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {isPrimary && <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">Primary</span>}
                    {isHighest && <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full">Highest</span>}
                  </div>
                </div>
              );
            });
          })()}
        </div>

        {/* Detailed Analysis Section - matching profile page */}
        {aiAssessment && (
          <div className="mb-8 space-y-4">
            {/* Detailed Analysis */}
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-lg border border-blue-400/30">
              <div className="w-full flex items-center justify-between text-sm font-semibold text-blue-300 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  Detailed Analysis
                </div>
              </div>
              <div className="text-gray-300 text-sm leading-relaxed">
                {(() => {
                  const assessment = aiAssessment;
                  
                  // Extract the comprehensive assessment and animal personality reason sections
                  let comprehensiveContent = '';
                  let animalContent = '';
                  
                  // Get the comprehensive assessment section (everything before CORE TRAITS)
                  if (assessment.includes('CORE TRAITS')) {
                    comprehensiveContent = assessment.split('CORE TRAITS')[0].trim();
                  } else if (assessment.includes('COMPREHENSIVE ASSESSMENT')) {
                    const comprehensiveSection = assessment.split('COMPREHENSIVE ASSESSMENT')[1];
                    if (comprehensiveSection) {
                      const beforeCoreTraits = comprehensiveSection.split('CORE TRAITS')[0];
                      comprehensiveContent = 'COMPREHENSIVE ASSESSMENT:' + beforeCoreTraits;
                    }
                  }
                  
                  // Get user's primary type - recalculate from scores
                  let userPrimaryType = primaryType;
                  
                  // Create animal personality reason based on user's actual animal
                  const animalMap = {
                    'D': { emoji: '🦅', name: 'EAGLE', traits: 'leadership instincts and decisive nature' },
                    'I': { emoji: '🦚', name: 'PEACOCK', traits: 'social influence and team-building abilities' },
                    'S': { emoji: '🐢', name: 'TURTLE', traits: 'reliability and steady support' },
                    'C': { emoji: '🦉', name: 'OWL', traits: 'analytical thinking and systematic approach' }
                  };
                  
                  let userAnimalData = animalMap[userPrimaryType as keyof typeof animalMap] || animalMap['D'];
                  let userAnimalName = userAnimalData.name;
                  let userAnimalTraits = userAnimalData.traits;
                  
                  // Additional fallback: Try to determine animal from content if scores are wrong
                  if (assessment && assessment.length > 100) {
                    const assessmentLower = assessment.toLowerCase();
                    let detectedAnimal = null;
                    
                    if (assessmentLower.includes('owl') && assessmentLower.includes('conscientiousness')) {
                      detectedAnimal = 'C';
                    } else if (assessmentLower.includes('eagle') && assessmentLower.includes('dominance')) {
                      detectedAnimal = 'D';
                    } else if (assessmentLower.includes('peacock') && assessmentLower.includes('influence')) {
                      detectedAnimal = 'I';
                    } else if (assessmentLower.includes('turtle') && assessmentLower.includes('steadiness')) {
                      detectedAnimal = 'S';
                    }
                    
                    if (detectedAnimal && detectedAnimal !== userPrimaryType) {
                      userPrimaryType = detectedAnimal;
                      const correctedAnimalData = animalMap[detectedAnimal as keyof typeof animalMap];
                      userAnimalData = correctedAnimalData;
                      userAnimalName = correctedAnimalData.name;
                      userAnimalTraits = correctedAnimalData.traits;
                    }
                  }
                  
                  // Try to extract the actual AI assessment content from database
                  let animalReasonParagraph = assessment.split('\n\n').find((paragraph: string) => 
                    paragraph.toLowerCase().includes('animal personality reason')
                  );
                  
                  if (animalReasonParagraph) {
                    const reasonContent = animalReasonParagraph
                      .split(/animal personality reason[:\s]*/i)[1]
                      ?.trim();
                    
                    if (reasonContent) {
                      const bulletPoints = reasonContent
                        .split('\n')
                        .map((line: string) => line.trim())
                        .filter((line: string) => line && line.startsWith('•'))
                        .map((line: string) => line.replace(/^•\s*/, '').trim())
                        .filter((line: string) => line.length > 0);
                      
                      if (bulletPoints.length > 0) {
                        animalContent = bulletPoints.join('\n');
                      } else {
                        animalContent = reasonContent;
                      }
                    }
                  }
                  
                  // If not found, try alternative patterns
                  let alternativeParagraph = null;
                  if (!animalContent || animalContent.length < 10) {
                    alternativeParagraph = assessment.split('\n\n').find((paragraph: string) => {
                      const lowerParagraph = paragraph.toLowerCase();
                      return (lowerParagraph.includes('animal personality') && 
                              (lowerParagraph.includes('analysis') || 
                               lowerParagraph.includes('reason') ||
                               lowerParagraph.includes('instincts'))) ||
                             (lowerParagraph.includes('eagle') && lowerParagraph.includes('personality')) ||
                             (lowerParagraph.includes('peacock') && lowerParagraph.includes('personality')) ||
                             (lowerParagraph.includes('turtle') && lowerParagraph.includes('personality')) ||
                             (lowerParagraph.includes('owl') && lowerParagraph.includes('personality'));
                    });
                    
                    if (alternativeParagraph) {
                      const content = alternativeParagraph
                        .split(/animal personality[:\s]*/i)[1] ||
                        alternativeParagraph
                        .split(/personality[:\s]*/i)[1] ||
                        alternativeParagraph;
                      
                      if (content && content.trim().length > 10) {
                        animalContent = content.trim();
                      }
                    }
                  }
                  
                  // Final fallback: Look for specific animal name in assessment
                  if (!animalContent || animalContent.length < 10) {
                    const animalSpecificParagraph = assessment.split('\n\n').find((paragraph: string) => {
                      const lowerParagraph = paragraph.toLowerCase();
                      const animalLower = userAnimalName.toLowerCase();
                      return lowerParagraph.includes(animalLower) && 
                             (lowerParagraph.includes('personality') || 
                              lowerParagraph.includes('instincts') ||
                              lowerParagraph.includes('natural'));
                    });
                    
                    if (animalSpecificParagraph) {
                      const content = animalSpecificParagraph
                        .split(new RegExp(`${userAnimalName}[:\s]*`, 'i'))[1] ||
                        animalSpecificParagraph;
                      
                      if (content && content.trim().length > 10) {
                        animalContent = content.trim();
                      }
                    }
                  }
                  
                  // Final fallback: Generate correct animal personality reason if database content not found
                  if (!animalContent || animalContent.length < 10) {
                    const userName = fullName || 'this person';
                    animalContent = `• Like the ${userAnimalName}'s natural instincts, ${userName} demonstrates ${userAnimalTraits} in their decision-making patterns\n• The ${userAnimalName} personality reflects ${userName}'s authentic approach to challenges and social interactions\n• This ${userPrimaryType === 'D' ? 'dominance' : userPrimaryType === 'I' ? 'influence' : userPrimaryType === 'S' ? 'steadiness' : 'conscientiousness'}-dominant profile shows how ${userName} naturally navigates professional and personal situations`;
                  }
                  
                  // Clean up the content
                  const cleanComprehensive = comprehensiveContent
                    .replace(/^[^:]*:\s*/, '')
                    .trim();
                  
                  const cleanAnimal = animalContent.trim();
                  
                  if ((cleanComprehensive && cleanComprehensive.length > 50) || (cleanAnimal && cleanAnimal.length > 10)) {
                    return (
                      <div className="space-y-6">
                        {/* Comprehensive Assessment Section */}
                        {cleanComprehensive && cleanComprehensive.length > 50 && (
                          <div>
                            <h4 className="text-blue-300 font-semibold mb-3 text-sm">COMPREHENSIVE ASSESSMENT:</h4>
                            <div className="text-gray-300 leading-relaxed space-y-4">
                              <span 
                                dangerouslySetInnerHTML={{
                                  __html: cleanComprehensive
                                    .replace(/\*\*/g, '')
                                    .replace(/\n\n/g, '</p><p class="mb-4">')
                                    .replace(/^/, '<p class="mb-4">')
                                    .replace(/$/, '</p>')
                                    .replace(/\b(Natural Instinct|Decision Pattern|Challenge Navigation|Key Insight|Growth Area)\b/gi, 
                                      '<span class="text-cyan-400 font-semibold">$1</span>')
                                    .replace(/\b(dominance|influence|steadiness|conscientiousness)\b/gi, 
                                      '<span class="text-purple-400 font-medium">$1</span>')
                                    .replace(/\b(peacock|eagle|turtle|owl)\b/gi, 
                                      '<span class="text-green-400 font-medium">$1</span>')
                                    .replace(/\b(strengths?|blind spots?|recommendations?|response|critical|essential|important|should|must|need to)\b/gi, 
                                      '<span class="text-yellow-400 font-semibold">$1</span>')
                                    .replace(/\b(high|low|equal|balanced|calculated|purposeful|strategic|harmony|accuracy|support|information|confronting|directly|firm|challenging|situations)\b/gi, 
                                      '<span class="text-orange-400 font-medium">$1</span>')
                                    .replace(/\b(husay at tiyaga|tapang at tiyaga|pakikisama|malasakit|pagkamatiyaga)\b/gi, 
                                      '<span class="text-pink-400 font-semibold">$1</span>')
                                }}
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* Animal Personality Reason Section */}
                        {cleanAnimal && cleanAnimal.length > 10 && (
                          <div>
                            <h4 className="text-lg font-semibold text-purple-300 mb-3">
                              ANIMAL PERSONALITY ({userAnimalName}) ANALYSIS:
                            </h4>
                            <div className="space-y-4">
                              {cleanAnimal
                                .split('\n')
                                .filter((line: string) => {
                                  const trimmed = line.trim();
                                  return trimmed && 
                                         !trimmed.toLowerCase().includes('animal personality reason') &&
                                         !trimmed.toLowerCase().includes('animal personality -') &&
                                         !trimmed.toLowerCase().includes('personality analysis') &&
                                         !trimmed.match(/^[A-Z\s]+:$/);
                                })
                                .map((point: string, bulletIndex: number) => (
                                  <div key={bulletIndex} className="flex items-start gap-2 mb-6">
                                    <span className="text-purple-400 mt-1">•</span>
                                    <span className="text-gray-300 leading-relaxed">{point.replace(/\*\*/g, '').replace(/^•\s*/, '')}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  return 'Your unique personality traits make you naturally suited to this animal archetype.';
                })()}
              </div>
            </div>

            {/* Core Traits Section */}
            {aiAssessment && (
              <div className="mt-4 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-400/30">
                <div className="w-full flex items-center justify-between text-sm font-semibold text-green-300 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    Core Traits
                  </div>
                </div>
                <div className="text-gray-300 text-sm leading-relaxed">
                  {(() => {
                    const assessment = aiAssessment;
                    
                    // Extract the core traits section
                    if (assessment.includes('CORE TRAITS')) {
                      const traitsSection = assessment
                        .split('CORE TRAITS')[1]
                        ?.split('\n\n')[0]
                        ?.trim();
                      
                      if (traitsSection) {
                        // Clean up the content and split into individual traits
                        const cleanTraits = traitsSection
                          .replace(/^[^:]*:\s*/, '')
                          .trim();
                        
                        // Split by bullet points or dashes to get individual traits with their evidence
                        let traits = cleanTraits
                          .split(/^[-•]\s*/m)
                          .map((trait: string) => trait.trim())
                          .filter((trait: string) => trait.length > 0);
                        
                        // If no bullet points found, try to split by line breaks
                        if (traits.length === 1) {
                          traits = cleanTraits
                            .split(/\n/)
                            .map((trait: string) => trait.trim())
                            .filter((trait: string) => trait.length > 0);
                        }
                        
                        // Add hyphens to compound words (same as profile page)
                        traits = traits.map((trait: string) => {
                          return trait
                            .replace(/\bproblemsolver\b/gi, 'problem-solver')
                            .replace(/\bqualityfocused\b/gi, 'quality-focused')
                            .replace(/\bprocessoriented\b/gi, 'process-oriented')
                            .replace(/\bdetailoriented\b/gi, 'detail-oriented')
                            .replace(/\bresultsoriented\b/gi, 'results-oriented')
                            .replace(/\bpeopleoriented\b/gi, 'people-oriented')
                            .replace(/\btaskoriented\b/gi, 'task-oriented')
                            .replace(/\bgoaloriented\b/gi, 'goal-oriented')
                            .replace(/\boutcomeoriented\b/gi, 'outcome-oriented')
                            .replace(/\bteamoriented\b/gi, 'team-oriented')
                            .replace(/\bclientoriented\b/gi, 'client-oriented')
                            .replace(/\bdataoriented\b/gi, 'data-oriented')
                            .replace(/\bactionoriented\b/gi, 'action-oriented')
                            .replace(/\brelationshipconscious\b/gi, 'relationship-conscious')
                            .replace(/\bstrategicrelationship\b/gi, 'strategic relationship')
                            .replace(/\badaptablecommunicator\b/gi, 'adaptable communicator')
                            .replace(/\bprocessfocused\b/gi, 'process-focused')
                            .replace(/\bresultfocused\b/gi, 'result-focused')
                            .replace(/\boutcomefocused\b/gi, 'outcome-focused')
                            .replace(/\bteamfocused\b/gi, 'team-focused')
                            .replace(/\bclientfocused\b/gi, 'client-focused')
                            .replace(/\bdatafocused\b/gi, 'data-focused')
                            .replace(/\bproblemfocused\b/gi, 'problem-focused')
                            .replace(/\bsolutionfocused\b/gi, 'solution-focused')
                            .replace(/\bactionfocused\b/gi, 'action-focused');
                        });
                        
                        return (
                          <div className="space-y-3">
                            {traits.map((trait: string, index: number) => (
                              <div key={index} className="flex items-start gap-3">
                                <span className="text-green-400 mt-1 flex-shrink-0">-</span>
                                <span 
                                  className="text-gray-300 leading-relaxed"
                                  dangerouslySetInnerHTML={{
                                    __html: trait
                                      .replace(/\*\*/g, '')
                                      .replace(/\b(leadership|communication|analytical|creative|organized|strategic|empathetic|decisive|collaborative|detail-oriented|methodical|quality-focused|perfectionist|emerging|quiet|leader|process-oriented|thinker|problem-solver)\b/gi, 
                                        '<span class="text-green-400 font-semibold">$1</span>')
                                      .replace(/\b(strong|natural|key|primary|essential|core|fundamental)\b/gi, 
                                        '<span class="text-yellow-400 font-medium">$1</span>')
                                      .replace(/\b(evidenced by|shown in|demonstrated through|reflected in)\b/gi, 
                                        '<span class="text-blue-400 font-medium">$1</span>')
                                      .replace(/\b(Dominance|Influence|Steadiness|Conscientiousness|DISC)\b/gi, 
                                        '<span class="text-purple-400 font-medium">$1</span>')
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        );
                      }
                    }
                    
                    return 'Your core personality traits are being analyzed.';
                  })()}
                </div>
              </div>
            )}

            {/* Cultural Strengths Section */}
            {aiAssessment && (
              <div className="mt-4 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-400/30">
                <div className="w-full flex items-center justify-between text-sm font-semibold text-purple-300 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                    Cultural Strengths
                  </div>
                </div>
                <div className="text-gray-300 text-sm leading-relaxed">
                  {(() => {
                    const assessment = aiAssessment;
                    
                    // Extract the cultural strengths section
                    if (assessment.includes('CULTURAL STRENGTHS')) {
                      const culturalSection = assessment
                        .split('CULTURAL STRENGTHS')[1]
                        ?.split('\n\n')[0]
                        ?.trim();
                      
                      if (culturalSection) {
                        // Clean up the content and display as bullet points
                        const cleanCultural = culturalSection
                          .replace(/^[^:]*:\s*/, '')
                          .trim();
                        
                        // Split by numbered items or bullet points and display each as a separate line
                        const bulletPoints = cleanCultural
                          .split(/(?<=^|\n)\s*(?:\d+\.\s*|[-•*]\s+)/)
                          .map((point: string) => point.trim())
                          .filter((point: string) => point.length > 0);
                        
                        return (
                          <div className="space-y-3">
                            {bulletPoints.map((point: string, bulletIndex: number) => (
                              <div key={bulletIndex} className="flex items-start gap-3">
                                <span className="text-purple-400 mt-1 flex-shrink-0">-</span>
                                <span 
                                  className="text-gray-300 leading-relaxed"
                                  dangerouslySetInnerHTML={{
                                    __html: point
                                      .replace(/\*\*/g, '')
                                      .replace(/\b(pakikisama|malasakit|bayanihan|kapwa|utang na loob|hiya|pagkamatiyaga|tiyaga)\b/gi, 
                                        '<span class="text-purple-400 font-semibold">$1</span>')
                                      .replace(/\b(ability to get along|genuine care|community spirit|shared identity|debt of gratitude|sense of shame|relating to others|patience|perseverance)\b/gi, 
                                        '<span class="text-pink-400 font-medium">$1</span>')
                                      .replace(/\b(Filipino|cultural|values|tradition|heritage)\b/gi, 
                                        '<span class="text-yellow-400 font-medium">$1</span>')
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        );
                      }
                    }
                    
                    return 'Your Filipino cultural strengths are being analyzed.';
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CTA Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-2xl blur-xl"></div>
          <div className="relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-2xl p-8 border border-blue-500/20">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">✨ Discover Your Personality</h2>
              <p className="text-gray-400 mb-6">
                What animal are you? Take the BPOC DISC assessment and find out!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/career-tools/games/disc-personality">
                  <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold px-8 py-6 text-lg">
                    Take DISC Assessment
                  </Button>
                </Link>
                <Link href={`/${username}`}>
                  <Button variant="outline" className="border-blue-400/30 text-blue-300 hover:bg-blue-500/10 px-8 py-6 text-lg">
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
          <p>Powered by <span className="text-blue-400 font-semibold">BPOC.IO</span> - Where BPO Careers Begin</p>
        </div>
      </div>
    </div>
  );
}

