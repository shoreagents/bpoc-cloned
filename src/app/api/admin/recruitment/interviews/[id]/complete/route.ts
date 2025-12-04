/**
 * PATCH /api/admin/recruitment/interviews/[id]/complete
 * Mark an interview as completed
 */

import { NextRequest, NextResponse } from 'next/server'
import { shoreagentsDb } from '@/lib/shoreagents-db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { data, error } = await shoreagentsDb
      .from('interview_requests')
      .update({
        status: 'COMPLETED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error completing interview:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to complete interview', details: error.message },
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
      message: 'Interview marked as completed',
      interview: data,
    })
  } catch (error) {
    console.error('Error completing interview:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to complete interview',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

