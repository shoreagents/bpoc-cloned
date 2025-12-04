import { NextRequest, NextResponse } from 'next/server'

// Comments feature has been disabled - table removed
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  // Return empty comments array since the table has been removed
  return NextResponse.json({ comments: [] })
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  // Comments feature disabled - return error
  return NextResponse.json({ error: 'Comments feature has been disabled' }, { status: 410 })
}


