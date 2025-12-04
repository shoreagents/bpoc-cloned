import { NextRequest, NextResponse } from 'next/server'
import { saveResume, getResumeByCandidateId } from '@/lib/db/resumes'
import { getCandidateById, updateCandidate } from '@/lib/db/candidates'
import { getProfileByCandidate, updateProfile } from '@/lib/db/profiles'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Save generated resume - NOW USING SUPABASE ONLY!
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Starting save-generated-resume API call (SUPABASE)...')
    
    const { 
      generatedResumeData, 
      originalResumeId, 
      templateUsed, 
      generationMetadata 
    } = await request.json()
    
    console.log('📥 Received data:', { 
      hasGeneratedResumeData: !!generatedResumeData, 
      originalResumeId,
      templateUsed,
      generationMetadataKeys: generationMetadata ? Object.keys(generationMetadata) : null
    })

    if (!generatedResumeData) {
      console.log('❌ Missing generatedResumeData')
      return NextResponse.json(
        { error: 'Missing required field: generatedResumeData' },
        { status: 400 }
      )
    }

    // Get the user from the request headers (set by middleware)
    const userId = request.headers.get('x-user-id')
    console.log('👤 User ID from headers:', userId)
    
    if (!userId) {
      console.log('❌ No user ID found in headers')
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Verify candidate exists in Supabase
    const candidate = await getCandidateById(userId)
    if (!candidate) {
      console.log('❌ Candidate not found in Supabase:', userId)
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      )
    }

    console.log('✅ Candidate found in Supabase')

    // If originalResumeId is provided, verify it exists and belongs to the user
    if (originalResumeId) {
      const existingResume = await getResumeByCandidateId(userId)
      if (!existingResume || existingResume.id !== originalResumeId) {
        console.log('❌ Original resume not found or does not belong to user:', originalResumeId)
        return NextResponse.json(
          { error: 'Original resume not found or access denied' },
          { status: 404 }
        )
      }
      console.log('✅ Original resume verified')
    }

    // Save generated resume data to candidate_resumes table
    // This updates the existing resume with generated data
    console.log('💾 Saving generated resume to Supabase candidate_resumes...')
    
    const resume = await saveResume({
      candidate_id: userId,
      resume_data: generatedResumeData,
      template_used: templateUsed || null,
      generation_metadata: generationMetadata || null,
      is_primary: true,
      is_public: false,
    })

    console.log(`✅ Generated resume saved to Supabase: ${resume.id}`)

    // Optional: Update candidate profile position from generated recommendation
    try {
      const recommendedPosition = (generatedResumeData && (
        (generatedResumeData as any).bestJobTitle ||
        (generatedResumeData as any).title ||
        (generatedResumeData as any).recommendedTitle ||
        (generatedResumeData as any).recommendedRole ||
        ((generatedResumeData as any).summary && (generatedResumeData as any).summary.bestJobTitle)
      )) || null

      if (recommendedPosition && typeof recommendedPosition === 'string' && recommendedPosition.trim().length > 0) {
        const newPos = recommendedPosition.trim()
        console.log('📝 Updating candidate profile position from generated resume recommendation:', newPos)
        await updateProfile(userId, { position: newPos })
        console.log('✅ Position updated in candidate_profiles')
      }
    } catch (e) {
      console.log('⚠️ Skipping position update from generated resume:', e instanceof Error ? e.message : 'unknown error')
    }

    return NextResponse.json({
      success: true,
      generatedResumeId: resume.id,
      message: 'Generated resume saved to database successfully'
    })

  } catch (error) {
    console.error('❌ Error saving generated resume to database:', error)
    return NextResponse.json(
      {
        error: 'Failed to save generated resume to database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
