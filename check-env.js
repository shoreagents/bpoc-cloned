/**
 * Simple check to verify environment variables
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

console.log('🔍 Checking Environment Variables:\n')

// Check ShoreAgents variables
console.log('ShoreAgents Database:')
console.log('  NEXT_PUBLIC_SHOREAGENTS_SUPABASE_URL:', 
  process.env.NEXT_PUBLIC_SHOREAGENTS_SUPABASE_URL ? '✅ Set' : '❌ Missing')

console.log('  NEXT_PUBLIC_SHOREAGENTS_SUPABASE_ANON_KEY:', 
  process.env.NEXT_PUBLIC_SHOREAGENTS_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')

console.log('  SHOREAGENTS_SERVICE_ROLE_KEY:', 
  process.env.SHOREAGENTS_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing')

// Check BPOC variables (should already be set)
console.log('\nBPOC Database:')
console.log('  NEXT_PUBLIC_SUPABASE_URL:', 
  process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing')

console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')

console.log('\n' + '='.repeat(50))

// Provide instructions if variables are missing
const missing = []
if (!process.env.NEXT_PUBLIC_SHOREAGENTS_SUPABASE_URL) missing.push('NEXT_PUBLIC_SHOREAGENTS_SUPABASE_URL')
if (!process.env.NEXT_PUBLIC_SHOREAGENTS_SUPABASE_ANON_KEY) missing.push('NEXT_PUBLIC_SHOREAGENTS_SUPABASE_ANON_KEY')

if (missing.length > 0) {
  console.log('\n❌ Missing required environment variables:')
  missing.forEach(v => console.log(`   - ${v}`))
  console.log('\n💡 To fix:')
  console.log('1. Create or edit .env.local file in the bpoc/ directory')
  console.log('2. Add these lines:')
  console.log('\n   NEXT_PUBLIC_SHOREAGENTS_SUPABASE_URL="https://your-project.supabase.co"')
  console.log('   NEXT_PUBLIC_SHOREAGENTS_SUPABASE_ANON_KEY="your-anon-key"')
  console.log('   SHOREAGENTS_SERVICE_ROLE_KEY="your-service-role-key"')
  console.log('\n3. Restart your dev server: npm run dev')
} else {
  console.log('\n✅ All required ShoreAgents environment variables are set!')
  console.log('\n📌 Next step: Restart your dev server')
  console.log('   Run: npm run dev')
  console.log('\n   Then visit: http://localhost:3000/admin/interviews')
}

