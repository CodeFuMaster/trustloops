# 🚀 TrustLoops Production Deployment Guide

## Prerequisites
- Supabase account and project set up
- Node.js and npm installed
- .NET 8 SDK installed
- Domain name (optional, for production)

## 1. Database Migration

### Step 1: Run the Production Schema Migration
1. Go to your Supabase dashboard: https://anbgwbudvnjxsrgzpkot.supabase.co
2. Navigate to **SQL Editor**
3. Copy the contents of `database/migrations/production_schema.sql`
4. Paste and execute the SQL script
5. Verify all tables are created:
   - `users`
   - `projects` (with `call_to_action` column)
   - `testimonials`

### Step 2: Verify Migration
Run these verification queries in SQL Editor:
```sql
-- Check table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'projects' 
ORDER BY ordinal_position;

-- Check if call_to_action column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'projects' AND column_name = 'call_to_action';
```

## 2. Environment Configuration

### Backend Configuration
Update `src/WebApp/appsettings.json`:
```json
{
  "Supabase": {
    "Url": "https://anbgwbudvnjxsrgzpkot.supabase.co",
    "ServiceKey": "your-service-role-key",
    "AnonKey": "your-anon-key",
    "JwtSecret": "your-jwt-secret"
  }
}
```

### Frontend Configuration
Update `apps/web/src/lib/supabase.ts` if needed:
```typescript
const supabaseUrl = 'https://anbgwbudvnjxsrgzpkot.supabase.co'
const supabaseAnonKey = 'your-anon-key'
```

## 3. Build and Deploy

### Build Frontend (Production)
```bash
cd apps/web
npm run build
```

### Build Backend (Production)
```bash
cd src/WebApp
dotnet publish -c Release -o ./publish
```

## 4. Deployment Options

### Option A: Vercel (Frontend) + Railway/Heroku (Backend)
1. **Frontend to Vercel:**
   ```bash
   npm install -g vercel
   vercel --prod
   ```

2. **Backend to Railway:**
   - Connect GitHub repository
   - Set environment variables
   - Deploy automatically

### Option B: Docker Deployment
```dockerfile
# Dockerfile for backend
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY ./publish .
ENTRYPOINT ["dotnet", "WebApp.dll"]
```

### Option C: Azure/AWS Deployment
- Use Azure App Service or AWS Elastic Beanstalk
- Configure environment variables
- Set up SSL certificates

## 5. Domain Configuration

### Update CORS for Production
In `Program.cs`, update allowed origins:
```csharp
policy.WithOrigins(
    "http://localhost:5175", 
    "https://your-domain.com",
    "https://app.your-domain.com"
)
```

## 6. Post-Deployment Testing

### Test Complete Workflow:
1. **User Registration/Login** ✅
2. **Project Creation** ✅
3. **Testimonial Collection** ✅
4. **Video Upload** ✅
5. **Admin Approval** ✅
6. **Embed Wall Display** ✅
7. **Code Generator** ✅

### Test API Endpoints:
- `GET /health` - Health check
- `POST /api/projects` - Create project
- `GET /api/projects` - List projects
- `GET /api/wall/{slug}` - Public testimonial wall
- `POST /api/testimonials` - Submit testimonial

## 7. Monitoring and Analytics

### Set up monitoring:
- Application Insights (Azure)
- Sentry for error tracking
- Google Analytics for usage
- Supabase Analytics for database metrics

## 8. Security Checklist

- ✅ HTTPS enabled
- ✅ JWT tokens properly configured
- ✅ Row Level Security (RLS) enabled
- ✅ CORS properly configured
- ✅ Environment variables secured
- ✅ Database connection strings encrypted

## 9. Performance Optimization

### Frontend:
- ✅ Code splitting implemented
- ✅ Image optimization
- ✅ CDN for static assets
- ✅ Lazy loading for components

### Backend:
- ✅ Database indexes created
- ✅ Connection pooling
- ✅ Caching strategy
- ✅ API rate limiting

## 10. Backup and Recovery

### Database Backups:
- Supabase automatic backups enabled
- Export schema regularly
- Test restore procedures

### Code Backups:
- GitHub repository
- Tagged releases
- Deployment rollback strategy

---

## 🎉 Congratulations!

Your TrustLoops application is now production-ready with:
- ✅ Complete testimonial collection system
- ✅ Video recording and upload
- ✅ Admin dashboard
- ✅ Public embed walls
- ✅ Interactive code generator
- ✅ Responsive design
- ✅ Professional UI/UX
- ✅ Production database schema
- ✅ Security best practices

**Ready for real-world deployment!** 🚀
