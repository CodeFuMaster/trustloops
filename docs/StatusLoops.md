# StatusLoops - Simple Status Pages for Small Teams

## 🎯 Goal (Why it exists)

Give small teams a simple status page—public or private—so everyone knows when services are up, degraded, or under maintenance. Cheaper and more private than Statuspage/Instatus.

## 🔄 High-Level Workflow

### 1. **Spin up a page** 
Owner logs in, hits "New Status Page," names it, chooses Public vs Internal.

### 2. **Add components** 
Add entries such as API, Website, Database, Payment System.

### 3. **Post incidents** 
If something breaks, click "Create Incident," pick affected components, set status (Major Outage, Degraded), add Markdown description.

### 4. **Live updates** 
Team or customers watch the page; changes push instantly via websockets.

### 5. **Resolve** 
When fixed, click Resolve, status flips to Operational, subscribers get email notification.

## 👤 How the user interacts

### **Admins:**
- **Dashboard** → "Status Pages" tab → Manage incidents/components
- **Create Incident** → Select components → Set severity → Write update → Publish
- **Update Progress** → Edit incident → Add timeline updates → Notify subscribers
- **Resolve** → Mark incident as resolved → Send "All Clear" notification

### **Team/Visitors:**
- **Visit** status.yourcompany.app → Read incident timeline
- **Subscribe** → Enter email for incident notifications
- **Real-time** → Page updates automatically when status changes
- **History** → Browse past incidents and uptime statistics

## 🛠️ Technical Stack

### Frontend (React + TypeScript)
- **Public Status Page**: Clean, fast-loading status display
- **Admin Dashboard**: Incident management interface
- **Real-time Updates**: WebSocket connections for live updates
- **Mobile Responsive**: Works perfectly on all devices

### Backend (ASP.NET Core)
- **Status API**: RESTful endpoints for status management
- **WebSocket Hub**: Real-time notifications via SignalR
- **Email Service**: Automated incident notifications
- **Uptime Monitoring**: Basic ping/HTTP check system

### Database (Supabase/PostgreSQL)
```sql
status_pages (id, name, slug, is_public, owner_id)
components (id, page_id, name, status, description)
incidents (id, page_id, title, status, severity, created_at)
incident_updates (id, incident_id, message, status, created_at)
subscribers (id, page_id, email, verified)
```

## 🚀 Key Features

### **Status Page Management**
- ✅ **Public/Private Pages**: Choose visibility level
- ✅ **Custom Domains**: status.yourcompany.com
- ✅ **Component Tracking**: Monitor individual services
- ✅ **Incident Timeline**: Chronological incident history
- ✅ **Subscriber Notifications**: Email alerts for incidents

### **Incident Management**
- ✅ **Quick Incident Creation**: One-click incident reporting
- ✅ **Severity Levels**: Operational, Degraded, Partial Outage, Major Outage
- ✅ **Markdown Support**: Rich text incident descriptions
- ✅ **Timeline Updates**: Progressive incident resolution updates
- ✅ **Scheduled Maintenance**: Plan and communicate downtime

### **Monitoring & Analytics**
- 🚧 **Uptime Tracking**: Automated service monitoring
- 🚧 **Response Time Metrics**: Performance tracking
- 🚧 **Uptime Percentage**: 99.9% uptime calculations
- 🚧 **Historical Reports**: Monthly/yearly uptime reports

## 📊 Current Implementation Status

### ✅ **Completed Features**
- Basic status page creation and display
- Component management (add/edit services)
- Incident creation and management
- Public status page viewing
- Database schema and migrations
- Basic admin dashboard

### 🚧 **In Progress**
- Real-time WebSocket updates
- Email notification system
- Subscriber management
- Incident timeline updates
- Mobile responsive design

### 📋 **Planned Features**
- Automated uptime monitoring
- Custom status page themes
- API for external integrations
- Slack/Discord notifications
- Advanced analytics dashboard
- Multi-team access controls

## 🌐 User Flow Examples

### **SaaS Startup Flow**
```
Startup creates public status page → 
Adds API, Website, Database components → 
Database goes down → Creates "Major Outage" incident → 
Customers see status page instead of broken app → 
Updates incident with "Investigating" → "Fix deployed" → "Resolved" → 
Subscribers get email: "All systems operational" ✅
```

### **Internal Team Flow**
```
DevOps creates private status page → 
Adds all microservices as components → 
Payment service degrades → Creates incident → 
Team gets notified via email → 
Engineers check status page for context → 
Incident resolved, team informed → 
Post-mortem added to incident timeline 📋
```

### **Agency Client Flow**
```
Agency creates status page for client's app → 
Client's customers bookmark status.clientapp.com → 
Planned maintenance scheduled → 
Subscribers notified 24h in advance → 
Maintenance completed on time → 
Professional communication builds trust 🤝
```

## 🎨 Status Page Examples

### **Clean Public Page**
```
🟢 All Systems Operational

API Service          🟢 Operational
Website              🟢 Operational  
Database             🟢 Operational
Payment Processing   🟢 Operational

📊 99.98% uptime last 30 days

Recent Incidents:
• Jan 15 - Payment gateway timeout (Resolved)
• Jan 10 - Scheduled maintenance (Completed)

💌 Subscribe for updates: [email input] [Subscribe]
```

### **During Incident**
```
🟡 Partial Service Disruption

API Service          🟡 Degraded Performance
Website              🟢 Operational
Database             🟢 Operational
Payment Processing   🔴 Major Outage

🚨 Active Incident: Payment Processing Issues
Started: Jan 20, 2025 14:30 UTC
Status: Investigating

Timeline:
14:35 - We're aware of payment processing failures
14:42 - Engineering team investigating gateway issues
14:55 - Issue identified, deploying fix
15:10 - Fix deployed, monitoring recovery
```

## 📱 Getting Started - Quick Setup

### **For Developers**
```bash
# StatusLoops is part of TrustLoops monorepo
cd trustloops/src/WebApp

# Run with StatusLoops features enabled
dotnet run --environment StatusLoops

# Visit: http://localhost:5001/status
```

### **For Users**
1. **Login** to TrustLoops dashboard
2. **Navigate** to "Status Pages" tab
3. **Create** new status page
4. **Add components** (API, Website, etc.)
5. **Share** your status.yoursite.com URL
6. **Manage incidents** as needed

## 💰 Pricing Strategy

### **Free Tier**
- 1 public status page
- 3 components
- Basic incident management
- Email notifications
- StatusLoops branding

### **Pro Tier** (€5/month)
- 5 status pages (public + private)
- Unlimited components
- Custom domain support
- Advanced analytics
- No branding
- Priority support

### **Team Tier** (€15/month)
- Unlimited status pages
- Multi-user access
- Slack/Discord integrations
- API access
- White-label options
- SLA monitoring

## 🔧 Integration Examples

### **API Monitoring**
```javascript
// Auto-create incidents from monitoring
fetch('/api/status/incidents', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer TOKEN' },
  body: JSON.stringify({
    title: 'API Response Time Degraded',
    component_ids: ['api-service'],
    status: 'degraded',
    message: 'Response times above 2s threshold'
  })
})
```

### **Slack Integration**
```
/statusloops incident "Database connection issues" --component=database --severity=major
✅ Incident created: status.yourapp.com/incidents/123
🔔 Subscribers notified automatically
```

## 📈 Success Metrics

### **Customer Trust**
- 📞 **Reduced Support Tickets**: Customers check status page first
- 💬 **Proactive Communication**: Issues communicated before customers notice  
- 📊 **Transparency**: Open uptime statistics build confidence
- ⚡ **Faster Resolution**: Centralized incident communication

### **Team Efficiency**  
- 🎯 **Focused Communication**: One place for all status updates
- ⏰ **Time Savings**: No more individual customer emails during outages
- 📝 **Incident Documentation**: Automatic timeline for post-mortems
- 🔄 **Process Improvement**: Historical data helps prevent future issues

---

*StatusLoops provides the essential infrastructure monitoring and communication tools that every growing team needs, without the enterprise complexity and pricing.*
