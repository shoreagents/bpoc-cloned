/**
 * Test Database Connections
 * 
 * This script tests connections to both Railway and Supabase databases
 * WITHOUT creating any tables or modifying data.
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient as RailwayPrismaClient } from '@prisma/client-railway';
import { PrismaClient as SupabasePrismaClient } from '@prisma/client-supabase';

const prismaRailway = new RailwayPrismaClient();
const prismaSupabase = new SupabasePrismaClient();

async function testConnections() {
  console.log('🔌 Testing database connections...\n');

  // Test Railway connection
  try {
    await prismaRailway.$connect();
    console.log('✅ Railway connection successful!');
    
    // Get database info without querying tables
    const railwayResult = await prismaRailway.$queryRaw`SELECT version()`;
    console.log('   Railway database:', railwayResult);
  } catch (error: any) {
    console.error('❌ Railway connection failed:', error.message);
  }

  console.log('');

  // Test Supabase connection
  try {
    await prismaSupabase.$connect();
    console.log('✅ Supabase connection successful!');
    
    // Get database info without querying tables
    const supabaseResult = await prismaSupabase.$queryRaw`SELECT version()`;
    console.log('   Supabase database:', supabaseResult);
  } catch (error: any) {
    console.error('❌ Supabase connection failed:', error.message);
  }

  // Close connections
  await prismaRailway.$disconnect();
  await prismaSupabase.$disconnect();
  
  console.log('\n✨ Connection test completed!');
}

testConnections();

