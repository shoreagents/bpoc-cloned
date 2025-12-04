import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'
import { createClient } from '@supabase/supabase-js'
import { syncUserToDatabaseServer } from '@/lib/user-sync-server'

export async function GET(request: NextRequest) {
  try {
    // Fetch total users count from database
    const usersResult = await pool.query('SELECT COUNT(*) as count FROM users')
    let totalUsers = parseInt(usersResult.rows[0]?.count || '0')
    
    // Optional: Compare with Supabase Auth count for debugging
    // This helps identify if there's a user in Supabase Auth without a database row
    // NOTE: This runs asynchronously and non-blocking to not affect API response time
    // or impact other projects using this API
    if (process.env.ENABLE_USER_SYNC === 'true') {
      // Run sync asynchronously without blocking the API response
      setImmediate(async () => {
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
          const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
          
          if (supabaseUrl && supabaseServiceKey) {
            const supabase = createClient(supabaseUrl, supabaseServiceKey)
            const { data: { users }, error } = await supabase.auth.admin.listUsers()
            
            if (!error && users) {
              const supabaseAuthCount = users.length
              
              // Only proceed if there's a discrepancy (more than 1 user difference)
              if (Math.abs(supabaseAuthCount - totalUsers) > 1) {
                console.log(`⚠️ User count discrepancy detected: Database=${totalUsers}, Supabase Auth=${supabaseAuthCount}`)
                
                // Find users in Supabase Auth that don't have database rows
                const dbUserIds = await pool.query('SELECT id FROM users')
                const dbIds = new Set(dbUserIds.rows.map(row => row.id))
                const missingUsers = users.filter(authUser => !dbIds.has(authUser.id))
                
                // Limit sync to prevent overwhelming the database
                const usersToSync = missingUsers.slice(0, 10)
                
                if (usersToSync.length > 0) {
                  console.log(`⚠️ Found ${missingUsers.length} user(s) in Supabase Auth without database rows. Syncing ${usersToSync.length} now.`)
                  
                  let syncedCount = 0
                  for (const missingUser of usersToSync) {
                    try {
                      const firstName = missingUser.user_metadata?.first_name || 
                                       missingUser.user_metadata?.given_name || 
                                       missingUser.user_metadata?.name?.split(' ')[0] || 
                                       ''
                      const lastName = missingUser.user_metadata?.last_name || 
                                     missingUser.user_metadata?.family_name || 
                                     missingUser.user_metadata?.name?.split(' ').slice(1).join(' ') || 
                                     ''
                      const fullName = missingUser.user_metadata?.full_name || 
                                     missingUser.user_metadata?.name || 
                                     `${firstName} ${lastName}`.trim() || 
                                     missingUser.email || ''
                      
                      await syncUserToDatabaseServer({
                        id: missingUser.id,
                        email: missingUser.email || '',
                        first_name: firstName,
                        last_name: lastName,
                        full_name: fullName,
                        location: missingUser.user_metadata?.location || '',
                        avatar_url: missingUser.user_metadata?.avatar_url || 
                                   missingUser.user_metadata?.picture || 
                                   null,
                        phone: missingUser.user_metadata?.phone || '',
                        bio: missingUser.user_metadata?.bio || '',
                        position: missingUser.user_metadata?.position || '',
                        company: missingUser.user_metadata?.company || '',
                        completed_data: missingUser.user_metadata?.completed_data ?? false,
                        birthday: missingUser.user_metadata?.birthday || null,
                        gender: missingUser.user_metadata?.gender || null,
                        admin_level: missingUser.user_metadata?.admin_level || 'user'
                      })
                      
                      syncedCount++
                      console.log(`✅ Auto-synced missing user: ${missingUser.email}`)
                    } catch (syncError) {
                      console.error(`❌ Failed to auto-sync user ${missingUser.email}:`, syncError)
                    }
                  }
                  
                  if (syncedCount > 0) {
                    console.log(`✅ Auto-synced ${syncedCount} user(s)`)
                  }
                }
              }
            }
          }
        } catch (error) {
          // Silently fail - this is just for debugging and shouldn't break the API
          console.log('Could not compare with Supabase Auth count:', error)
        }
      })
    }

    // Fetch active resumes count (saved_resumes table)
    const resumesResult = await pool.query('SELECT COUNT(*) as count FROM saved_resumes')
    const activeResumes = parseInt(resumesResult.rows[0]?.count || '0')

    // Fetch active jobs count from all three sources (matching job-matching page)
    // 1. job_requests (admin jobs) - only unprocessed ones
    const jobRequestsResult = await pool.query(
      `SELECT COUNT(*) as count 
       FROM job_requests 
       WHERE status = 'active'`
    )
    const jobRequestsCount = parseInt(jobRequestsResult.rows[0]?.count || '0')

    // Recruiter jobs removed - table dropped
    const recruiterJobsCount = 0

    // Combine all active jobs
    const activeJobs = jobRequestsCount + recruiterJobsCount

    return NextResponse.json({
      totalUsers,
      activeResumes,
      activeJobs
    })
  } catch (error) {
    console.error('Error fetching platform stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch platform statistics' },
      { status: 500 }
    )
  }
}
