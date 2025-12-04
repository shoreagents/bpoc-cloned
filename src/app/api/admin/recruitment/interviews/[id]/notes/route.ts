/**
 * POST /api/admin/recruitment/interviews/[id]/notes
 * Add or update notes for an interview
 */

import { NextRequest, NextResponse } from 'next/server'
import { shoreagentsDb } from '@/lib/shoreagents-db'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await req.json()
    const { notes } = body

    if (!notes) {
      return NextResponse.json(
        { success: false, error: 'Notes are required' },
        { status: 400 }
      )
    }

    const { data, error } = await shoreagentsDb
      .from('interview_requests')
      .update({
        admin_notes: notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating notes:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update notes', details: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Interview request not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notes updated successfully',
      interview: data,
    })
  } catch (error) {
    console.error('Error updating notes:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update notes',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

