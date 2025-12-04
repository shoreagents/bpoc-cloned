/**
 * Check which tables actually exist in both databases
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient as RailwayPrismaClient } from '@prisma/client-railway';
import { PrismaClient as SupabasePrismaClient } from '@prisma/client-supabase';

const prismaRailway = new RailwayPrismaClient();
const prismaSupabase = new SupabasePrismaClient();

async function checkTables() {
  console.log('🔍 Checking actual tables in databases...\n');

  // Check Railway tables
  try {
    const railwayTables = await prismaRailway.$queryRaw<any[]>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    console.log('📊 Railway Database Tables:', railwayTables.length);
    railwayTables.forEach((t, i) => console.log(`   ${i + 1}. ${t.table_name}`));
  } catch (error: any) {
    console.error('❌ Railway error:', error.message);
  }

  console.log('');

  // Check Supabase tables
  try {
    const supabaseTables = await prismaSupabase.$queryRaw<any[]>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    console.log('📊 Supabase Database Tables:', supabaseTables.length);
    if (supabaseTables.length === 0) {
      console.log('   ✅ No tables yet - Supabase is empty!');
    } else {
      supabaseTables.forEach((t, i) => console.log(`   ${i + 1}. ${t.table_name}`));
    }
  } catch (error: any) {
    console.error('❌ Supabase error:', error.message);
  }

  console.log('');

  // Check for data in Supabase
  if (await hasData()) {
    console.log('⚠️  Supabase has tables and data!');
  } else {
    console.log('✅ Supabase is empty (no tables or no data)');
  }

  await prismaRailway.$disconnect();
  await prismaSupabase.$disconnect();
}

async function hasData() {
  try {
    const count = await prismaSupabase.user.count();
    console.log(`   Supabase user count: ${count}`);
    return count > 0;
  } catch (error) {
    // Table doesn't exist
    return false;
  }
}

checkTables();

