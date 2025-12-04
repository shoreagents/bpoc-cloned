/**
 * ShoreAgents Database Connection
 * Connects to the ShoreAgents Supabase database to fetch interview data
 */

import { createClient } from '@supabase/supabase-js'

// Create Supabase client for ShoreAgents database
const shoreagentsUrl = process.env.NEXT_PUBLIC_SHOREAGENTS_SUPABASE_URL!
// Use service role key if available (bypasses RLS), otherwise use anon key
const shoreagentsKey = process.env.SHOREAGENTS_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SHOREAGENTS_SUPABASE_ANON_KEY!

export const shoreagentsDb = createClient(shoreagentsUrl, shoreagentsKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
})

/**
 * Get all interview requests from ShoreAgents database
 */
export async function getInterviewRequests() {
  try {
    const { data, error } = await shoreagentsDb
      .from('interview_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching interviews:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching interviews:', error)
    return { data: null, error }
  }
}

/**
 * Get single interview by ID
 */
export async function getInterviewById(id: string) {
  try {
    const { data, error } = await shoreagentsDb
      .from('interview_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching interview:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching interview:', error)
    return { data: null, error }
  }
}

/**
 * Get job acceptances
 */
export async function getJobAcceptances() {
  try {
    const { data, error } = await shoreagentsDb
      .from('job_acceptances')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching job acceptances:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching job acceptances:', error)
    return { data: null, error }
  }
}

/**
 * Update interview status
 */
export async function updateInterviewStatus(id: string, status: string, updates: any = {}) {
  try {
    const { data, error } = await shoreagentsDb
      .from('interview_requests')
      .update({
        status,
        updated_at: new Date().toISOString(),
        ...updates,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating interview:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error updating interview:', error)
    return { data: null, error }
  }
}

/**
 * Test connection to ShoreAgents database
 */
export async function testShoreagentsConnection() {
  try {
    const { data, error } = await shoreagentsDb
      .from('interview_requests')
      .select('count')
      .limit(1)

    if (error) {
      console.error('ShoreAgents database connection failed:', error)
      return false
    }

    console.log('✅ ShoreAgents database connection successful')
    return true
  } catch (error) {
    console.error('ShoreAgents database connection failed:', error)
    return false
  }
}

