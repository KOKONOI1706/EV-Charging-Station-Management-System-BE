# Database Setup

This directory contains SQL scripts for setting up the database on Supabase.

## Setup Order

### 1. Run Migration
Execute `migration_simple.sql` in Supabase SQL Editor to create all tables, indexes, foreign keys, and functions.

```sql
-- Copy and paste the entire content of migration_simple.sql into Supabase SQL Editor
```

### 2. Setup Permissions
Execute `grant_permissions.sql` to disable RLS and grant necessary permissions for the backend service.

```sql
-- Copy and paste the entire content of grant_permissions.sql into Supabase SQL Editor
```

This script will:
- Disable Row Level Security on all tables (for development)
- Grant all privileges to `service_role` (backend access)
- Grant basic privileges to `authenticated` users (future frontend access)
- Set default privileges for future tables

### 3. Seed Initial Data (Optional)
Execute `seed.sql` to populate the database with initial test data.

```sql
-- Copy and paste the entire content of seed.sql into Supabase SQL Editor
```

## Environment Variables Required

Make sure your `.env` file in the backend root contains:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

You can find these values in:
**Supabase Dashboard → Settings → API**

## Additional Migrations

### Add Foreign Key for charging_points
If you encounter issues with `charging_points` not having a foreign key relationship with `stations`, follow the instructions in:

📄 **`ADD_FOREIGN_KEY_INSTRUCTIONS.md`**

This adds:
- Foreign key constraint: `charging_points.station_id` → `stations.station_id`
- Index for better query performance
- Cascade delete/update behavior

## Verifying Setup

After running the scripts, test the connection:

```bash
npm start
```

The server should start without errors and connect to Supabase successfully.

## Production Notes

⚠️ **For production deployment:**

1. **Re-enable RLS** with proper policies:
   ```sql
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Service role bypass" ON users
   USING (auth.role() = 'service_role');
   ```

2. **Implement password hashing** in the backend (bcrypt)

3. **Use real JWT tokens** instead of demo tokens

4. **Review and restrict permissions** based on actual needs
