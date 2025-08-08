# TrustLoops Monorepo – Quick-Start Guides (Plain English)

**Purpose**: Give any teammate (or your future self) a super-short explainer for what each app does, how it flows, and how end-users interact with it.

## 🏗️ The Three Products

### 1. **TestimonialHub** 📹
**Goal**: Help founders collect authentic video/text testimonials in minutes and display them on their site without touching code. More social proof → higher conversions → more sales.

**Quick Flow**: Create project → Share link → Customer records → Owner approves → Embed on website  
**Status**: ✅ **Active Development** - Core features working, polishing UX

---

### 2. **StatusLoops** 📊  
**Goal**: Give small teams a simple status page—public or private—so everyone knows when services are up, degraded, or under maintenance. Cheaper and more private than Statuspage/Instatus.

**Quick Flow**: Create status page → Add components → Post incidents → Live updates → Resolve  
**Status**: 🚧 **Partial Implementation** - Basic features done, real-time pending

---

### 3. **ShotLoops** 🖼️
**Goal**: Automate the boring part of publishing screenshots: drop an image, get back a polished mock-up (device frame, gradient, caption) ready for App Store screenshots, social posts, or product docs.

**Quick Flow**: Upload screenshot → Pick template → Process → Download polished mockup  
**Status**: 📋 **Planned** - Database schema ready, implementation pending

## � Repository Structure

```
TrustLoops/
├── apps/
│   └── web/                    # React frontend (all 3 products)
├── src/
│   ├── WebApp/                 # ASP.NET Core API (all 3 products)
│   ├── Infrastructure/         # Data access & external services
│   └── Shared/                 # Common models & DTOs
├── docs/                       # This documentation
│   ├── TestimonialHub.md       # 📹 Testimonial collection system
│   ├── StatusLoops.md          # 📊 Status page management  
│   └── ShotLoops.md            # 🖼️ Screenshot automation
├── supabase/                   # Database migrations & config
└── database/                   # Additional DB scripts
```

## 🔄 How Users Experience Each Product

### **TestimonialHub** (Active Users)
- **Business Owner**: Dashboard → Create project → Share collection link → Approve testimonials → Embed widget
- **Customer**: Click link → Record 30s video → Add text → Submit → Done

### **StatusLoops** (Partially Available)  
- **Admin**: Dashboard → Create status page → Add components → Manage incidents → Send updates
- **Team**: Visit status.company.com → Check service status → Subscribe to notifications

### **ShotLoops** (Coming Soon)
- **Designer**: Upload screenshots → Pick device template → Download polished mockups → Use in marketing
- **Developer**: API call with image → Get rendered mockup → Integrate into workflow

## 💰 Monetization Strategy

| Product | Free Tier | Pro Tier | Enterprise |
|---------|-----------|----------|------------|
| **TestimonialHub** | 5 testimonials | €9/mo - Unlimited | Custom pricing |
| **StatusLoops** | 1 status page | €5/mo - 5 pages | €15/mo - Unlimited |
| **ShotLoops** | 10 renders/day | €9/mo - 500/mo | €29/mo - 2000/mo |

## � Current Development Status

### ✅ **TestimonialHub** (80% Complete)
- ✅ User authentication & projects
- ✅ Testimonial submission & approval  
- ✅ Basic video recording
- ✅ Admin dashboard
- 🚧 Embed widget
- 🚧 Mobile optimization
- 📋 Advanced video editing

### 🚧 **StatusLoops** (40% Complete)
- ✅ Status page creation
- ✅ Component management
- ✅ Incident reporting
- 🚧 Real-time updates
- 🚧 Email notifications
- 📋 Uptime monitoring
- 📋 Custom domains

### 📋 **ShotLoops** (5% Complete)
- ✅ Database schema
- ✅ Basic API structure
- 📋 Template system
- 📋 Playwright rendering
- 📋 Web interface
- 📋 Batch processing

## �️ Quick Development Setup

### **Start Everything**
```bash
# Clone repo
git clone https://github.com/CodeFuMaster/trustloops.git
cd trustloops

# Backend API (all products)
cd src/WebApp
dotnet run
# → https://localhost:5001

# Frontend (all products)  
cd apps/web
npm install && npm run dev
# → http://localhost:5173

# Database
npx supabase start
# → Local Supabase instance
```

### **Environment Setup**
1. Copy `.env.example` → `.env.local` (frontend)
2. Update `appsettings.json` with Supabase keys (backend)
3. Run database migrations: `npx supabase db reset`

## 🎯 Next Steps Cheat-Sheet

### **If you're working on TestimonialHub:**
- ✅ Finish embed widget JavaScript
- ✅ Polish video recording UX
- ✅ Deploy to production (Fly.io + Vercel)

### **If you're starting StatusLoops:**
- 🚧 Implement WebSocket real-time updates
- 🚧 Build email notification system
- � Add uptime monitoring workers

### **If you're starting ShotLoops:**
- 📋 Build template system with HTML/CSS
- � Integrate Playwright for rendering
- 📋 Create upload interface

## 🤝 How to Contribute

### **For New Features**
1. Read the relevant product guide (TestimonialHub.md, StatusLoops.md, ShotLoops.md)
2. Check current implementation status
3. Pick a feature from the roadmap
4. Create feature branch: `git checkout -b feature/testimonial-embed-widget`

### **For Bug Fixes**
1. Reproduce the issue locally
2. Check if it affects one or multiple products
3. Create fix branch: `git checkout -b fix/video-upload-timeout`

### **Questions?**
- 💬 Ping step number in Slack
- 🐛 Open GitHub issue with label `question`
- 📖 Check the relevant product documentation first

---

**Last updated**: 2025-08-05  
**Active focus**: TestimonialHub production readiness + StatusLoops real-time features
