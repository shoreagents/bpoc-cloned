/**
 * PATCH /api/admin/recruitment/interviews/[id]/schedule
 * Schedule an interview
 */

import { NextRequest, NextResponse } from 'next/server'
import { shoreagentsDb } from '@/lib/shoreagents-db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await req.json()
    const { scheduledTime, meetingLink, adminNotes } = body

    if (!scheduledTime || !meetingLink) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: scheduledTime and meetingLink',
        },
        { status: 400 }
      )
    }

    const { data, error } = await shoreagentsDb
      .from('interview_requests')
      .update({
        scheduled_time: scheduledTime,
        meeting_link: meetingLink,
        admin_notes: adminNotes,
        status: 'SCHEDULED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error scheduling interview:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to schedule interview', details: error.message },
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
      message: 'Interview scheduled successfully',
      interview: data,
    })
  } catch (error) {
    console.error('Error scheduling interview:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to schedule interview',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

