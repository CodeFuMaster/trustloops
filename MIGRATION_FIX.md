# Database Migration Fix for CallToAction Column

## Issue
The `call_to_action` column doesn't exist in the Supabase `projects` table, causing project creation to fail with error:
```
"Could not find the 'call_to_action' column of 'projects' in the schema cache"
```

## Quick Fix Applied
1. **Temporarily commented out CallToAction in insert operation** (SupabaseClient.cs line 36)
2. **Made CallToAction nullable** in SupabaseProject model

## Migration Required
Run this SQL in your Supabase SQL Editor:

```sql
-- Add call_to_action column to projects table
ALTER TABLE projects 
ADD COLUMN call_to_action TEXT DEFAULT 'Share your experience';

-- Update existing projects to have a default call to action
UPDATE projects 
SET call_to_action = 'Share your experience' 
WHERE call_to_action IS NULL;

-- Make the column NOT NULL after setting defaults
ALTER TABLE projects 
ALTER COLUMN call_to_action SET NOT NULL;
```

## After Migration
1. Uncomment the CallToAction line in SupabaseClient.cs
2. Make CallToAction non-nullable in SupabaseProject model
3. Test project creation

## Steps to Apply Migration
1. Go to your Supabase dashboard: https://anbgwbudvnjxsrgzpkot.supabase.co
2. Navigate to SQL Editor
3. Run the migration SQL above
4. Restart your backend server to refresh the schema cache
5. Test project creation

## Alternative: Run Migration via Supabase CLI
If you have Supabase CLI installed:
```bash
supabase db push --dry-run  # Preview changes
supabase db push            # Apply changes
```
