# Setup Instructions for Dual Prisma Clients

## ✅ What's Been Done

1. ✅ Created `prisma-supabase/` directory with Supabase schema
2. ✅ Updated `prisma/schema.prisma` to output Railway client to `@prisma/client-railway`
3. ✅ Generated Railway Prisma client
4. ✅ Created example migration script (`migrate-to-supabase.ts`)
5. ✅ Created dual client setup (`src/lib/prisma-clients.ts`)

## 🔧 What You Need to Do

### Step 1: Add Supabase Connection Strings to `.env`

Add these lines to your `.env` file (after the Railway DATABASE_URL):

```env
# Supabase Database - For migration (Replace [YOUR-PASSWORD] with your actual password)
SUPABASE_DATABASE_URL="postgresql://postgres.ayrdnsiaylomcemfdisr:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
SUPABASE_DIRECT_URL="postgresql://postgres.ayrdnsiaylomcemfdisr:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

### Step 2: Get Your Supabase Database Password

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `ayrdnsiaylomcemfdisr`
3. Click **Settings** (⚙️ icon at bottom left)
4. Click **Database**
5. Scroll to **Connection string** section
6. Copy your password and replace `[YOUR-PASSWORD]` in the `.env` file

### Step 3: Generate Supabase Prisma Client

After adding the connection strings to `.env`, run:

```bash
npx prisma generate --schema=./prisma-supabase/schema.prisma
```

### Step 4: Run Migrations on Supabase

To set up the schema on Supabase:

```bash
npx prisma migrate deploy --schema=./prisma-supabase/schema.prisma
```

Or if you want to create a new migration:

```bash
npx prisma migrate dev --schema=./prisma-supabase/schema.prisma --name init
```

## 📖 Usage Examples

### Import Both Clients

```typescript
import { prismaRailway, prismaSupabase } from './src/lib/prisma-clients';

// Read from Railway (current production)
const railwayUsers = await prismaRailway.user.findMany();

// Write to Supabase (migration target)
await prismaSupabase.user.create({
  data: { /* ... */ }
});
```

### Run Migration Script

```bash
npx ts-node migrate-to-supabase.ts
```

### Compare Data Between Databases

```typescript
import { compareData } from './migrate-to-supabase';

compareData();
```

## 🎯 Migration Workflow

1. **Prepare**: Get Supabase password and add to `.env`
2. **Generate**: Run `npx prisma generate --schema=./prisma-supabase/schema.prisma`
3. **Migrate Schema**: Run `npx prisma migrate deploy --schema=./prisma-supabase/schema.prisma`
4. **Test**: Read a few records from Railway and write to Supabase
5. **Migrate Data**: Run the migration script in batches
6. **Verify**: Compare data counts and sample records
7. **Switch**: Update your app to use `prismaSupabase` instead of `prismaRailway`
8. **Cleanup**: After successful migration, update `.env` to point `DATABASE_URL` to Supabase

## 🔄 After Migration is Complete

Once you've fully migrated to Supabase:

1. Update `.env`:
   ```env
   DATABASE_URL="postgresql://postgres.ayrdnsiaylomcemfdisr:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.ayrdnsiaylomcemfdisr:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
   ```

2. Update `prisma/schema.prisma`:
   ```prisma
   generator client {
     provider = "prisma-client-js"
     // Remove custom output path
   }

   datasource db {
     provider  = "postgresql"
     url       = env("DATABASE_URL")
     directUrl = env("DIRECT_URL")
   }
   ```

3. Regenerate client: `npx prisma generate`
4. Delete `prisma-supabase/` directory
5. Update imports in your app to use the standard `@prisma/client`

## 📝 Notes

- Both clients can run simultaneously
- Use this setup during migration period
- Test thoroughly before switching production traffic
- Keep Railway as backup until migration is verified
- Consider using a migration script that runs in stages

