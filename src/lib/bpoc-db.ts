/**
 * BPOC Database Connection
 * Connects to external BPOC candidate database to fetch candidate information
 * This is the existing BPOC.IO Supabase database
 */

import { createClient } from '@supabase/supabase-js'

// BPOC database is the current main Supabase database
const bpocUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const bpocKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const bpocDb = createClient(bpocUrl, bpocKey)

export interface BpocCandidate {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  phone: string | null
  avatar_url: string | null
  position: string | null
  location: string | null
  location_city: string | null
  location_country: string | null
  bio: string | null
  created_at: string
  // Resume data if available
  resume_data?: any
  // Assessment scores if available
  disc_personality?: any
  typing_hero_stats?: any
  ai_analysis?: any
}

/**
 * Get candidate by ID from BPOC database
 */
export async function getCandidateById(candidateId: string): Promise<BpocCandidate | null> {
  try {
    // Fetch user data
    const { data: user, error: userError } = await bpocDb
      .from('users')
      .select('*')
      .eq('id', candidateId)
      .single()

    if (userError || !user) {
      console.error('Error fetching candidate:', userError)
      return null
    }

    // Fetch resume data
    const { data: resume } = await bpocDb
      .from('resumes_extracted')
      .select('resume_data')
      .eq('user_id', candidateId)
      .single()

    // Fetch DISC stats
    const { data: discStats } = await bpocDb
      .from('disc_personality_stats')
      .select('*')
      .eq('user_id', candidateId)
      .single()

    // Fetch typing stats
    const { data: typingStats } = await bpocDb
      .from('typing_hero_stats')
      .select('*')
      .eq('user_id', candidateId)
      .single()

    // Fetch AI analysis
    const { data: aiAnalysis } = await bpocDb
      .from('ai_analysis_results')
      .select('*')
      .eq('user_id', candidateId)
      .single()

    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: user.full_name,
      phone: user.phone,
      avatar_url: user.avatar_url,
      position: user.position,
      location: user.location,
      location_city: user.location_city,
      location_country: user.location_country,
      bio: user.bio,
      created_at: user.created_at,
      resume_data: resume?.resume_data,
      disc_personality: discStats ? {
        primary_type: discStats.latest_primary_type,
        secondary_type: discStats.latest_secondary_type,
        d_score: discStats.latest_d_score,
        i_score: discStats.latest_i_score,
        s_score: discStats.latest_s_score,
        c_score: discStats.latest_c_score,
      } : null,
      typing_hero_stats: typingStats ? {
        best_wpm: typingStats.best_wpm,
        best_accuracy: typingStats.best_accuracy,
        latest_wpm: typingStats.latest_wpm,
        latest_accuracy: typingStats.latest_accuracy,
      } : null,
      ai_analysis: aiAnalysis ? {
        overall_score: aiAnalysis.overall_score,
        key_strengths: aiAnalysis.key_strengths,
      } : null,
    }
  } catch (error) {
    console.error('Error fetching candidate from BPOC database:', error)
    return null
  }
}

/**
 * Search candidates by criteria
 */
export async function searchCandidates(
  searchTerm?: string,
  limit: number = 20
): Promise<BpocCandidate[]> {
  try {
    let query = bpocDb
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (searchTerm) {
      query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,position.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error searching candidates:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error searching candidates:', error)
    return []
  }
}

/**
 * Test BPOC database connection
 */
export async function testBpocConnection(): Promise<boolean> {
  try {
    const { data, error } = await bpocDb
      .from('users')
      .select('count')
      .limit(1)

    if (error) {
      console.error('BPOC database connection failed:', error)
      return false
    }

    console.log('✅ BPOC database connection successful')
    return true
  } catch (error) {
    console.error('BPOC database connection failed:', error)
    return false
  }
}

