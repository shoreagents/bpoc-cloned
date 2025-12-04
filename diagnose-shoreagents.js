/**
 * Direct test of ShoreAgents connection
 * This will show us exactly what's happening
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load env vars
dotenv.config({ path: '.env.local' })

async function diagnoseConnection() {
  console.log('🔍 SHOREAGENTS DATABASE DIAGNOSTICS\n')
  console.log('=' .repeat(60))
  
  // Check environment variables
  const url = process.env.NEXT_PUBLIC_SHOREAGENTS_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SHOREAGENTS_SUPABASE_ANON_KEY
  const serviceKey = process.env.SHOREAGENTS_SERVICE_ROLE_KEY
  
  console.log('\n📝 Environment Variables:')
  console.log('URL:', url ? '✅ Set' : '❌ Missing')
  console.log('Anon Key:', anonKey ? `✅ Set (${anonKey.substring(0, 20)}...)` : '❌ Missing')
  console.log('Service Key:', serviceKey ? `✅ Set (${serviceKey.substring(0, 20)}...)` : '❌ Missing')
  
  if (!url || !anonKey) {
    console.log('\n❌ Missing required environment variables!')
    return
  }
  
  // Test with ANON key first
  console.log('\n' + '='.repeat(60))
  console.log('🧪 TEST 1: Connecting with ANON key...')
  console.log('='.repeat(60))
  
  const anonClient = createClient(url, anonKey)
  
  try {
    const { data, error } = await anonClient
      .from('interview_requests')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log('❌ ANON Key Failed:', error.message)
      console.log('   Code:', error.code)
      console.log('   This is expected if RLS is enabled!')
    } else {
      console.log('✅ ANON Key Works!')
    }
  } catch (err) {
    console.log('❌ ANON Key Error:', err.message)
  }
  
  // Test with SERVICE ROLE key
  if (serviceKey) {
    console.log('\n' + '='.repeat(60))
    console.log('🧪 TEST 2: Connecting with SERVICE ROLE key...')
    console.log('='.repeat(60))
    
    const serviceClient = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    })
    
    try {
      const { data, error, count } = await serviceClient
        .from('interview_requests')
        .select('*', { count: 'exact' })
        .limit(1)
      
      if (error) {
        console.log('❌ SERVICE ROLE Key Failed:', error.message)
        console.log('   Code:', error.code)
        console.log('   Details:', error.details)
        console.log('\n⚠️  This means your SERVICE ROLE key is wrong or the table doesn\'t exist!')
      } else {
        console.log('✅ SERVICE ROLE Key Works!')
        console.log(`📊 Found ${count || 0} total interview requests`)
        if (data && data.length > 0) {
          console.log('📄 Sample interview:', {
            id: data[0].id,
            status: data[0].status,
            candidate: data[0].candidateFirstName || data[0].candidate_first_name
          })
        }
      }
    } catch (err) {
      console.log('❌ SERVICE ROLE Error:', err.message)
    }
  } else {
    console.log('\n⚠️  No SERVICE ROLE key found!')
    console.log('   Add SHOREAGENTS_SERVICE_ROLE_KEY to .env.local')
  }
  
  // Final recommendations
  console.log('\n' + '='.repeat(60))
  console.log('📋 RECOMMENDATIONS:')
  console.log('='.repeat(60))
  
  if (!serviceKey) {
    console.log('\n1. ❌ ADD SERVICE ROLE KEY')
    console.log('   Get it from: ShoreAgents Supabase → Settings → API → service_role')
    console.log('   Add to .env.local:')
    console.log('   SHOREAGENTS_SERVICE_ROLE_KEY="your-service-role-key"')
  }
  
  console.log('\n2. ✅ VERIFY THE KEYS ARE DIFFERENT')
  console.log('   Anon key and service_role key should be DIFFERENT!')
  console.log('   Service role key is usually longer.')
  
  console.log('\n3. ✅ CHECK THE DATABASE')
  console.log('   Make sure the table "interview_requests" exists in ShoreAgents DB')
  console.log('   Run this in ShoreAgents SQL Editor:')
  console.log('   SELECT * FROM interview_requests LIMIT 1;')
  
  console.log('\n4. ✅ RESTART DEV SERVER')
  console.log('   After any .env changes, restart: npm run dev')
  
  console.log('\n' + '='.repeat(60))
}

diagnoseConnection()

