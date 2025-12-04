/**
 * Dual Prisma Client Setup
 * 
 * This file exports two separate Prisma clients:
 * 1. prismaRailway - Connects to Railway database (current production)
 * 2. prismaSupabase - Connects to Supabase database (for migration)
 * 
 * Use this during migration to read from Railway and write to Supabase
 */

import { PrismaClient as RailwayPrismaClient } from '@prisma/client-railway';
import { PrismaClient as SupabasePrismaClient } from '@prisma/client-supabase';

// Railway Database Client (Production)
const globalForRailway = globalThis as unknown as {
  prismaRailway: RailwayPrismaClient | undefined;
};

export const prismaRailway =
  globalForRailway.prismaRailway ?? new RailwayPrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForRailway.prismaRailway = prismaRailway;
}

// Supabase Database Client (Migration Target)
const globalForSupabase = globalThis as unknown as {
  prismaSupabase: SupabasePrismaClient | undefined;
};

export const prismaSupabase =
  globalForSupabase.prismaSupabase ?? new SupabasePrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForSupabase.prismaSupabase = prismaSupabase;
}

// Export both clients
export default {
  railway: prismaRailway,
  supabase: prismaSupabase,
};

