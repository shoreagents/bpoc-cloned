import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { userId, slug } = await request.json();

    if (!userId && !slug) {
      return NextResponse.json({ error: 'userId or slug is required' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      let actualUserId = userId;
      
      // If slug is provided, look up the user ID
      if (slug && !userId) {
        const userResult = await client.query(
          'SELECT id FROM users WHERE slug = $1',
          [slug]
        );
        
        if (userResult.rows.length === 0) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        
        actualUserId = userResult.rows[0].id;
        console.log(`Found user ID ${actualUserId} for slug ${slug}`);
      }

      // Clear all cached results for this user
      const result = await client.query(
        'DELETE FROM job_match_results WHERE user_id = $1',
        [actualUserId]
      );

      console.log(`Cleared ${result.rowCount} cached job match results for user ${actualUserId}`);

      return NextResponse.json({ 
        message: `Cleared ${result.rowCount} cached results for user ${actualUserId}`,
        cleared: result.rowCount,
        userId: actualUserId
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error clearing job match cache:', error);
    return NextResponse.json({ 
      error: 'Failed to clear cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
