/**
 * Example: Database Migration Script
 * 
 * This script demonstrates how to migrate data from Railway to Supabase
 * using both Prisma clients simultaneously.
 * 
 * IMPORTANT: Before running this script:
 * 1. Update your .env file with Supabase database credentials
 * 2. Run migrations on Supabase: npx prisma migrate deploy --schema=./prisma-supabase/schema.prisma
 * 3. Test with a small batch first!
 */

import { prismaRailway, prismaSupabase } from './src/lib/prisma-clients';

async function migrateUsers() {
  console.log('🚀 Starting user migration from Railway to Supabase...\n');

  try {
    // 1. Count total users in Railway
    const totalUsers = await prismaRailway.user.count();
    console.log(`📊 Found ${totalUsers} users in Railway database`);

    // 2. Fetch users from Railway (in batches for large datasets)
    const batchSize = 100;
    let migrated = 0;

    for (let skip = 0; skip < totalUsers; skip += batchSize) {
      const users = await prismaRailway.user.findMany({
        take: batchSize,
        skip: skip,
        include: {
          workStatus: true,
          privacySettings: true,
          discPersonalityStats: true,
          typingHeroStats: true,
          leaderboardScore: true,
        },
      });

      // 3. Insert into Supabase
      for (const user of users) {
        try {
          // Create user in Supabase
          await prismaSupabase.user.create({
            data: {
              id: user.id,
              email: user.email,
              first_name: user.first_name,
              last_name: user.last_name,
              full_name: user.full_name,
              location: user.location,
              avatar_url: user.avatar_url,
              created_at: user.created_at,
              updated_at: user.updated_at,
              phone: user.phone,
              bio: user.bio,
              position: user.position,
              admin_level: user.admin_level,
              completed_data: user.completed_data,
              birthday: user.birthday,
              slug: user.slug,
              gender: user.gender,
              gender_custom: user.gender_custom,
              location_place_id: user.location_place_id,
              location_lat: user.location_lat,
              location_lng: user.location_lng,
              location_city: user.location_city,
              location_province: user.location_province,
              location_country: user.location_country,
              location_barangay: user.location_barangay,
              location_region: user.location_region,
              username: user.username,
              company: user.company,
              company_id: user.company_id,
              is_company_admin: user.is_company_admin,
              agency_id: user.agency_id,
              role: user.role,
              // Add related data if needed
              // workStatus: user.workStatus ? { create: { ... } } : undefined,
            },
          });

          migrated++;
          console.log(`✅ Migrated user: ${user.email} (${migrated}/${totalUsers})`);
        } catch (error: any) {
          // Skip if user already exists
          if (error.code === 'P2002') {
            console.log(`⏭️  User ${user.email} already exists in Supabase`);
          } else {
            console.error(`❌ Error migrating user ${user.email}:`, error.message);
          }
        }
      }

      console.log(`\n📦 Batch ${skip / batchSize + 1} completed (${migrated}/${totalUsers})\n`);
    }

    console.log(`\n🎉 Migration completed! ${migrated}/${totalUsers} users migrated.`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    // Close connections
    await prismaRailway.$disconnect();
    await prismaSupabase.$disconnect();
  }
}

// Example: Compare data between databases
async function compareData() {
  console.log('🔍 Comparing data between Railway and Supabase...\n');

  try {
    const railwayCount = await prismaRailway.user.count();
    const supabaseCount = await prismaSupabase.user.count();

    console.log(`Railway users: ${railwayCount}`);
    console.log(`Supabase users: ${supabaseCount}`);
    console.log(`Difference: ${railwayCount - supabaseCount}`);

    if (railwayCount === supabaseCount) {
      console.log('✅ Both databases have the same number of users!');
    } else {
      console.log('⚠️  Databases have different user counts');
    }
  } catch (error) {
    console.error('❌ Comparison failed:', error);
  } finally {
    await prismaRailway.$disconnect();
    await prismaSupabase.$disconnect();
  }
}

// Example: Read from both databases simultaneously
async function readFromBoth() {
  try {
    const [railwayUsers, supabaseUsers] = await Promise.all([
      prismaRailway.user.findMany({ take: 5 }),
      prismaSupabase.user.findMany({ take: 5 }),
    ]);

    console.log('Railway users:', railwayUsers.length);
    console.log('Supabase users:', supabaseUsers.length);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prismaRailway.$disconnect();
    await prismaSupabase.$disconnect();
  }
}

// Uncomment to run:
// migrateUsers();
// compareData();
// readFromBoth();

export { migrateUsers, compareData, readFromBoth };

