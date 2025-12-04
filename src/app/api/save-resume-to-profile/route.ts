import { NextRequest, NextResponse } from 'next/server'
import { saveResume, getResumeByCandidateId } from '@/lib/db/resumes'
import { getCandidateById } from '@/lib/db/candidates'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Save resume to profile - NOW USING SUPABASE ONLY!
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Starting save-resume-to-profile API call (SUPABASE)...')
    
    let { 
      resumeData, 
      templateUsed, 
      resumeTitle,
      resumeSlug 
    } = await request.json()
    
    console.log('📥 Received data:', { 
      hasResumeData: !!resumeData, 
      templateUsed,
      resumeTitle,
      resumeSlug
    })

    if (!resumeData || !templateUsed || !resumeTitle) {
      console.log('❌ Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields: resumeData, templateUsed, resumeTitle' },
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

    console.log('✅ Candidate found in Supabase:', candidate.full_name)

    // Helper to safely extract header info from extracted JSON
    const pickFirst = (obj: any, keys: string[]): any => {
      if (!obj) return undefined
      for (const k of keys) {
        if (obj[k]) return obj[k]
      }
      return undefined
    }
    const combine = (obj: any, keys: string[]): string | undefined => {
      const vals = keys.map(k => obj?.[k]).filter(Boolean)
      return vals.length ? vals.join(' ') : undefined
    }
    const fromContact = (obj: any, key: string): any => obj?.contact?.[key]

    const computeHeaderFromExtracted = (extracted: any) => {
      const data = extracted || {}
      return {
        name:
          pickFirst(data, ['name', 'full_name', 'fullName', 'personal_name', 'candidate_name']) ||
          (data.first_name && data.last_name ? `${data.first_name} ${data.last_name}` : undefined) ||
          fromContact(data, 'name') || 'Name not found',
        title:
          pickFirst(data, ['title', 'job_title', 'current_title']) ||
          (Array.isArray(data.experience) && data.experience[0]?.title) || 'Title not found',
        location:
          pickFirst(data, ['location', 'address', 'city', 'residence', 'current_location']) ||
          combine(data, ['city', 'country']) ||
          fromContact(data, 'location') || 'Location not found',
        email:
          pickFirst(data, ['email', 'email_address', 'contact_email', 'primary_email']) ||
          fromContact(data, 'email') || 'Email not found',
        phone:
          pickFirst(data, ['phone', 'phone_number', 'contact_phone', 'mobile', 'telephone']) ||
          fromContact(data, 'phone') || 'Phone not found',
      }
    }

    // If header info missing or incomplete, try to enrich from existing resume
    let needsHeaderEnrichment = !resumeData.headerInfo ||
      !resumeData.headerInfo.name || !resumeData.headerInfo.email || !resumeData.headerInfo.phone || !resumeData.headerInfo.location

    if (needsHeaderEnrichment) {
      try {
        const existingResume = await getResumeByCandidateId(userId)
        if (existingResume && existingResume.resume_data) {
          const extracted = existingResume.resume_data
          const computedHeader = computeHeaderFromExtracted(extracted)
          resumeData = {
            ...resumeData,
            headerInfo: {
              ...(resumeData.headerInfo || {}),
              ...computedHeader
            }
          }
          console.log('✅ Enriched header info from existing resume')
        }
      } catch (error) {
        console.log('⚠️ Could not enrich header from existing resume:', error)
      }
    }

    // Generate slug if not provided
    const generateSlugFromUser = (firstName: string, lastName: string, uid: string) => {
      const cleanFirst = (firstName || 'user')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 20)
      
      const cleanLast = (lastName || 'profile')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 20)
      
      const lastTwoDigits = uid.toString().slice(-2).padStart(2, '0')
      return `${cleanFirst}-${cleanLast}-${lastTwoDigits}`
    }

    // Use provided slug or generate one
    let finalSlug = resumeSlug || generateSlugFromUser(candidate.first_name, candidate.last_name, userId)
    
    // Check if slug already exists
    const { data: existingSlug } = await supabaseAdmin
      .from('candidate_resumes')
      .select('id')
      .eq('slug', finalSlug)
      .neq('candidate_id', userId)
      .limit(1)
      .single()

    if (existingSlug) {
      // Slug exists, add counter
      let counter = 1
      let uniqueSlug = finalSlug
      while (true) {
        uniqueSlug = `${finalSlug}-${counter}`
        const { data: check } = await supabaseAdmin
          .from('candidate_resumes')
          .select('id')
          .eq('slug', uniqueSlug)
          .limit(1)
          .single()
        
        if (!check) {
          finalSlug = uniqueSlug
          break
        }
        counter++
      }
    }

    console.log('💾 Saving resume to Supabase candidate_resumes...')
    
    // Save resume to Supabase using the abstraction layer
    const resume = await saveResume({
      candidate_id: userId,
      resume_data: resumeData,
      original_filename: `${resumeTitle}.json`,
      slug: finalSlug,
      title: resumeTitle,
      template_used: templateUsed,
      is_primary: true,
      is_public: false,
    })

    console.log(`✅ Resume saved to Supabase: ${resume.id}`)
    console.log(`🔗 Resume slug: ${finalSlug}`)
    console.log(`👤 User ID: ${userId}`)
    console.log(`📁 Resume title: ${resumeTitle}`)

    return NextResponse.json({
      success: true,
      savedResumeId: resume.id,
      resumeSlug: finalSlug,
      resumeUrl: `/${finalSlug}`,
      message: 'Resume saved to profile successfully'
    })

  } catch (error) {
    console.error('❌ Error saving resume to profile:', error)
    return NextResponse.json(
      {
        error: 'Failed to save resume to profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
