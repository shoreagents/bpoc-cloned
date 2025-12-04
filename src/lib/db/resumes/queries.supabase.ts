/**
 * Supabase Queries for Resumes
 * Direct queries to Supabase candidate_resumes table
 */
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export interface Resume {
  id: string
  candidate_id: string
  resume_data: any
  original_filename: string | null
  slug: string | null
  is_primary: boolean
  is_public: boolean
  created_at: string
  updated_at: string
}

export async function getResumeByCandidateId(candidateId: string): Promise<Resume | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('candidate_resumes')
    .select('*')
    .eq('candidate_id', candidateId)
    .eq('is_primary', true)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    candidate_id: data.candidate_id,
    resume_data: data.resume_data,
    original_filename: data.original_filename,
    slug: data.slug,
    is_primary: data.is_primary,
    is_public: data.is_public,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

export async function getResumeBySlug(slug: string): Promise<Resume | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('candidate_resumes')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    candidate_id: data.candidate_id,
    resume_data: data.resume_data,
    original_filename: data.original_filename,
    slug: data.slug,
    is_primary: data.is_primary,
    is_public: data.is_public,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

export async function saveResume(data: {
  candidate_id: string
  resume_data: any
  original_filename?: string | null
  slug?: string | null
  title?: string | null
  is_primary?: boolean
  is_public?: boolean
}): Promise<Resume> {
  // Generate slug if not provided
  const slug = data.slug || `${data.candidate_id}-${Date.now()}`
  const title = data.title || 'Resume'

  // Check if resume exists for this candidate
  const existing = await getResumeByCandidateId(data.candidate_id)
  
  // Use admin client to bypass RLS
  const { data: resume, error } = existing
    ? await supabaseAdmin
        .from('candidate_resumes')
        .update({
          resume_data: data.resume_data,
          original_filename: data.original_filename || null,
          title: title,
          is_primary: data.is_primary ?? true,
          is_public: data.is_public ?? false,
        })
        .eq('candidate_id', data.candidate_id)
        .select()
        .single()
    : await supabaseAdmin
        .from('candidate_resumes')
        .insert({
          candidate_id: data.candidate_id,
          resume_data: data.resume_data,
          original_filename: data.original_filename || null,
          slug: slug,
          title: title,
          is_primary: data.is_primary ?? true,
          is_public: data.is_public ?? false,
        })
        .select()
        .single()

  if (error) throw new Error(error.message)

  return {
    id: resume.id,
    candidate_id: resume.candidate_id,
    resume_data: resume.resume_data,
    original_filename: resume.original_filename,
    slug: resume.slug,
    is_primary: resume.is_primary,
    is_public: resume.is_public,
    created_at: resume.created_at,
    updated_at: resume.updated_at,
  }
}

export async function deleteResume(candidateId: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('candidate_resumes')
    .delete()
    .eq('candidate_id', candidateId)

  return !error
}

