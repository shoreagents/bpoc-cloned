import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    console.log('🚀 ===== APPLICATIONS API DEBUG START =====');
    console.log('🔍 Applications API called with userId:', userId);
    
    if (!userId) {
      console.log('❌ No userId provided');
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Test database connection first
    console.log('🔍 Testing database connection...');
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful');

    const client = await pool.connect();
    try {
      console.log('🔗 Database connected, executing query...');
      
      // First, let's check if the user has any applications from both tables
      console.log('🔍 Checking if user has applications...');
      let userAppsCheck, recruiterAppsCheck, totalApps = 0;
      
      try {
        userAppsCheck = await client.query(
          'SELECT COUNT(*) as count FROM applications WHERE user_id = $1',
          [userId]
        );
        console.log('✅ Applications table query successful');
      } catch (error) {
        console.warn('⚠️ Applications table query failed:', error);
        userAppsCheck = { rows: [{ count: 0 }] };
      }
      
      // Recruiter applications removed - table dropped
      recruiterAppsCheck = { rows: [{ count: 0 }] };
      
      totalApps = Number(userAppsCheck.rows[0]?.count || 0);
      console.log('📊 User applications count (processed):', userAppsCheck.rows[0]?.count);
      console.log('📊 Total applications count:', totalApps);

      // Let's also check what status values actually exist in the applications table
      console.log('🔍 Checking what status values exist in applications table...');
      let statusCheck;
      try {
        statusCheck = await client.query(
          'SELECT DISTINCT status FROM applications WHERE user_id = $1 ORDER BY status',
          [userId]
        );
        console.log('✅ Status check query successful');
        console.log('📊 Available status values:', statusCheck.rows.map(row => ({ status: row.status, type: typeof row.status })));
      } catch (error) {
        console.warn('⚠️ Status check query failed:', error);
        statusCheck = { rows: [] };
      }

      if (totalApps === 0) {
        console.log('📭 No applications found for user');
        return NextResponse.json({
          applications: [],
          total: 0,
          message: 'No applications found'
        });
      }

      // Fetch applications from both tables
      console.log('🔍 Executing applications queries...');
      
      // Fetch from applications table (processed jobs)
      let processedResult;
      try {
        processedResult = await client.query(
          `SELECT 
            a.id,
            a.job_id::int4 as "jobId",
            a.resume_id as "resumeId",
            a.resume_slug as "resumeSlug",
            a.status as "applicationStatus",
            a.created_at as "appliedDate",
            'processed' as "jobType"
           FROM applications a
           WHERE a.user_id = $1
           ORDER BY a.created_at DESC`,
          [userId]
        );
        console.log('✅ Processed applications query successful');
      } catch (error) {
        console.warn('⚠️ Processed applications query failed:', error);
        processedResult = { rows: [] };
      }
      
      // Fetch from recruiter_applications table (recruiter jobs)
      let recruiterResult;
      // Recruiter applications removed - table dropped
      recruiterResult = { rows: [] };
      
      // Combine results (only processed now)
      const simpleResult = {
        rows: [...processedResult.rows]
      };
      
      console.log('📋 Processed applications query executed, rows returned:', processedResult.rows.length);
      console.log('📋 Total applications query result:', JSON.stringify(simpleResult.rows, null, 2));
      console.log('🔍 Raw status values from database:', simpleResult.rows.map(row => ({ id: row.id, status: row.applicationStatus, statusType: typeof row.applicationStatus, jobType: row.jobType })));

      // Now let's try to get job details separately
      if (simpleResult.rows.length > 0) {
        console.log('🔍 Fetching job details...');
        
        // Separate processed job IDs (recruiter jobs removed)
        const processedJobIds = simpleResult.rows.filter(row => row.jobType === 'processed').map(row => row.jobId);
        const recruiterJobIds: string[] = []; // Recruiter jobs removed
        
        console.log('📋 Processed Job IDs to fetch:', processedJobIds);
        console.log('📋 All application rows:', simpleResult.rows.map(row => ({ 
          id: row.id, 
          jobId: row.jobId, 
          jobIdType: typeof row.jobId, 
          jobType: row.jobType 
        })));

        let processedJobsResult: { rows: any[] } = { rows: [] };
        let recruiterJobsResult: { rows: any[] } = { rows: [] };

        // Fetch jobs from job_requests
        if (processedJobIds.length > 0) {
          console.log('🔍 Fetching jobs for IDs:', processedJobIds);
          try {
            processedJobsResult = await client.query(
              `SELECT 
                p.id,
                p.job_title,
                p.job_description,
                p.requirements,
                p.benefits,
                p.skills,
                p.salary_min,
                p.salary_max,
                p.currency,
                p.salary_type,
                p.work_arrangement,
                p.experience_level,
                p.industry,
                p.department,
                p.application_deadline,
                'ShoreAgents' as company_name,
                (SELECT COUNT(*) FROM applications WHERE job_id = p.id) as candidate_count
               FROM job_requests p
               WHERE p.id = ANY($1)`,
              [processedJobIds]
            );
            console.log('✅ Jobs query successful');
            console.log('🔍 Jobs found:', processedJobsResult.rows.length);
          } catch (error) {
            console.warn('⚠️ Jobs query failed:', error);
            processedJobsResult = { rows: [] };
          }
        }

         // Recruiter jobs removed - table dropped
         recruiterJobsResult = { rows: [] };

        // Combine job results and add source information
        const jobsResult: { rows: any[] } = {
          rows: [
            ...processedJobsResult.rows.map((job: any) => ({ ...job, source: 'job_request' })),
            ...recruiterJobsResult.rows.map((job: any) => ({ ...job, source: 'recruiter' }))
          ]
        };
        
        console.log('📋 Processed jobs query executed, rows returned:', processedJobsResult.rows.length);
        console.log('📋 Recruiter jobs query executed, rows returned:', recruiterJobsResult.rows.length);
        console.log('📋 Total jobs query result:', JSON.stringify(jobsResult.rows, null, 2));

        // Create a map of job details
        const jobDetailsMap = new Map();
        jobsResult.rows.forEach(job => {
          console.log('🔍 Adding job to map:', { 
            id: job.id, 
            idType: typeof job.id, 
            title: job.job_title, 
            company: job.company_name,
            source: job.source || 'unknown'
          });
          // Store with both integer and string keys to handle type mismatches
          jobDetailsMap.set(job.id, job);
          jobDetailsMap.set(String(job.id), job);
          jobDetailsMap.set(Number(job.id), job);
        });
        
        console.log('🔍 Job details map created with', jobDetailsMap.size, 'entries');
        console.log('🔍 Map keys:', Array.from(jobDetailsMap.keys()));
        console.log('🔍 Available jobs:', jobsResult.rows.map(j => ({ id: j.id, title: j.job_title, company: j.company_name })));
        console.log('🔍 Application job IDs:', simpleResult.rows.map(r => ({ jobId: r.jobId, jobIdType: typeof r.jobId, jobType: r.jobType })));
        
        // Debug what's in the jobsResult for recruiter jobs specifically
        const recruiterJobsInResult = jobsResult.rows.filter(j => j.source === 'recruiter');
        console.log('🔍 Recruiter jobs in jobsResult:', recruiterJobsInResult.length);
        console.log('🔍 Recruiter jobs details:', recruiterJobsInResult.map(j => ({
          id: j.id,
          title: j.job_title,
          company: j.company_name,
          source: j.source
        })));
        
        console.log('🔍 Job details map created with keys:', Array.from(jobDetailsMap.keys()));
        console.log('🔍 Job details map size:', jobDetailsMap.size);
        console.log('🔍 All job details in map:', Array.from(jobDetailsMap.values()).map(job => ({
          id: job.id,
          title: job.job_title,
          company: job.company_name
        })));

        // Combine application data with job details
        const applications = await Promise.all(simpleResult.rows.map(async (appRow) => {
          // Skip recruiter jobs - table has been removed
          if (appRow.jobType === 'recruiter') {
            console.log('⚠️ Skipping recruiter job application (table removed):', appRow.jobId);
            return null;
          }

          // Try multiple approaches to find job details
          let jobDetails = jobDetailsMap.get(appRow.jobId) || 
                          jobDetailsMap.get(String(appRow.jobId)) || 
                          jobDetailsMap.get(Number(appRow.jobId));
          
          console.log('🔍 Processing application row:', {
            id: appRow.id,
            jobId: appRow.jobId,
            jobIdType: typeof appRow.jobId,
            status: appRow.applicationStatus,
            statusType: typeof appRow.applicationStatus,
            jobDetails: jobDetails,
            jobDetailsFound: !!jobDetails,
            rawRow: appRow
          });
          
          // Debug job details map
          console.log('🔍 Job details map keys:', Array.from(jobDetailsMap.keys()));
          console.log('🔍 Looking for jobId:', appRow.jobId, 'in map:', jobDetailsMap.has(appRow.jobId));
          console.log('🔍 Looking for jobId as string:', String(appRow.jobId), 'in map:', jobDetailsMap.has(String(appRow.jobId)));
          console.log('🔍 Looking for jobId as number:', Number(appRow.jobId), 'in map:', jobDetailsMap.has(Number(appRow.jobId)));
          
          // If job details not found, try to fetch them directly
          let finalJobDetails = jobDetails;
          if (!jobDetails) {
            console.warn('⚠️ Job details not found for jobId:', appRow.jobId, 'jobType:', appRow.jobType);
            
            // Don't create fallback data - let the direct queries handle it
            
            // Try to fetch job details directly based on job type
            try {
              if (appRow.jobType === 'processed') {
                console.log('🔍 Attempting direct query for job:', appRow.jobId);
                
                // Try multiple approaches for jobs
                let directResult = await client.query(
                  `SELECT p.*, 
                          'ShoreAgents' as company_name
                   FROM job_requests p
                   WHERE p.id = $1`,
                  [appRow.jobId]
                );
                
                // If not found, try with string conversion
                if (directResult.rows.length === 0) {
                  console.log('🔍 Trying with string conversion for job');
                  directResult = await client.query(
                    `SELECT p.*, 
                            'ShoreAgents' as company_name
                     FROM job_requests p
                     WHERE p.id::text = $1`,
                    [String(appRow.jobId)]
                  );
                }
                
                // If still not found, try with integer conversion
                if (directResult.rows.length === 0) {
                  console.log('🔍 Trying with integer conversion for processed job');
                  directResult = await client.query(
                    `SELECT p.*, 
                            'ShoreAgents' as company_name
                     FROM job_requests p
                     WHERE p.id = $1`,
                    [parseInt(appRow.jobId)]
                  );
                }
                
                console.log('🔍 Direct job query result:', directResult.rows.length, 'rows');
                if (directResult.rows.length > 0) {
                  finalJobDetails = directResult.rows[0];
                  console.log('✅ Found job details via direct query:', finalJobDetails.job_title);
                } else {
                  console.warn('⚠️ No job found with ID:', appRow.jobId);
                  // Check what IDs actually exist
                  const allJobs = await client.query('SELECT id, job_title FROM job_requests LIMIT 5');
                  console.log('📊 Available job IDs:', allJobs.rows.map(j => ({ id: j.id, title: j.job_title })));
                }
              }
            } catch (error) {
              console.warn('⚠️ Direct job details query failed:', error);
            }
          }
          
          // Format salary
          let salary = '';
          if (finalJobDetails?.salary_min || finalJobDetails?.salary_max) {
            const currency = finalJobDetails.currency || '₱';
            const min = finalJobDetails.salary_min ? Number(finalJobDetails.salary_min) : 0;
            const max = finalJobDetails.salary_max ? Number(finalJobDetails.salary_max) : min;
            const type = finalJobDetails.salary_type || 'monthly';
            
            if (min === max) {
              salary = `${currency}${min.toLocaleString()} / ${type}`;
            } else {
              salary = `${currency}${min.toLocaleString()} - ${currency}${max.toLocaleString()} / ${type}`;
            }
          }

          // Format requirements and benefits
          const requirements = Array.isArray(finalJobDetails?.requirements) ? finalJobDetails.requirements : [];
          const benefits = Array.isArray(finalJobDetails?.benefits) ? finalJobDetails.benefits : [];
          const skills = Array.isArray(finalJobDetails?.skills) ? finalJobDetails.skills : [];

          // Map the application status to the frontend status format
          const getFrontendStatus = (dbStatus: string) => {
            console.log('🔍 getFrontendStatus called with:', dbStatus, 'type:', typeof dbStatus);
            // Return the exact database status for more granular display
            return dbStatus;
          };

          const finalStatus = getFrontendStatus(appRow.applicationStatus);
          console.log('🔍 Final status for application:', appRow.id, ':', finalStatus);

          // Final fallback for job title and company
          let finalJobTitle = finalJobDetails?.job_title;
          let finalCompanyName = finalJobDetails?.company_name;
          
          console.log('🔍 Final job details before fallback:', {
            jobTitle: finalJobTitle,
            companyName: finalCompanyName,
            jobType: appRow.jobType,
            hasJobDetails: !!finalJobDetails,
            jobId: appRow.jobId,
            jobIdType: typeof appRow.jobId,
            finalJobDetailsKeys: finalJobDetails ? Object.keys(finalJobDetails) : 'none',
            finalJobDetailsValues: finalJobDetails ? {
              id: finalJobDetails.id,
              job_title: finalJobDetails.job_title,
              company_name: finalJobDetails.company_name
            } : 'none'
          });
          
          if (!finalJobTitle) {
            console.warn('⚠️ No job title found for jobId:', appRow.jobId, 'jobType:', appRow.jobType);
            console.warn('⚠️ Job details found:', !!finalJobDetails);
            console.warn('⚠️ Available job details keys:', finalJobDetails ? Object.keys(finalJobDetails) : 'none');
            
            // Try to get job title from the job details if available
            if (finalJobDetails?.job_title) {
              finalJobTitle = finalJobDetails.job_title;
              console.log('✅ Found job title in finalJobDetails:', finalJobTitle);
            } else {
              finalJobTitle = appRow.jobType === 'processed' ? 'ShoreAgents Position' : 'Recruiter Position';
              console.warn('⚠️ Using fallback job title:', finalJobTitle);
            }
          }
          
          if (!finalCompanyName) {
            console.warn('⚠️ No company name found for jobId:', appRow.jobId);
            console.warn('⚠️ Available company fields:', finalJobDetails ? {
              company_name: finalJobDetails.company_name,
              company_table_name: finalJobDetails.company_table_name,
              recruiter_name: finalJobDetails.recruiter_name
            } : 'none');
            
            // For processed jobs, always use ShoreAgents
            // For recruiter jobs, try to get the actual company name
            if (appRow.jobType === 'processed') {
              finalCompanyName = 'ShoreAgents';
              console.log('✅ Using ShoreAgents for processed job');
            } else {
              // Try to get company name from finalJobDetails if available
              if (finalJobDetails?.company_name) {
                finalCompanyName = finalJobDetails.company_name;
                console.log('✅ Using company_name:', finalCompanyName);
              } else if (finalJobDetails?.company_table_name) {
                finalCompanyName = finalJobDetails.company_table_name;
                console.log('✅ Using company table name:', finalCompanyName);
              } else if (finalJobDetails?.recruiter_name) {
                finalCompanyName = `${finalJobDetails.recruiter_name}'s Company`;
                console.log('✅ Using recruiter-based company name:', finalCompanyName);
              } else {
                finalCompanyName = 'Recruiter Company';
                console.warn('⚠️ Using fallback company name:', finalCompanyName);
              }
            }
          }
          
          console.log('🔍 Final values after fallback:', {
            finalJobTitle,
            finalCompanyName,
            jobType: appRow.jobType,
            hasJobDetails: !!finalJobDetails
          });

          // Additional validation to ensure we have meaningful data
          if (finalJobTitle === 'Job Position' || finalJobTitle === 'ShoreAgents Position') {
            console.warn('⚠️ Using generic job title fallback for application:', appRow.id);
          }
          if (appRow.jobType === 'processed' && finalCompanyName !== 'ShoreAgents') {
            console.warn('⚠️ Processed job should show ShoreAgents as company name for application:', appRow.id);
          }
          if (appRow.jobType === 'recruiter' && (finalCompanyName === 'Company' || finalCompanyName === 'ShoreAgents')) {
            console.warn('⚠️ Using generic company name fallback for recruiter job application:', appRow.id);
          }

          return {
            id: appRow.id,
            jobId: appRow.jobId,
            resumeId: appRow.resumeId,
            resumeSlug: appRow.resumeSlug,
            jobTitle: finalJobTitle,
            companyName: finalCompanyName,
            location: finalJobDetails?.recruiter_location || 'Location not specified',
            salary,
            status: finalStatus,
            appliedDate: appRow.appliedDate,
            lastUpdated: appRow.appliedDate,
            jobDescription: finalJobDetails?.job_description || 'No description available',
            requirements: Array.isArray(finalJobDetails?.requirements) ? finalJobDetails.requirements.flatMap((item: any) => 
              typeof item === 'string' ? item.split('\n\n').filter((s: string) => s.trim()) : [item]
            ) : [],
            benefits: Array.isArray(finalJobDetails?.benefits) ? finalJobDetails.benefits.flatMap((item: any) => 
              typeof item === 'string' ? item.split('\n\n').filter((s: string) => s.trim()) : [item]
            ) : [],
            skills: finalJobDetails?.skills || [],
            workArrangement: finalJobDetails?.work_arrangement,
            experienceLevel: finalJobDetails?.experience_level,
            industry: finalJobDetails?.industry,
            department: finalJobDetails?.department,
            applicationDeadline: finalJobDetails?.application_deadline,
            candidateCount: finalJobDetails?.candidate_count || 0
          };
        }));

        // Filter out null values (recruiter jobs that were skipped)
        const filteredApplications = applications.filter((app): app is NonNullable<typeof app> => app !== null);

        console.log('✅ Processed applications:', filteredApplications.length);
        console.log('✅ Sample processed application:', filteredApplications[0]);
        console.log('🚀 ===== APPLICATIONS API DEBUG END =====');

        return NextResponse.json({
          applications: filteredApplications,
          total: filteredApplications.length,
          message: 'Applications retrieved successfully'
        });
      }

      return NextResponse.json({
        applications: [],
        total: 0,
        message: 'No applications found'
      });

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error in applications API:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to fetch applications', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, jobId, resumeId, resumeSlug } = body;

    if (!userId || !jobId || !resumeId || !resumeSlug) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, jobId, resumeId, resumeSlug' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // Check if user already applied to this job
      const existingApp = await client.query(
        'SELECT id FROM applications WHERE user_id = $1 AND job_id = $2',
        [userId, jobId]
      );

      if (existingApp.rows.length > 0) {
        return NextResponse.json(
          { error: 'You have already applied to this job' },
          { status: 400 }
        );
      }

      // Insert new application into the applications table
      const result = await client.query(
        `INSERT INTO applications (
          user_id, job_id, resume_id, resume_slug, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW()) 
        RETURNING *`,
        [
          userId, 
          jobId, 
          resumeId, 
          resumeSlug, 
          'submitted' // Default status
        ]
      );

      const newApplication = result.rows[0];

              return NextResponse.json({
          application: {
            id: newApplication.id,
            jobId: newApplication.job_id,
            resumeId: newApplication.resume_id,
            resumeSlug: newApplication.resume_slug,
            status: 'submitted', // Frontend status - matches database enum
            appliedDate: newApplication.created_at
          },
          message: 'Application submitted successfully'
        }, { status: 201 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json(
      { error: 'Failed to create application' },
      { status: 500 }
    );
  }
}
