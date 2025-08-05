#!/bin/bash

# TrustLoops Production Database Migration Script
# Run this to set up the complete production database schema

echo "🚀 TrustLoops Production Database Migration"
echo "=========================================="

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    echo "   or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "⚠️  Supabase config not found. Initializing..."
    supabase init
fi

echo "📝 Running production database migration..."

# Apply the migration
supabase db reset --debug

echo "✅ Migration completed successfully!"
echo ""
echo "🔍 Verification - Checking tables:"
supabase db inspect

echo ""
echo "🎉 TrustLoops database is now production-ready!"
echo ""
echo "Next steps:"
echo "1. Update your application connection strings"
echo "2. Deploy your application"
echo "3. Test the complete workflow"
