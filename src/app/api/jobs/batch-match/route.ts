import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { userId, jobIds } = await request.json();

    if (!userId || !jobIds?.length) {
      return NextResponse.json({ error: 'userId and jobIds are required' }, { status: 400 });
    }

    console.log('🔍 Batch match request:', { userId, jobIds });

    const client = await pool.connect();
    try {
      console.log('🔍 About to query user data for userId:', userId);
      // Get user data once
      const userResult = await client.query(`
        SELECT 
          u.id, u.full_name, u.location, u.position, u.bio,
          u.location_place_id, u.location_lat, u.location_lng, u.location_city, u.location_province, u.location_barangay, u.location_region,
          sr.resume_data,
          aar.skills_snapshot, aar.experience_snapshot, aar.education_snapshot,
          uws.current_employer, uws.current_position, uws.current_salary, uws.expected_salary, uws.work_status, uws.preferred_shift, uws.work_setup
        FROM users u
        LEFT JOIN saved_resumes sr ON u.id = sr.user_id
        LEFT JOIN ai_analysis_results aar ON u.id = aar.user_id
        LEFT JOIN user_work_status uws ON u.id = uws.user_id
        WHERE u.id = $1
      `, [userId]);

      if (userResult.rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const user = userResult.rows[0];

      // Separate job IDs by type (processed jobs are integers, recruiter jobs are UUIDs)
      // Frontend sends IDs like "recruiter_<uuid>", "processed_<id>", or "job_request_<id>"
      // We need to extract the actual IDs for database queries
      const processedJobIds: string[] = [];
      const recruiterJobIds: string[] = [];
      const jobRequestIds: string[] = [];
      
      jobIds.forEach((id: string) => {
        if (id.startsWith('recruiter_')) {
          recruiterJobIds.push(id.replace('recruiter_', ''));
        } else if (id.startsWith('processed_')) {
          processedJobIds.push(id.replace('processed_', ''));
        } else if (id.startsWith('job_request_')) {
          jobRequestIds.push(id.replace('job_request_', ''));
        } else if (id.includes('-') || isNaN(Number(id))) {
          // UUID format (recruiter job without prefix)
          recruiterJobIds.push(id);
        } else {
          // Numeric ID (processed or job_request without prefix)
          processedJobIds.push(id);
          jobRequestIds.push(id);
        }
      });
      
      const numericJobIds = [...new Set([...processedJobIds, ...jobRequestIds])];
      
      console.log('🔍 Separated job IDs:', { numericJobIds, recruiterJobIds, jobRequestIds });

      // Get all jobs from all three sources
      let jobRequestsResult, processedJobsResult, recruiterJobsResult;
      
      // Check job_requests table (admin jobs)
      if (numericJobIds.length > 0) {
        try {
          jobRequestsResult = await client.query(`
            SELECT 
              jr.id, jr.job_title, jr.job_description, 
              COALESCE(jr.requirements, ARRAY[]::text[]) as requirements, 
              COALESCE(jr.responsibilities, ARRAY[]::text[]) as responsibilities, 
              COALESCE(jr.benefits, ARRAY[]::text[]) as benefits, 
              COALESCE(jr.skills, ARRAY[]::text[]) as skills, 
              jr.experience_level,
              jr.industry, jr.department, jr.work_arrangement, jr.salary_min, jr.salary_max,
              m.company as company_name, 'job_requests' as source
            FROM job_requests jr
            LEFT JOIN members m ON jr.company_id = m.company_id
            WHERE jr.id = ANY($1) AND jr.status IN ('active', 'processed')
          `, [jobRequestIds]);
        } catch (error) {
          console.error('Error fetching job_requests:', error);
          jobRequestsResult = { rows: [] };
        }
      } else {
        jobRequestsResult = { rows: [] };
      }

      // Processed jobs are now in job_requests, so skip this section
          processedJobsResult = { rows: [] };

      // Check recruiter_jobs table
      if (recruiterJobIds.length > 0) {
        try {
          recruiterJobsResult = await client.query(`
            SELECT 
              rj.id, rj.job_title, rj.job_description, 
              COALESCE(rj.requirements, ARRAY[]::text[]) as requirements, 
              COALESCE(rj.responsibilities, ARRAY[]::text[]) as responsibilities, 
              COALESCE(rj.benefits, ARRAY[]::text[]) as benefits, 
              COALESCE(rj.skills, ARRAY[]::text[]) as skills, 
              rj.experience_level,
              rj.industry, rj.department, rj.work_arrangement, rj.salary_min, rj.salary_max,
              COALESCE(rj.company_id::text, u.company) as company_name, 'recruiter_jobs' as source
            FROM recruiter_jobs rj
            LEFT JOIN users u ON u.id = rj.recruiter_id
            WHERE rj.id = ANY($1) AND rj.status = 'active'
          `, [recruiterJobIds]);
        } catch (error) {
          console.error('Error fetching recruiter jobs:', error);
          recruiterJobsResult = { rows: [] };
        }
      } else {
        recruiterJobsResult = { rows: [] };
      }

      // Combine results from all three sources
      // Map the database IDs back to the frontend format for proper matching
      const jobs = [
        ...jobRequestsResult.rows.map((row: any) => ({ ...row, frontendId: `job_request_${row.id}` })),
        ...processedJobsResult.rows.map((row: any) => ({ ...row, frontendId: `processed_${row.id}` })),
        ...recruiterJobsResult.rows.map((row: any) => ({ ...row, frontendId: `recruiter_${row.id}` }))
      ];
      
      console.log('🔍 Batch match - Found jobs:', jobs.length);
      console.log('🔍 Batch match - Job sources:', jobs.map(j => ({ id: j.id, frontendId: j.frontendId, source: j.source, title: j.job_title })));
      
      if (jobs.length === 0) {
        console.warn('⚠️ No jobs found for batch match. Requested job IDs:', jobIds);
        console.warn('⚠️ Searched in: job_requests, recruiter_jobs');
        return NextResponse.json({ 
          results: {},
          cached: 0,
          analyzed: 0,
          error: 'No jobs found',
          message: `None of the requested ${jobIds.length} job IDs were found in any job table`
        });
      }
      
      // Log any missing jobs (check against frontend IDs)
      const foundFrontendIds = new Set(jobs.map(j => j.frontendId));
      const missingJobIds = jobIds.filter(id => !foundFrontendIds.has(id));
      if (missingJobIds.length > 0) {
        console.warn(`⚠️ ${missingJobIds.length} job(s) not found:`, missingJobIds);
      }

      // Check cache for all jobs at once (24 hours cache)
      // Use the actual database IDs (not frontend IDs) for cache lookup
      const allDbIds = [
        ...jobRequestIds,
        ...processedJobIds,
        ...recruiterJobIds
      ];
      
      // Only cache successful results (score is not null and not 0 - 0 might indicate a failed analysis)
      const cachedResults = allDbIds.length > 0 ? await client.query(`
        SELECT job_id, score, reasoning, breakdown, analyzed_at
        FROM job_match_results
        WHERE user_id = $1 AND job_id = ANY($2)
        AND analyzed_at > NOW() - INTERVAL '24 hours'
        AND score IS NOT NULL
        AND score > 0
      `, [userId, allDbIds]) : { rows: [] };

      const cachedMap = new Map();
      cachedResults.rows.forEach(row => {
        // Only cache results with valid scores (not null, not undefined, and > 0)
        // Score 0 might indicate a failed analysis, so we'll re-analyze
        if (row.score !== null && row.score !== undefined && row.score > 0) {
          // Map database job_id to frontend ID format for matching
          const dbJobId = String(row.job_id);
          // Find which job this corresponds to (match by database ID)
          // Normalize UUIDs for comparison (recruiter jobs use UUIDs)
          const job = jobs.find(j => {
            const jobIdStr = String(j.id).toLowerCase().trim();
            const dbJobIdStr = dbJobId.toLowerCase().trim();
            return jobIdStr === dbJobIdStr;
          });
          if (job) {
            // Use frontendId as the key for internal cache map
            cachedMap.set(job.frontendId, {
              score: row.score,
              reasoning: row.reasoning,
              breakdown: typeof row.breakdown === 'string' ? JSON.parse(row.breakdown) : row.breakdown
            });
            console.log(`📦 Cached: dbId=${dbJobId}, frontendId=${job.frontendId}, source=${job.source}, score=${row.score}%`);
          } else {
            console.warn(`⚠️ Cached result found for job_id ${dbJobId} but job not found in current job list`);
            console.warn(`⚠️ Available job IDs:`, jobs.map(j => ({ id: String(j.id), frontendId: j.frontendId, source: j.source })));
          }
        }
      });

      console.log(`📦 Cache check: Found ${cachedMap.size} cached results out of ${jobs.length} jobs`);
      if (cachedMap.size > 0) {
        console.log('📦 Cached job IDs:', Array.from(cachedMap.keys()));
      }

      // Process only non-cached jobs (use frontendId for matching)
      const uncachedJobs = jobs.filter(job => !cachedMap.has(job.frontendId));
      console.log(`🔄 Will analyze ${uncachedJobs.length} uncached jobs`);
      const results: Record<string, any> = {};

      // Add cached results (use originalId for matching with frontend)
      cachedMap.forEach((value, frontendId) => {
        // Find the job to get its originalId (database ID)
        const job = jobs.find(j => j.frontendId === frontendId);
        if (job) {
          // Use originalId (database ID) as the key to match frontend expectations
          const resultKey = String(job.id);
          results[resultKey] = { ...value, cached: true, error: false };
          console.log(`✅ Using cached result for job ${frontendId} (db: ${job.id}, source: ${job.source}): ${value.score}%`);
        } else {
          console.warn(`⚠️ Cached result found for frontendId ${frontendId} but job not found in current job list`);
        }
      });

      // Process uncached jobs in parallel with rate limiting
      // Process in batches to avoid hitting API rate limits
      if (uncachedJobs.length > 0) {
        console.log(`Processing ${uncachedJobs.length} uncached jobs in batches of 5`);
        console.log(`📋 Uncached jobs breakdown:`, {
          recruiter: uncachedJobs.filter(j => j.source === 'recruiter_jobs').length,
          processed: 0, // processed_job_requests table removed
          job_requests: uncachedJobs.filter(j => j.source === 'job_requests').length
        });
        
        // Process jobs in batches of 5 to avoid rate limits
        const batchSize = 5;
        const batches = [];
        for (let i = 0; i < uncachedJobs.length; i += batchSize) {
          batches.push(uncachedJobs.slice(i, i + batchSize));
        }
        
        const allAnalysisResults = [];
        
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
          const batch = batches[batchIndex];
          console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} jobs)`);
          
          const analysisPromises = batch.map(async (job) => {
          // Calculate distance from user to office (Clark, Pampanga)
          const officeLat = 15.175949880147643;
          const officeLng = 120.53233701473826;
          let distanceKm = null;
          let distanceDescription = 'Location not available';
          
          if (user.location_lat && user.location_lng) {
            distanceKm = calculateDistance(user.location_lat, user.location_lng, officeLat, officeLng);
            if (distanceKm <= 5) {
              distanceDescription = 'Very close to office (< 5km)';
            } else if (distanceKm <= 15) {
              distanceDescription = 'Close to office (5-15km)';
            } else if (distanceKm <= 30) {
              distanceDescription = 'Moderate distance (15-30km)';
            } else if (distanceKm <= 50) {
              distanceDescription = 'Far from office (30-50km)';
            } else {
              distanceDescription = 'Very far from office (> 50km)';
            }
          }

          // Prepare data for Anthropic analysis
          const analysisData = {
            user: {
              name: user.full_name,
              location: user.location,
              locationDetails: {
                city: user.location_city,
                province: user.location_province,
                barangay: user.location_barangay,
                region: user.location_region,
                distanceKm: distanceKm,
                distanceDescription: distanceDescription
              },
              currentPosition: user.position,
              bio: user.bio,
              resumeData: user.resume_data,
              skills: user.skills_snapshot || [],
              experience: user.experience_snapshot || [],
              education: user.education_snapshot || [],
              workStatus: {
                currentEmployer: user.current_employer,
                currentPosition: user.current_position,
                currentSalary: user.current_salary,
                expectedSalary: user.expected_salary,
                workStatus: user.work_status,
                preferredShift: user.preferred_shift,
                workSetup: user.work_setup
              }
            },
            job: {
              title: job.job_title,
              description: job.job_description,
              requirements: (() => {
                if (Array.isArray(job.requirements)) return job.requirements;
                if (typeof job.requirements === 'string') {
                  try { return JSON.parse(job.requirements); } catch { return []; }
                }
                return job.requirements || [];
              })(),
              responsibilities: (() => {
                if (Array.isArray(job.responsibilities)) return job.responsibilities;
                if (typeof job.responsibilities === 'string') {
                  try { return JSON.parse(job.responsibilities); } catch { return []; }
                }
                return job.responsibilities || [];
              })(),
              benefits: (() => {
                if (Array.isArray(job.benefits)) return job.benefits;
                if (typeof job.benefits === 'string') {
                  try { return JSON.parse(job.benefits); } catch { return []; }
                }
                return job.benefits || [];
              })(),
              skills: (() => {
                if (Array.isArray(job.skills)) return job.skills;
                if (typeof job.skills === 'string') {
                  try { return JSON.parse(job.skills); } catch { return []; }
                }
                return job.skills || [];
              })(),
              experienceLevel: job.experience_level,
              industry: job.industry,
              department: job.department,
              workArrangement: job.work_arrangement,
              salaryRange: `${job.salary_min || 0} - ${job.salary_max || 0}`,
              company: job.company_name
            }
          };

          try {
            return await analyzeJobMatchWithAI(analysisData).then(matchScore => {
              // If there's an error or score is null, preserve null (don't convert to 0)
              const finalScore = (matchScore.error || matchScore.score === null || matchScore.score === undefined) 
                ? null 
                : Math.round(matchScore.score);
              
              return {
                jobId: job.id,
                score: finalScore,
                reasoning: matchScore.reasoning ?? '',
                breakdown: matchScore.breakdown ?? {},
                cached: false,
                error: matchScore.error || matchScore.failed || matchScore.score === null || false
              };
            }).catch(error => {
              console.error(`❌ Error analyzing job ${job.id} (${job.job_title}):`, error);
              console.error(`❌ Error details:`, {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                jobId: job.id,
                jobTitle: job.job_title
              });
              // Return error indicator for this specific job
              return {
                jobId: job.id,
                score: null,
                reasoning: `Failed to analyze: ${error instanceof Error ? error.message : 'Unknown error'}`,
                breakdown: {},
                cached: false,
                failed: true,
                error: true
              };
            });
          } catch (error) {
            console.error(`❌ Unexpected error processing job ${job.id}:`, error);
            return {
              jobId: job.id,
              score: null,
              reasoning: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
              breakdown: {},
              cached: false,
              failed: true,
              error: true
            };
          }
          });
          
          const batchResults = await Promise.all(analysisPromises);
          allAnalysisResults.push(...batchResults);
          
          // Add a small delay between batches to avoid rate limits (except for the last batch)
          if (batchIndex < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay between batches
          }
        }
        
        const analysisResults = allAnalysisResults;

        // Cache the new results (only cache successful analyses with score > 0)
        // Also clear any old error results (null scores or score 0) for these jobs
        for (const result of analysisResults) {
          if (result.score !== null && result.score > 0 && !(result as any).failed) {
            await client.query(`
              INSERT INTO job_match_results (user_id, job_id, score, reasoning, breakdown, analyzed_at)
              VALUES ($1, $2, $3, $4, $5, NOW())
              ON CONFLICT (user_id, job_id)
              DO UPDATE SET score = EXCLUDED.score, reasoning = EXCLUDED.reasoning, breakdown = EXCLUDED.breakdown, analyzed_at = NOW()
            `, [userId, result.jobId, result.score, result.reasoning, JSON.stringify(result.breakdown)]);
          } else {
            // Clear any old cached error results for this job (null scores or score 0)
            await client.query(`
              DELETE FROM job_match_results 
              WHERE user_id = $1 AND job_id = $2 AND (score IS NULL OR score = 0)
            `, [userId, result.jobId]).catch(err => {
              // Ignore errors when clearing old results
              console.warn('Failed to clear old error results:', err);
            });
          }

          // The frontend sends originalId (database ID) and expects results keyed by originalId
          // So we need to return results using the database ID (job.id), not frontendId
          // For recruiter jobs, job.id is a UUID, so we need to ensure proper string comparison
          const job = jobs.find(j => {
            const jobIdStr = String(j.id);
            const resultIdStr = String(result.jobId);
            // Normalize UUIDs for comparison (remove any whitespace, ensure lowercase)
            const normalizedJobId = jobIdStr.toLowerCase().trim();
            const normalizedResultId = resultIdStr.toLowerCase().trim();
            return normalizedJobId === normalizedResultId;
          });
          
          if (job) {
            // Return result keyed by database ID (originalId) to match frontend expectations
            // Use the job's actual ID (which is the originalId) as the key
            const resultKey = String(job.id);
            results[resultKey] = result;
            console.log(`✅ Mapped result for job: dbId=${job.id}, frontendId=${job.frontendId}, source=${job.source}, score=${result.score}, error=${result.error}`);
          } else {
            // Fallback: use the jobId directly
            console.warn(`⚠️ Could not find job for result.jobId=${result.jobId}, using jobId directly as key`);
            console.warn(`⚠️ Available job IDs:`, jobs.map(j => ({ id: j.id, frontendId: j.frontendId, source: j.source })));
            results[String(result.jobId)] = result;
          }
        }
      }

      return NextResponse.json({ 
        results,
        cached: cachedMap.size,
        analyzed: uncachedJobs.length,
        total: jobIds.length
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error in batch job matching:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorName = error instanceof Error ? error.name : 'Unknown';
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      name: errorName
    });
    return NextResponse.json({ 
      error: 'Failed to analyze job matches',
      details: errorMessage 
    }, { status: 500 });
  }
}

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Helper function to retry API calls with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Check if error is retryable (network errors, rate limits, timeouts)
      const isRetryable = 
        error.message?.includes('timeout') ||
        error.message?.includes('network') ||
        error.message?.includes('rate limit') ||
        error.message?.includes('429') ||
        error.message?.includes('503') ||
        error.message?.includes('502') ||
        error.message?.includes('504');
      
      if (!isRetryable || attempt === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`⚠️ Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms delay`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Reuse the existing analyzeJobMatchWithAI function
async function analyzeJobMatchWithAI(data: any) {
  try {
    // Check if API key is available
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      console.error('❌ CLAUDE_API_KEY not found in environment variables');
      console.error('🔧 Please set CLAUDE_API_KEY in your .env.local file or environment variables');
      console.error('📖 See AI_SETUP_GUIDE.md for detailed instructions');
      throw new Error('Claude API key not configured. Please set CLAUDE_API_KEY environment variable.');
    }

    // Clean and prepare data for analysis - handle different data types safely
    const cleanUserSkills = Array.isArray(data.user.skills) ? data.user.skills.filter((s: any) => s && typeof s === 'string' && s.trim()) : [];
    const cleanUserExperience = Array.isArray(data.user.experience) ? data.user.experience.filter((e: any) => e && typeof e === 'string' && e.trim()) : [];
    const cleanUserEducation = Array.isArray(data.user.education) ? data.user.education.filter((ed: any) => ed && typeof ed === 'string' && ed.trim()) : [];
    
    const cleanJobRequirements = Array.isArray(data.job.requirements) ? data.job.requirements.filter((r: any) => r && typeof r === 'string' && r.trim()) : [];
    const cleanJobResponsibilities = Array.isArray(data.job.responsibilities) ? data.job.responsibilities.filter((r: any) => r && typeof r === 'string' && r.trim()) : [];
    const cleanJobBenefits = Array.isArray(data.job.benefits) ? data.job.benefits.filter((b: any) => b && typeof b === 'string' && b.trim()) : [];
    const cleanJobSkills = Array.isArray(data.job.skills) ? data.job.skills.filter((s: any) => s && typeof s === 'string' && s.trim()) : [];

    const prompt = `You are an expert HR professional and career counselor. Analyze the match between a job candidate and a job posting.

CANDIDATE PROFILE:
- Name: ${data.user.name}
- Location: ${data.user.location} (${data.user.locationDetails?.distanceDescription || 'Location not available'})
- Current Position: ${data.user.currentPosition || 'Not specified'}
- Bio: ${data.user.bio || 'No bio provided'}
- Skills: ${cleanUserSkills.join(', ') || 'No skills listed'}
- Experience: ${cleanUserExperience.join(', ') || 'No experience listed'}
- Education: ${cleanUserEducation.join(', ') || 'No education listed'}
- Work Status: ${data.user.workStatus?.workStatus || 'Not specified'}
- Current Employer: ${data.user.workStatus?.currentEmployer || 'Not specified'}
- Expected Salary: ${data.user.workStatus?.expectedSalary || 'Not specified'}
- Preferred Shift: ${data.user.workStatus?.preferredShift || 'Not specified'}
- Work Setup Preference: ${data.user.workStatus?.workSetup || 'Not specified'}

JOB POSTING:
- Title: ${data.job.title}
- Company: ${data.job.company || 'Company not specified'}
- Description: ${data.job.description || 'No description provided'}
- Requirements: ${cleanJobRequirements.join(', ') || 'No requirements listed'}
- Responsibilities: ${cleanJobResponsibilities.join(', ') || 'No responsibilities listed'}
- Benefits: ${cleanJobBenefits.join(', ') || 'No benefits listed'}
- Required Skills: ${cleanJobSkills.join(', ') || 'No skills listed'}
- Experience Level: ${data.job.experienceLevel || 'Not specified'}
- Industry: ${data.job.industry || 'Not specified'}
- Department: ${data.job.department || 'Not specified'}
- Work Arrangement: ${data.job.workArrangement || 'Not specified'}
- Salary Range: ${data.job.salaryRange || 'Not specified'}

Analyze the compatibility between this candidate and job posting. Consider:

PRIMARY FACTORS (Critical):
- Skills Match: How well do the candidate's skills align with job requirements?
- Experience Match: Does the candidate's experience match the required level?
- Career Progression: Does this role advance the candidate's career?
- Salary Alignment: Is the salary range appropriate for the candidate's expectations?

SECONDARY FACTORS (Important):
- Work Setup Match: Does the work arrangement (remote/hybrid/onsite) align with preferences?
- Location Compatibility: How does the distance/commute factor in?
- Industry Alignment: Does the candidate's background fit the industry?

TERTIARY FACTORS (Nice-to-have):
- Shift Preference: Does the shift preference align?
- Cultural Fit: Based on the job description and company, would this be a good cultural fit?

Return your analysis as a JSON object with this exact structure:
{
  "reasoning": "• Strong match on technical skills - you have React, Node.js, and TypeScript experience which are exactly what they need\\n• Good experience level match - you have 3+ years of experience and they're looking for mid-level\\n• Perfect match on work setup - you want hybrid and they offer exactly that",
  "breakdown": {
    "skillsMatch": 90,
    "experienceMatch": 85,
    "careerMatch": 88,
    "salaryMatch": 85,
    "workSetupMatch": 90,
    "locationMatch": 80,
    "industryMatch": 75,
    "shiftMatch": 85,
    "culturalMatch": 85
  },
  "weightedScore": 86.1
}

The score should be 0-100 where:
- 95-100: Perfect match, highly recommended
- 85-94: Excellent match, strongly recommended  
- 75-84: Very good match, recommended
- 65-74: Good match, worth considering
- 55-64: Fair match, some concerns
- 45-54: Poor match, not recommended
- Below 45: Not suitable, avoid

IMPORTANT: Write the reasoning as conversational bullet points that speak directly to the candidate. Keep it friendly and encouraging while highlighting key strengths and any concerns. Use bullet points (•) and mention specific details like skills, distance, salary, and work preferences. Make it feel like you're giving personalized career advice.

SCORING GUIDELINES:
- 95-100: Perfect alignment across PRIMARY factors (skills, experience, career, salary) with strong secondary factors
- 85-94: Strong alignment in PRIMARY factors with minor concerns in secondary factors
- 75-84: Good alignment in PRIMARY factors but some areas in secondary/tertiary factors need improvement
- 65-74: Decent PRIMARY factor alignment but several secondary factors need attention
- 55-64: Fair PRIMARY factor alignment with significant concerns in secondary factors
- 45-54: Poor PRIMARY factor alignment with major issues across multiple factors
- Below 45: Major misalignment in PRIMARY factors - not suitable

**WEIGHTING PRIORITY:**
- PRIMARY factors (Skills, Experience, Career Progression, Salary) are CRITICAL - poor scores here significantly impact overall match
- SECONDARY factors (Work Setup, Location, Industry) are IMPORTANT but can be compensated by strong primary factors
- TERTIARY factors (Shift, Cultural) are NICE-TO-HAVE and have minimal impact on overall score

**APPLICATION THRESHOLD:** Only jobs with 65% or higher match scores should be recommended for application.

**IMPORTANT:** Always calculate the weighted score using the provided formula and use that as the final score.`;

    console.log('🔍 Calling Anthropic API for batch analysis');
    console.log('🔍 API Key available:', !!apiKey);
    console.log('🔍 API Key length:', apiKey ? apiKey.length : 0);
    console.log('🔍 User data summary:', {
      name: data.user.name,
      skills: data.user.skills?.length || 0,
      experience: data.user.experience?.length || 0,
      workStatus: data.user.workStatus?.workStatus,
      location: data.user.locationDetails?.distanceDescription
    });
    console.log('🔍 Job data summary:', {
      title: data.job.title,
      company: data.job.company,
      experienceLevel: data.job.experienceLevel,
      workArrangement: data.job.workArrangement,
      skills: data.job.skills?.length || 0
    });

    // Wrap the API call in retry logic for transient failures
    const response = await retryWithBackoff(async () => {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        const fetchResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            temperature: 0, // Set to 0 for deterministic, consistent results
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ]
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Check for rate limit errors
        if (fetchResponse.status === 429) {
          const retryAfter = fetchResponse.headers.get('retry-after');
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
          console.warn(`⚠️ Rate limit hit, waiting ${delay}ms before retry`);
          await new Promise(resolve => setTimeout(resolve, delay));
          throw new Error(`Rate limit: ${fetchResponse.status}`);
        }
        
        return fetchResponse;
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Request timeout after 30 seconds');
        }
        throw error;
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Anthropic API response received');
    console.log('Response structure:', { 
      hasContent: !!result.content, 
      contentLength: result.content?.length,
      firstContentType: result.content?.[0]?.type 
    });
    
    if (!result.content || !result.content[0] || !result.content[0].text) {
      console.error('Invalid API response structure:', JSON.stringify(result, null, 2));
      throw new Error('Invalid API response: missing content or text');
    }
    
    const content = result.content[0].text;
    console.log('AI response content length:', content.length);
    console.log('AI response preview (first 500 chars):', content.substring(0, 500));
    
    // Try to extract JSON from the response - check for code blocks first
    let jsonStr = '';
    let jsonMatch = null;
    
    // First, try to find JSON in markdown code blocks (```json ... ``` or ``` ... ```)
    const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1];
      console.log('Found JSON in code block');
    } else {
      // Try to find JSON object in the content
      jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
    }
    
    if (jsonStr) {
      try {
        // First, try parsing as-is (most responses should be valid JSON)
        let parsed = JSON.parse(jsonStr);
        console.log('✅ Successfully parsed JSON on first attempt');
        
        // Validate the response structure
        if (typeof parsed.score !== 'undefined') {
          parsed.weightedScore = parsed.score;
        }
        
        if (!parsed.weightedScore && parsed.breakdown) {
          // Calculate weighted score if not provided
          const weights = {
            skillsMatch: 0.25,
            experienceMatch: 0.20,
            careerMatch: 0.20,
            salaryMatch: 0.15,
            workSetupMatch: 0.10,
            locationMatch: 0.05,
            industryMatch: 0.03,
            shiftMatch: 0.01,
            culturalMatch: 0.01
          };
          
          let weightedSum = 0;
          let totalWeight = 0;
          
          for (const [key, value] of Object.entries(parsed.breakdown)) {
            if (weights[key as keyof typeof weights]) {
              weightedSum += (value as number) * weights[key as keyof typeof weights];
              totalWeight += weights[key as keyof typeof weights];
            }
          }
          
          parsed.weightedScore = totalWeight > 0 ? weightedSum / totalWeight : 75;
        }

        // Validate that we have a valid score
        const finalScore = parsed.weightedScore || parsed.score;
        if (typeof finalScore !== 'number' || isNaN(finalScore) || finalScore < 0 || finalScore > 100) {
          throw new Error(`Invalid score value: ${finalScore}`);
        }

        return {
          score: finalScore,
          reasoning: parsed.reasoning || 'Analysis completed',
          breakdown: parsed.breakdown || {}
        };
      } catch (parseError) {
        console.error('❌ JSON parsing error on first attempt:', parseError);
        console.error('Raw JSON string (first 1000 chars):', jsonStr.substring(0, 1000));
        
        // Try cleaning and parsing again
        try {
          // More conservative cleaning - only fix obvious issues
          let cleanedJson = jsonStr
            .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Remove only problematic control chars
            .replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
          
          const parsed = JSON.parse(cleanedJson);
          console.log('✅ Successfully parsed JSON after cleaning');
          
          const finalScore = parsed.weightedScore || parsed.score;
          if (typeof finalScore !== 'number' || isNaN(finalScore) || finalScore < 0 || finalScore > 100) {
            throw new Error(`Invalid score value: ${finalScore}`);
          }
          
          return {
            score: finalScore,
            reasoning: parsed.reasoning || 'Analysis completed',
            breakdown: parsed.breakdown || {}
          };
        } catch (secondParseError) {
          console.error('❌ JSON parsing error after cleaning:', secondParseError);
          console.error('Full content (first 2000 chars):', content.substring(0, 2000));
          
          // Try to extract a score from the content even if JSON parsing fails
          const scoreMatch = content.match(/(?:score|match|rating|weightedScore)[:\s]*(\d+)/i);
          const extractedScore = scoreMatch ? parseInt(scoreMatch[1]) : null;
          
          if (extractedScore !== null && extractedScore >= 0 && extractedScore <= 100) {
            console.log('⚠️ Extracted fallback score from content:', extractedScore);
            
            return {
              score: extractedScore,
              reasoning: 'Analysis completed with extracted scoring (JSON parsing failed)',
              breakdown: {}
            };
          } else {
            console.error('❌ No valid score found in content, marking as failed');
            console.error('Full AI response:', content);
            
            return {
              score: null,
              reasoning: `Failed to analyze - Unable to parse AI response. Error: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`,
              breakdown: {},
              failed: true,
              error: true
            };
          }
        }
      }
    } else {
      console.error('No JSON found in response');
      console.error('Raw content:', content);
      
      // Try to extract a score from the content even if no JSON is found
      const scoreMatch = content.match(/(?:score|match|rating)[:\s]*(\d+)/i);
      const extractedScore = scoreMatch ? parseInt(scoreMatch[1]) : null;
      
      if (extractedScore !== null) {
        console.log('Extracted fallback score from non-JSON content:', extractedScore);
        
        return {
          score: Math.min(100, Math.max(0, extractedScore)),
          reasoning: 'Analysis completed with extracted scoring (no JSON found)',
          breakdown: {
            skillsMatch: extractedScore,
            experienceMatch: extractedScore,
            careerMatch: extractedScore,
            salaryMatch: extractedScore,
            workSetupMatch: extractedScore,
            locationMatch: extractedScore,
            industryMatch: extractedScore,
            shiftMatch: extractedScore,
            culturalMatch: extractedScore
          }
        };
      } else {
        console.log('No score found in non-JSON content, marking as failed');
        
        return {
          score: null,
          reasoning: 'Failed to analyze - No valid response format found',
          breakdown: {},
          failed: true,
          error: true
        };
      }
    }
  } catch (error) {
    console.error('Error in analyzeJobMatchWithAI:', error);
    console.error('⚠️ AI analysis failed for job:', data.job.title);
    console.error('🔧 This is likely due to missing CLAUDE_API_KEY or API error - see AI_SETUP_GUIDE.md for setup instructions');
    
    // Throw the error so it can be caught and handled properly
    throw error;
  }
}

// Comprehensive fallback scoring function
function calculateComprehensiveFallbackScore(data: any) {
  let totalScore = 0;
  let maxScore = 0;
  const breakdown: { [key: string]: number } = {};
  
  // 1. Skills Match (25% weight)
  const skillsScore = calculateSkillsMatch(data.user.skills || [], data.job.skills || []);
  totalScore += skillsScore * 0.25;
  maxScore += 100 * 0.25;
  breakdown.skillsMatch = skillsScore;
  
  // 2. Experience Level Match (20% weight)
  const experienceScore = calculateExperienceMatch(data.user.workStatus?.workStatus, data.job.experienceLevel);
  totalScore += experienceScore * 0.20;
  maxScore += 100 * 0.20;
  breakdown.experienceMatch = experienceScore;
  
  // 3. Work Setup Match (15% weight)
  const workSetupScore = calculateWorkSetupMatch(data.user.workStatus?.workSetup, data.job.workArrangement);
  totalScore += workSetupScore * 0.15;
  maxScore += 100 * 0.15;
  breakdown.workSetupMatch = workSetupScore;
  
  // 4. Location Match (10% weight)
  const locationScore = calculateLocationMatch(data.user.locationDetails?.distanceKm);
  totalScore += locationScore * 0.10;
  maxScore += 100 * 0.10;
  breakdown.locationMatch = locationScore;
  
  // 5. Salary Match (10% weight)
  const salaryScore = calculateSalaryMatch(data.user.workStatus?.expectedSalary, data.job.salaryRange);
  totalScore += salaryScore * 0.10;
  maxScore += 100 * 0.10;
  breakdown.salaryMatch = salaryScore;
  
  // 6. Industry Match (10% weight)
  const industryScore = calculateIndustryMatch(data.user.experience || [], data.job.industry);
  totalScore += industryScore * 0.10;
  maxScore += 100 * 0.10;
  breakdown.industryMatch = industryScore;
  
  // 7. Shift Match (5% weight)
  const shiftScore = calculateShiftMatch(data.user.workStatus?.preferredShift, data.job.shift);
  totalScore += shiftScore * 0.05;
  maxScore += 100 * 0.05;
  breakdown.shiftMatch = shiftScore;
  
  // 8. Career Progression (5% weight)
  const careerScore = calculateCareerProgression(data.user.workStatus?.currentPosition, data.job.title);
  totalScore += careerScore * 0.05;
  maxScore += 100 * 0.05;
  breakdown.careerMatch = careerScore;
  
  // Calculate final weighted score
  const finalScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 50;
  
  // Ensure score is within reasonable bounds
  const clampedScore = Math.min(95, Math.max(25, finalScore));
  
  return {
    score: clampedScore,
    reasoning: generateFallbackReasoning(clampedScore, breakdown, data),
    breakdown: breakdown
  };
}

// Helper functions for individual scoring components
function calculateSkillsMatch(userSkills: string[], jobSkills: string[]): number {
  if (!userSkills.length || !jobSkills.length) return 50;
  
  const userSkillsLower = userSkills.map(s => s.toLowerCase().trim());
  const jobSkillsLower = jobSkills.map(s => s.toLowerCase().trim());
  
  let matches = 0;
  for (const jobSkill of jobSkillsLower) {
    if (userSkillsLower.some(userSkill => 
      userSkill.includes(jobSkill) || jobSkill.includes(userSkill)
    )) {
      matches++;
    }
  }
  
  return Math.round((matches / jobSkillsLower.length) * 100);
}

function calculateExperienceMatch(userStatus: string, jobLevel: string): number {
  if (!userStatus || !jobLevel) return 50;
  
  const status = userStatus.toLowerCase();
  const level = jobLevel.toLowerCase();
  
  if (level.includes('entry') && (status.includes('student') || status.includes('fresh'))) return 85;
  if (level.includes('entry') && status.includes('employed')) return 70;
  if (level.includes('mid') && status.includes('employed')) return 80;
  if (level.includes('senior') && status.includes('employed')) return 85;
  if (level.includes('senior') && status.includes('student')) return 30;
  
  return 60; // Default for unclear matches
}

function calculateWorkSetupMatch(userSetup: string, jobSetup: string): number {
  if (!userSetup || !jobSetup) return 50;
  
  const user = userSetup.toLowerCase();
  const job = jobSetup.toLowerCase();
  
  if (user === job) return 90;
  if ((user === 'hybrid' && job === 'remote') || (user === 'remote' && job === 'hybrid')) return 75;
  if ((user === 'onsite' && job === 'hybrid') || (user === 'hybrid' && job === 'onsite')) return 70;
  
  return 40; // Poor match
}

function calculateLocationMatch(distanceKm: number): number {
  if (!distanceKm) return 50;
  
  if (distanceKm <= 5) return 95;
  if (distanceKm <= 15) return 85;
  if (distanceKm <= 30) return 70;
  if (distanceKm <= 50) return 50;
  return 30;
}

function calculateSalaryMatch(expectedSalary: string, jobSalaryRange: string): number {
  if (!expectedSalary || !jobSalaryRange) return 50;
  
  const expected = parseFloat(expectedSalary.replace(/[^\d.]/g, ''));
  const rangeMatch = jobSalaryRange.match(/(\d+)[^\d]*(\d+)/);
  
  if (!expected || !rangeMatch) return 50;
  
  const minSalary = parseFloat(rangeMatch[1]);
  const maxSalary = parseFloat(rangeMatch[2]);
  
  if (expected >= minSalary && expected <= maxSalary) return 90;
  if (expected >= minSalary * 0.8 && expected <= maxSalary * 1.2) return 75;
  if (expected >= minSalary * 0.6 && expected <= maxSalary * 1.4) return 60;
  
  return 40;
}

function calculateIndustryMatch(userExperience: string[], jobIndustry: string): number {
  if (!userExperience.length || !jobIndustry) return 50;
  
  const experienceText = userExperience.join(' ').toLowerCase();
  const industry = jobIndustry.toLowerCase();
  
  if (experienceText.includes(industry)) return 85;
  
  // Check for related industries
  const relatedIndustries: { [key: string]: string[] } = {
    'technology': ['software', 'it', 'tech', 'digital', 'computer'],
    'healthcare': ['medical', 'health', 'hospital', 'clinic'],
    'finance': ['banking', 'financial', 'accounting', 'investment'],
    'retail': ['sales', 'commerce', 'ecommerce', 'shopping']
  };
  
  for (const [mainIndustry, related] of Object.entries(relatedIndustries)) {
    if (industry.includes(mainIndustry) && related.some(rel => experienceText.includes(rel))) {
      return 70;
    }
  }
  
  return 50;
}

function calculateShiftMatch(userShift: string, jobShift: string): number {
  if (!userShift || !jobShift) return 50;
  
  const user = userShift.toLowerCase();
  const job = jobShift.toLowerCase();
  
  if (user === job) return 90;
  return 40;
}

function calculateCareerProgression(currentPosition: string, jobTitle: string): number {
  if (!currentPosition || !jobTitle) return 50;
  
  const current = currentPosition.toLowerCase();
  const job = jobTitle.toLowerCase();
  
  // Check for career progression keywords
  const progressionKeywords = {
    'junior': ['senior', 'lead', 'manager', 'director'],
    'associate': ['senior', 'lead', 'manager', 'director'],
    'coordinator': ['manager', 'director', 'head'],
    'analyst': ['senior', 'lead', 'manager', 'director'],
    'developer': ['senior', 'lead', 'architect', 'manager']
  };
  
  for (const [currentLevel, nextLevels] of Object.entries(progressionKeywords)) {
    if (current.includes(currentLevel)) {
      if (nextLevels.some(level => job.includes(level))) return 85;
    }
  }
  
  return 60; // Neutral progression
}

function generateFallbackReasoning(score: number, breakdown: any, data: any): string {
  const reasons: string[] = [];
  
  if (breakdown.skillsMatch >= 80) {
    reasons.push('• Strong skills alignment with job requirements');
  } else if (breakdown.skillsMatch >= 60) {
    reasons.push('• Some skills match job requirements');
  } else {
    reasons.push('• Limited skills overlap with job requirements');
  }
  
  if (breakdown.experienceMatch >= 80) {
    reasons.push('• Experience level matches job expectations well');
  } else if (breakdown.experienceMatch >= 60) {
    reasons.push('• Experience level is somewhat compatible');
  } else {
    reasons.push('• Experience level may not align with job requirements');
  }
  
  if (breakdown.workSetupMatch >= 80) {
    reasons.push('• Work setup preferences align perfectly');
  } else if (breakdown.workSetupMatch >= 60) {
    reasons.push('• Work setup preferences are mostly compatible');
  } else {
    reasons.push('• Work setup preferences may not match');
  }
  
  if (breakdown.locationMatch >= 80) {
    reasons.push('• Location is very convenient for this role');
  } else if (breakdown.locationMatch >= 60) {
    reasons.push('• Location is reasonably accessible');
  } else {
    reasons.push('• Location may require significant commute');
  }
  
  if (score >= 80) {
    reasons.push('• Overall, this appears to be a strong match for your profile');
  } else if (score >= 65) {
    reasons.push('• This could be a good opportunity worth considering');
  } else if (score >= 50) {
    reasons.push('• This role has some potential but may not be ideal');
  } else {
    reasons.push('• This role may not be the best fit for your current profile');
  }
  
  // Add note about fallback analysis
  reasons.push('• Note: This analysis uses fallback scoring (AI analysis unavailable)');
  
  return reasons.join('\n');
}