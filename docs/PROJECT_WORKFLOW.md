# TrustLoops Project Workflow Guide

## What is TrustLoops?

TrustLoops is a testimonial collection and display platform that allows businesses to easily collect video and text testimonials from their customers and display them in beautiful testimonial walls that can be embedded on websites.

## How It Works

### 1. **User Authentication**
- Users log in using Supabase Magic Link authentication (passwordless email login)
- Simply enter your email address and click the magic link sent to your inbox
- The system uses JWT tokens to keep you logged in securely

### 2. **Dashboard - Project Management**
- After login, you land on the main Dashboard
- View all your testimonial collection projects
- Each project represents a product or service you want to collect testimonials for
- Sample project "Sample Product" is provided for testing

### 3. **Creating New Projects**
- Click "Create New Project" from the Dashboard
- Enter project name and description
- System automatically generates a unique "slug" (URL-friendly identifier)
- Each project gets a unique collection URL for customers

### 4. **Collecting Testimonials**

#### For Business Owners:
- **Copy Collection Link**: Get the unique URL to share with customers
- Share this link via email, social media, or your website
- Customers use this link to submit their testimonials

#### For Customers:
- Visit the collection link (e.g., `/record/sample-product`)
- Fill out testimonial form:
  - Name (required)
  - Email
  - Job title
  - Company
  - Written testimonial/quote
  - Star rating (1-5)
  - Optional video testimonial (recorded directly in browser)
- Submit testimonial for review

### 5. **Testimonial Management**

#### Review Process:
- All testimonials require approval before going live
- Dashboard shows "Pending Approval" section
- Business owners can review and approve/reject testimonials
- Only approved testimonials appear on the public wall

#### What You See:
- Customer name and contact information
- Written testimonial text
- Star rating
- Video testimonial (if provided)
- Submission date

### 6. **Testimonial Wall (Public Display)**

#### Accessing the Wall:
- Click "View Wall" button for any project
- Opens public testimonial wall (e.g., `/wall/sample-product`)
- Shows all approved testimonials in an attractive layout

#### Wall Features:
- Clean, professional display
- Shows customer names, companies, ratings
- Displays written testimonials
- Embeds video testimonials
- Responsive design works on all devices
- Can be embedded on your website

### 7. **Embedding on Your Website**

#### Widget Integration:
- Get embeddable widget code for your website
- Add JavaScript snippet to any webpage
- Testimonials automatically display on your site
- Customizable appearance and themes

## Technical Architecture

### Frontend (React + Vite)
- **Dashboard**: Project management interface
- **Video Recorder**: Customer testimonial submission
- **Testimonial Wall**: Public display of approved testimonials
- **Authentication**: Supabase-powered login system

### Backend (ASP.NET Core)
- **API Endpoints**: RESTful APIs for all operations
- **JWT Authentication**: Secure token-based auth
- **File Storage**: Video and media handling
- **Project Management**: CRUD operations for projects

### Database (Supabase)
- **Users**: Account information
- **Projects**: Testimonial collection projects
- **Testimonials**: Customer submissions and approvals
- **File Storage**: Videos and images

## Getting Started

1. **Sign Up/Login**
   - Visit the application
   - Enter your email address
   - Click the magic link in your email

2. **Create Your First Project**
   - Click "Create New Project"
   - Enter your product/service name
   - Add a description

3. **Share Collection Link**
   - Copy the collection link from your project
   - Share with customers via email or social media

4. **Manage Testimonials**
   - Review incoming testimonials in "Pending Approval"
   - Approve the ones you want to display publicly

5. **Display Testimonials**
   - Click "View Wall" to see your public testimonial wall
   - Embed the wall on your website using the widget code

## Current Status

### ✅ Completed Features:
- User authentication with Supabase Magic Links
- Project creation and management
- Testimonial submission form with video recording
- Approval workflow for testimonials
- Public testimonial wall display
- JWT token validation and user session management

### 🚧 In Development:
- Advanced theming and customization options
- Email notifications for new testimonials
- Analytics and reporting
- Advanced video processing and optimization

### 🎯 Planned Features:
- Social media sharing integration
- Advanced filtering and search
- Custom branding options
- API access for developers
- Advanced analytics dashboard

## Support

For questions or issues:
1. Check this documentation
2. Review the project logs in the backend
3. Ensure all services (Supabase, backend, frontend) are running
4. Check browser console for any JavaScript errors

---

*This document explains the complete workflow of TrustLoops in simple terms for users to understand how to use the platform effectively.*
