import { NextRequest, NextResponse } from 'next/server'
import { getCandidateById, updateCandidate } from '@/lib/db/candidates'
import { getProfileByCandidate, updateProfile } from '@/lib/db/profiles'
import { notifyN8nNewUser } from '@/lib/n8n'
import { supabaseAdmin } from '@/lib/supabase/admin'

// GET - Fetch user profile from SUPABASE
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    console.log('🔍 API: Fetching profile from SUPABASE for user:', userId)

    // Get candidate (basic info) from Supabase
    const candidate = await getCandidateById(userId)
    if (!candidate) {
      console.log('❌ API: Candidate not found in Supabase:', userId)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get profile (extended info) from Supabase
    const profile = await getProfileByCandidate(userId)

    // Combine into expected shape (matching old API format)
    const userProfile = {
      id: candidate.id,
      email: candidate.email,
      first_name: candidate.first_name,
      last_name: candidate.last_name,
      full_name: candidate.full_name,
      location: profile?.location || null,
      avatar_url: candidate.avatar_url,
      phone: candidate.phone,
      bio: profile?.bio || null,
      position: profile?.position || null,
      completed_data: profile?.profile_completed || false,
      birthday: profile?.birthday || null,
      slug: candidate.slug,
      gender: profile?.gender || null,
      gender_custom: profile?.gender_custom || null,
      username: candidate.username,
      company: profile?.current_employer || null,
      admin_level: null, // Admins are in bpoc_users, not candidates
      location_place_id: profile?.location_place_id || null,
      location_lat: profile?.location_lat || null,
      location_lng: profile?.location_lng || null,
      location_city: profile?.location_city || null,
      location_province: profile?.location_province || null,
      location_country: profile?.location_country || null,
      location_barangay: profile?.location_barangay || null,
      location_region: profile?.location_region || null,
      created_at: candidate.created_at,
      updated_at: candidate.updated_at,
      overall_score: profile?.gamification?.total_xp || 0
    }
    
    console.log('✅ API: User profile loaded from Supabase:', { id: userProfile.id, email: userProfile.email })

    const response = NextResponse.json({ user: userProfile })
    
    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('❌ API: Error fetching user profile:', error)
    console.error('❌ API: Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      errorType: typeof error,
      errorString: String(error),
      errorJSON: JSON.stringify(error),
      timestamp: new Date().toISOString()
    })
    
    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes('connection')) {
        console.error('🌐 Database connection error detected')
        return NextResponse.json({ 
          error: 'Database connection failed', 
          details: 'Unable to connect to the database. Please try again.' 
        }, { status: 503 })
      } else if (error.message.includes('timeout')) {
        console.error('⏰ Database timeout error detected')
        return NextResponse.json({ 
          error: 'Database timeout', 
          details: 'Database query timed out. Please try again.' 
        }, { status: 504 })
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// PUT - Update user profile in SUPABASE (NO MORE RAILWAY!)
export async function PUT(request: NextRequest) {
  console.log('🚀 PUT /api/user/profile - Updating in SUPABASE ONLY')
  try {
    const { userId, ...updateData } = await request.json()
    console.log('📊 Update data received:', { userId, updateData })

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    console.log('🔄 Updating profile in SUPABASE for user:', userId)

    // Get existing candidate and profile from Supabase
    const existingCandidate = await getCandidateById(userId)
    if (!existingCandidate) {
      console.log('❌ Candidate not found in Supabase:', userId)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const existingProfile = await getProfileByCandidate(userId)

    // Prepare update data for candidates table
    const candidateUpdate: any = {}
    if (updateData.first_name !== undefined) candidateUpdate.first_name = updateData.first_name
    if (updateData.last_name !== undefined) candidateUpdate.last_name = updateData.last_name
    if (updateData.username !== undefined) candidateUpdate.username = updateData.username
    if (updateData.phone !== undefined) candidateUpdate.phone = updateData.phone
    if (updateData.avatar_url !== undefined) candidateUpdate.avatar_url = updateData.avatar_url

    // Prepare update data for candidate_profiles table
    const profileUpdate: any = {}
    if (updateData.location !== undefined) profileUpdate.location = updateData.location
    if (updateData.position !== undefined) profileUpdate.position = updateData.position
    if (updateData.bio !== undefined) profileUpdate.bio = updateData.bio
    if (updateData.birthday !== undefined) {
      profileUpdate.birthday = updateData.birthday && updateData.birthday.trim() ? updateData.birthday : null
    }
    if (updateData.gender !== undefined) profileUpdate.gender = updateData.gender
    if (updateData.gender_custom !== undefined) profileUpdate.gender_custom = updateData.gender_custom
    if (updateData.completed_data !== undefined) profileUpdate.profile_completed = updateData.completed_data
    if (updateData.location_place_id !== undefined) profileUpdate.location_place_id = updateData.location_place_id
    if (updateData.location_lat !== undefined) profileUpdate.location_lat = updateData.location_lat
    if (updateData.location_lng !== undefined) profileUpdate.location_lng = updateData.location_lng
    if (updateData.location_city !== undefined) profileUpdate.location_city = updateData.location_city
    if (updateData.location_province !== undefined) profileUpdate.location_province = updateData.location_province
    if (updateData.location_country !== undefined) profileUpdate.location_country = updateData.location_country
    if (updateData.location_barangay !== undefined) profileUpdate.location_barangay = updateData.location_barangay
    if (updateData.location_region !== undefined) profileUpdate.location_region = updateData.location_region
    if (updateData.company !== undefined) profileUpdate.current_employer = updateData.company

    // Update candidate in Supabase
    if (Object.keys(candidateUpdate).length > 0) {
      await updateCandidate(userId, candidateUpdate)
      console.log('✅ Candidate updated in Supabase')
    }

    // Update profile in Supabase
    if (Object.keys(profileUpdate).length > 0) {
      await updateProfile(userId, profileUpdate)
      console.log('✅ Profile updated in Supabase')
    }

    // Get updated data
    const updatedCandidate = await getCandidateById(userId)
    const updatedProfile = await getProfileByCandidate(userId)

    if (!updatedCandidate) {
      return NextResponse.json({ error: 'Failed to retrieve updated user' }, { status: 500 })
    }

    // Check if profile just became completed
    const justCompleted = existingProfile?.profile_completed !== true && 
                         (updateData.completed_data === true || profileUpdate.profile_completed === true)

    if (justCompleted) {
      try {
        await notifyN8nNewUser({
          id: updatedCandidate.id,
          email: updatedCandidate.email,
          full_name: updatedCandidate.full_name,
          admin_level: null, // Candidates don't have admin_level
          created_at: updatedCandidate.created_at,
          slug: updatedCandidate.slug || null,
          username: updatedCandidate.username || null
        })
        console.log('✅ N8N notification sent')
      } catch (e) {
        console.error('❌ Failed to send n8n signup notification:', e)
      }
    }

    // Update Supabase auth metadata
    const firstName = candidateUpdate.first_name ?? updatedCandidate.first_name
    const lastName = candidateUpdate.last_name ?? updatedCandidate.last_name
    const fullName = `${firstName || ''} ${lastName || ''}`.trim() || updatedCandidate.full_name

    try {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          full_name: fullName,
          location: profileUpdate.location ?? updatedProfile?.location,
          phone: candidateUpdate.phone ?? updatedCandidate.phone,
          position: profileUpdate.position ?? updatedProfile?.position,
          bio: profileUpdate.bio ?? updatedProfile?.bio,
          company: profileUpdate.current_employer ?? updatedProfile?.current_employer
        }
      })
      console.log('✅ Supabase auth metadata updated')
    } catch (error) {
      console.error('❌ Supabase auth metadata update error:', error)
    }

    // Return updated user data
    const updatedUser = {
      id: updatedCandidate.id,
      email: updatedCandidate.email,
      first_name: updatedCandidate.first_name,
      last_name: updatedCandidate.last_name,
      full_name: updatedCandidate.full_name,
      location: updatedProfile?.location || null,
      avatar_url: updatedCandidate.avatar_url,
      phone: updatedCandidate.phone,
      bio: updatedProfile?.bio || null,
      position: updatedProfile?.position || null,
      completed_data: updatedProfile?.profile_completed || false,
      birthday: updatedProfile?.birthday || null,
      slug: updatedCandidate.slug,
      gender: updatedProfile?.gender || null,
      gender_custom: updatedProfile?.gender_custom || null,
      username: updatedCandidate.username,
      company: updatedProfile?.current_employer || null,
      location_place_id: updatedProfile?.location_place_id || null,
      location_lat: updatedProfile?.location_lat || null,
      location_lng: updatedProfile?.location_lng || null,
      location_city: updatedProfile?.location_city || null,
      location_province: updatedProfile?.location_province || null,
      location_country: updatedProfile?.location_country || null,
      location_barangay: updatedProfile?.location_barangay || null,
      location_region: updatedProfile?.location_region || null,
    }

    console.log('✅ Profile updated successfully in SUPABASE')
    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('❌ API: Error updating user profile:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: errorMessage 
    }, { status: 500 })
  }
}
