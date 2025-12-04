/**
 * Test ShoreAgents Database Connection
 * Run this to verify your environment variables are working
 */

import { shoreagentsDb } from './src/lib/shoreagents-db'

async function testConnection() {
  console.log('🔍 Testing ShoreAgents Database Connection...\n')
  
  // Check environment variables
  console.log('📝 Environment Variables:')
  console.log('NEXT_PUBLIC_SHOREAGENTS_SUPABASE_URL:', process.env.NEXT_PUBLIC_SHOREAGENTS_SUPABASE_URL ? '✅ Set' : '❌ Missing')
  console.log('NEXT_PUBLIC_SHOREAGENTS_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SHOREAGENTS_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')
  console.log('SHOREAGENTS_SERVICE_ROLE_KEY:', process.env.SHOREAGENTS_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing')
  console.log('')
  
  // Test connection
  console.log('🔌 Testing database connection...')
  try {
    const { data, error, count } = await shoreagentsDb
      .from('interview_requests')
      .select('*', { count: 'exact', head: false })
      .limit(1)
    
    if (error) {
      console.error('❌ Connection Error:', error)
      console.log('\n💡 Possible solutions:')
      console.log('1. Make sure you added SHOREAGENTS_SERVICE_ROLE_KEY to .env.local')
      console.log('2. Restart your dev server after adding env variables')
      console.log('3. Run the SQL policies from shoreagents-rls-policies.sql')
      return
    }
    
    console.log('✅ Connection successful!')
    console.log(`📊 Found ${count || 0} interview requests in database`)
    if (data && data.length > 0) {
      console.log('📄 Sample interview:', {
        id: data[0].id,
        status: data[0].status,
        candidateFirstName: data[0].candidateFirstName || data[0].candidate_first_name
      })
    }
    
  } catch (error) {
    console.error('❌ Unexpected Error:', error)
  }
}

testConnection()

