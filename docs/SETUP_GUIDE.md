# TrustLoops Setup Guide

## Prerequisites

1. **Node.js** (v18 or higher)
2. **pnpm** package manager
3. **.NET 8** SDK
4. **Supabase CLI** (optional but recommended)

## Installation Steps

### 1. Clone and Setup Repository
```bash
git clone https://github.com/CodeFuMaster/trustloops.git
cd trustloops
pnpm install
```

### 2. Environment Configuration

#### Frontend (.env.local in apps/web/)
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:5000
```

#### Backend (appsettings.json in src/WebApp/)
```json
{
  "Supabase": {
    "Url": "your_supabase_url",
    "Key": "your_supabase_anon_key",
    "JwtSecret": "your_jwt_secret"
  },
  "AllowedOrigins": ["http://localhost:5173"]
}
```

### 3. Start Supabase (Local Development)
```bash
cd supabase
supabase start
```

### 4. Start Backend Server
```bash
cd src/WebApp
dotnet run --urls "http://localhost:5000"
```

### 5. Start Frontend Server
```bash
cd apps/web
pnpm dev
```

## Access Points

- **Frontend Dashboard**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Supabase Studio**: http://localhost:54323
- **API Documentation**: http://localhost:5000/swagger

## Common Issues

### WSL2 IP Configuration
If using WSL2 for Supabase, update the IP address in frontend `.env.local`:
```env
VITE_SUPABASE_URL=http://172.x.x.x:54321
```

Find WSL2 IP with:
```bash
ip addr show eth0
```

### CORS Issues
Ensure backend `AllowedOrigins` includes your frontend URL.

### Authentication Issues
1. Check Supabase configuration in both frontend and backend
2. Verify JWT secret matches between Supabase and backend
3. Ensure magic link redirect URLs are properly configured

## Development Workflow

1. **Login**: Use magic link authentication with your email
2. **Dashboard**: View and manage projects
3. **Create Project**: Add new testimonial collection projects
4. **Collect Testimonials**: Share collection links with customers
5. **Approve/Review**: Manage incoming testimonials
6. **Display Wall**: View public testimonial walls

## File Structure

```
trustloops/
├── apps/
│   └── web/               # React frontend
├── src/
│   ├── WebApp/           # ASP.NET Core backend
│   ├── Infrastructure/    # Supabase integration
│   └── Shared/           # Shared models
├── docs/                 # Documentation
├── supabase/            # Database migrations
└── tests/               # Test files
```

---

*Last Updated: August 1, 2025*
