# ShotLoops - Screenshot Automation & Mockup Generation

## 🎯 Goal (Why it exists)

Automate the boring part of publishing screenshots: drop an image, get back a polished mock-up (device frame, gradient, caption) ready for App Store screenshots, social posts, or product docs.

## 🔄 High-Level Workflow

### 1. **Submit a screenshot** 
Via web form or API POST with image/URL + template choice.

### 2. **Queued job** 
Backend stores job in DB, worker (Playwright headless browser) renders the screenshot into the chosen HTML/CSS template, exports PNG.

### 3. **Download** 
User polls `/api/shots/{id}` or receives webhook when status=finished, then downloads the PNG.

### 4. **Batch mode** 
Upload a ZIP or call the API in a loop; jobs process in parallel; optional ZIP of outputs.

### 5. **Billing** 
Free 10 renders/day; paid tier counts renders and charges via LemonSqueezy usage licensing.

## 👤 How the user interacts

### **No-code user:**
1. **Log in** → Visit ShotLoops dashboard
2. **Upload screenshot** → Drag & drop or browse for image file
3. **Pick template** → Choose "MacBook Pro frame", "iPhone Dark", "Gradient Background"
4. **Wait progress** → Watch progress bar (usually 10-30 seconds)
5. **Click Download** → Get polished PNG ready for marketing
6. **Done** → Use in App Store, social media, or website

### **Developer:**
```bash
# Single screenshot
curl -F file=@screen.png \
     -F template=iphone_dark \
     -F caption="Amazing new feature!" \
     https://api.trustloops.app/api/shots

# Response: {"id": "abc123", "status": "processing"}

# Poll until ready
curl https://api.trustloops.app/api/shots/abc123
# Response: {"status": "completed", "download_url": "https://..."}

# Use in marketing site
<img src="download_url" alt="Feature screenshot" />
```

## 🛠️ Technical Stack

### Frontend (React + TypeScript)
- **Upload Interface**: Drag & drop with progress bars
- **Template Gallery**: Visual template picker with previews
- **Job Dashboard**: Track rendering progress and history
- **Batch Tools**: Multi-upload and ZIP processing

### Backend (ASP.NET Core + Background Workers)
- **Upload API**: Handle image uploads and validation
- **Job Queue**: Redis/Database queue for render jobs
- **Playwright Engine**: Headless browser for screenshot rendering
- **Template Engine**: HTML/CSS templates with variable injection

### Database (Supabase/PostgreSQL)
```sql
shot_jobs (id, user_id, status, template, input_url, output_url, created_at)
templates (id, name, preview_url, html_template, css_styles)
usage_tracking (user_id, date, renders_count, plan_limit)
```

## 🎨 Template Categories

### **Device Mockups**
- 📱 **iPhone Frames**: All iPhone models (13, 14, 15) in various colors
- 💻 **MacBook Frames**: MacBook Air/Pro with realistic shadows
- 🖥️ **iMac Displays**: Desktop computer mockups
- ⌚ **Apple Watch**: Circular watch face templates
- 📱 **Android Devices**: Samsung, Pixel device frames

### **Background Styles**
- 🌈 **Gradient Backgrounds**: Trendy gradient combinations
- 🏞️ **Scene Mockups**: Coffee shop, office desk, outdoor settings
- ✨ **Floating Elements**: Screenshots with drop shadows and effects
- 🎯 **Minimalist**: Clean white/dark backgrounds with subtle effects

### **Marketing Templates**
- 📊 **Before/After**: Side-by-side comparison layouts
- 🔤 **Captioned**: Screenshots with overlay text and calls-to-action
- 📱 **App Store**: Official App Store screenshot dimensions and styles
- 🐦 **Social Media**: Twitter, LinkedIn, Instagram optimized sizes

## 🚀 Key Features

### **For Content Creators**
- ✅ **Instant Polish**: Raw screenshots → Professional mockups in seconds
- ✅ **Brand Consistency**: Custom templates with company branding
- ✅ **Batch Processing**: Process 50+ screenshots at once
- ✅ **Multiple Formats**: PNG, JPG, WebP output options
- ✅ **Custom Dimensions**: Any size for specific platforms

### **For Developers**
- ✅ **REST API**: Integrate into CI/CD pipelines
- ✅ **Webhooks**: Get notified when renders complete  
- ✅ **Bulk Operations**: Process entire screenshot folders
- ✅ **Template Customization**: Upload custom HTML/CSS templates
- ✅ **Usage Analytics**: Track render consumption and costs

### **For Agencies**
- ✅ **Client Branding**: White-label templates for client work
- ✅ **Team Collaboration**: Shared template libraries
- ✅ **Client Access**: Invite clients to upload their own screenshots
- ✅ **Usage Reporting**: Bill clients based on actual usage
- ✅ **Priority Processing**: Faster rendering for paid accounts

## 📊 Current Implementation Status

### 📋 **Planned Features** (Not Yet Built)
- Basic web upload interface
- Template selection system  
- Playwright rendering engine
- Job queue and progress tracking
- API endpoints for developers
- Usage tracking and billing integration
- Basic device frame templates

### 🎯 **Priority Development Order**
1. **Core Upload/Render Pipeline**: Basic screenshot → template → output
2. **Template System**: 5-10 popular device frames and backgrounds
3. **Web Interface**: Simple upload form with template picker
4. **API Development**: REST endpoints for developer integration
5. **Batch Processing**: Handle multiple screenshots efficiently
6. **Billing Integration**: Usage tracking with LemonSqueezy

## 🌐 User Flow Examples

### **SaaS Marketing Team Flow**
```
Marketing manager uploads 10 app screenshots → 
Selects "MacBook Pro + Gradient" template → 
Adds captions like "New Dashboard View" → 
Downloads polished PNG files → 
Uses in landing page hero section → 
Conversion rate improves with professional visuals 📈
```

### **App Developer Flow**
```
iOS developer takes iPhone screenshots → 
Runs ShotLoops CLI tool in terminal → 
Processes all screenshots with "App Store" template → 
Gets perfectly sized images for App Store submission → 
Uploads to App Store Connect → 
App approval process smoother with professional screenshots ✅
```

### **Social Media Manager Flow**
```
Social media manager screenshots new features → 
Uses "Instagram Story" template with branded colors → 
Adds call-to-action text overlay → 
Downloads optimized images → 
Posts to Instagram/LinkedIn → 
Higher engagement with professional-looking content 📱
```

## 🔧 Template Development

### **HTML Template Structure**
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    .device-frame { /* MacBook styling */ }
    .screenshot { /* Screenshot positioning */ }
    .background { /* Gradient/pattern */ }
    .caption { /* Text overlay */ }
  </style>
</head>
<body>
  <div class="background">
    <div class="device-frame">
      <img class="screenshot" src="{{SCREENSHOT_URL}}" />
    </div>
    <div class="caption">{{CAPTION_TEXT}}</div>
  </div>
</body>
</html>
```

### **Variable Injection**
```javascript
// Template variables that users can customize
{
  "SCREENSHOT_URL": "uploaded_image.png",
  "CAPTION_TEXT": "Amazing new feature!",
  "BRAND_COLOR": "#007AFF",
  "BACKGROUND_STYLE": "gradient-blue",
  "DEVICE_COLOR": "space-gray"
}
```

## 💰 Pricing Strategy

### **Free Tier**
- 10 renders per day
- Basic device templates (iPhone, MacBook)
- Standard processing speed
- ShotLoops watermark
- Community support

### **Pro Tier** (€9/month)
- 500 renders per month
- All premium templates
- Priority processing (2x faster)
- No watermarks
- Custom caption styling
- Email support

### **Developer Tier** (€29/month)
- 2,000 renders per month
- Full API access
- Webhook notifications
- Custom template uploads
- Batch processing tools
- Priority support

### **Enterprise** (Custom pricing)
- Unlimited renders
- White-label solution
- Custom integrations
- Dedicated support
- SLA guarantees
- On-premise deployment

## 🔌 API Examples

### **Simple Screenshot Render**
```bash
POST /api/shots
Content-Type: multipart/form-data

{
  "file": [binary image data],
  "template": "iphone_15_pro",
  "caption": "New login screen",
  "background": "gradient_blue"
}

Response:
{
  "id": "shot_abc123",
  "status": "queued",
  "estimated_completion": "2025-01-20T14:35:00Z"
}
```

### **Check Render Status**
```bash
GET /api/shots/shot_abc123

Response:
{
  "id": "shot_abc123", 
  "status": "completed",
  "download_url": "https://cdn.shotloops.com/renders/abc123.png",
  "thumbnail_url": "https://cdn.shotloops.com/thumbs/abc123.jpg",
  "created_at": "2025-01-20T14:30:00Z",
  "completed_at": "2025-01-20T14:34:23Z"
}
```

### **Batch Processing**
```bash
POST /api/shots/batch
Content-Type: multipart/form-data

{
  "files": [file1.png, file2.png, file3.png],
  "template": "macbook_pro",
  "output_format": "zip"
}

Response:
{
  "batch_id": "batch_xyz789",
  "job_count": 3,
  "status": "processing",
  "download_url": null  // Available when completed
}
```

## 📈 Success Metrics

### **Time Savings**
- ⏰ **Manual Process**: 5-10 minutes per screenshot in Photoshop
- ⚡ **ShotLoops**: 30 seconds per screenshot + zero design skills needed
- 📊 **ROI**: $50/hour designer time → $0.10 per render

### **Quality Improvement**
- 🎨 **Professional Polish**: Consistent, branded mockups
- 📱 **Platform Optimization**: Perfect dimensions for each use case
- 🔄 **Iteration Speed**: Try multiple templates instantly
- ✨ **Brand Consistency**: Templates ensure uniform styling

---

*ShotLoops eliminates the tedious screenshot styling work that every product team faces, turning raw screenshots into marketing-ready assets in seconds, not hours.*
