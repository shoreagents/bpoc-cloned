/**
 * Script to disable RLS on all Supabase tables for testing
 * Run with: npx tsx run-disable-rls.ts
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function disableRLS() {
  console.log('🔓 Disabling RLS on all tables for testing...\n')

  // Read the SQL file
  const sqlFile = path.join(__dirname, 'disable-rls-for-testing.sql')
  const sql = fs.readFileSync(sqlFile, 'utf-8')

  // Split by semicolons and filter out comments/empty lines
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && !s.startsWith('='))

  let successCount = 0
  let errorCount = 0

  for (const statement of statements) {
    if (!statement || statement.length < 10) continue // Skip very short lines

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement })
      
      if (error) {
        // Try direct query if RPC doesn't work
        const { error: directError } = await supabase
          .from('_dummy')
          .select('*')
          .limit(0) // This won't work, but we'll catch the error
        
        // Actually, we need to use the Postgres REST API or direct connection
        console.log(`⚠️  Could not execute via Supabase client: ${statement.substring(0, 50)}...`)
        console.log(`   Error: ${error.message}`)
        errorCount++
      } else {
        console.log(`✅ ${statement.substring(0, 60)}...`)
        successCount++
      }
    } catch (err) {
      console.error(`❌ Error executing: ${statement.substring(0, 50)}...`)
      console.error(`   ${err instanceof Error ? err.message : String(err)}`)
      errorCount++
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Success: ${successCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
  console.log(`\n⚠️  Note: Supabase client doesn't support ALTER TABLE directly.`)
  console.log(`   Please run the SQL file directly in Supabase SQL Editor:`)
  console.log(`   1. Go to Supabase Dashboard → SQL Editor`)
  console.log(`   2. Copy contents of: disable-rls-for-testing.sql`)
  console.log(`   3. Paste and run`)
}

// Run the script
disableRLS().catch(console.error)

