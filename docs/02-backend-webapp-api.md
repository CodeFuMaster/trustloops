# TrustLoops Backend WebApp (API)

## 🎯 Goal of the Application

The TrustLoops Backend WebApp is a high-performance ASP.NET Core Web API that serves as the central hub for all testimonial management operations. It handles authentication, data processing, file uploads, and provides a secure REST API for the frontend application.

## 🏗️ How the Workflow is Designed

### Architecture Overview
- **Technology Stack**: ASP.NET Core 8 + C#
- **Architecture Pattern**: Clean Architecture with CQRS (Command Query Responsibility Segregation)
- **API Style**: RESTful API with Minimal APIs
- **Authentication**: JWT Bearer Token validation
- **Database**: Supabase (PostgreSQL) with real-time features
- **File Storage**: AWS S3 for media uploads

### Key Components

#### 1. **API Layer (Endpoints)**
- **Testimonial Endpoints**: CRUD operations for testimonials
- **Project Endpoints**: Project management operations
- **User Endpoints**: User profile and authentication
- **Status Endpoints**: Health checks and system status
- **File Upload Endpoints**: Media handling for testimonials

#### 2. **Application Layer (Handlers)**
- **Command Handlers**: Process write operations (Create, Update, Delete)
- **Query Handlers**: Handle read operations (Get, List, Search)
- **MediatR Integration**: Decoupled request/response handling
- **Validation Logic**: Input validation and business rules

#### 3. **Infrastructure Layer**
- **Supabase Client**: Database operations and real-time subscriptions
- **Storage Services**: File upload and management
- **Email Services**: Notification and communication
- **Background Services**: Async processing and scheduled tasks

### Data Flow Architecture
```
Frontend Request → API Endpoint → MediatR Handler → Infrastructure Service → Database
                                        ↓
Frontend Response ← API Response ← Handler Result ← Service Response ← Database
```

### CQRS Pattern Implementation
```
Commands (Write Operations):
CreateTestimonial → CreateTestimonialHandler → Database Insert

Queries (Read Operations):
ListTestimonials → ListTestimonialsHandler → Database Select
```

## 🔧 How the System Works

### 1. **Authentication Flow**
- Frontend sends JWT token in Authorization header
- API validates token against Supabase authentication
- User identity extracted from token claims
- Request authorized based on user permissions

### 2. **Testimonial Processing**
- **Creation**: Validate input → Store in database → Process media uploads
- **Approval**: Admin reviews → Update status → Notify stakeholders
- **Display**: Query approved testimonials → Format response → Cache results

### 3. **Project Management**
- **Creation**: Generate unique project slug → Store project data → Create collection URL
- **Configuration**: Update settings → Apply to collection forms → Refresh public pages

### 4. **File Upload Handling**
- **Validation**: Check file type and size limits
- **Processing**: Optimize images/videos for web delivery
- **Storage**: Upload to AWS S3 with secure URLs
- **Database**: Store file metadata and access URLs

## 🛠️ API Endpoints Overview

### Testimonial Management
```http
GET    /api/testimonials              # List all testimonials
POST   /api/testimonials              # Create new testimonial
GET    /api/testimonials/{id}         # Get specific testimonial
PUT    /api/testimonials/{id}         # Update testimonial
DELETE /api/testimonials/{id}         # Delete testimonial
POST   /api/testimonials/{id}/approve # Approve testimonial
GET    /api/testimonials/wall/{slug}  # Get public testimonials
POST   /api/testimonials/bulk-approve # Bulk approve testimonials
GET    /api/testimonials/export       # Export testimonials
```

### Project Management
```http
GET    /api/projects                  # List user's projects
POST   /api/projects                  # Create new project
GET    /api/projects/{id}             # Get specific project
PUT    /api/projects/{id}             # Update project
DELETE /api/projects/{id}             # Delete project
GET    /api/projects/slug/{slug}      # Get project by slug
```

### User Management
```http
GET    /api/users/profile             # Get user profile
PUT    /api/users/profile             # Update user profile
GET    /api/users/stats               # Get user statistics
```

### File Upload
```http
POST   /api/upload/image              # Upload image file
POST   /api/upload/video              # Upload video file
GET    /api/upload/signed-url         # Get signed upload URL
```

### System Status
```http
GET    /api/status                    # System health check
GET    /api/status/database           # Database connectivity
GET    /api/status/storage            # Storage service status
```

## 🚀 Key Features

### Performance & Scalability
- **Async Operations**: All I/O operations are asynchronous
- **Connection Pooling**: Efficient database connection management
- **Response Caching**: Intelligent caching for frequently accessed data
- **Rate Limiting**: Prevents API abuse and ensures fair usage

### Security
- **JWT Authentication**: Secure token-based authentication
- **CORS Configuration**: Controlled cross-origin resource sharing
- **Input Validation**: Comprehensive input sanitization
- **SQL Injection Protection**: Parameterized queries and ORM protection
- **File Upload Security**: Virus scanning and type validation

### Data Management
- **Transaction Support**: ACID compliance for data integrity
- **Soft Deletes**: Data preservation with logical deletion
- **Audit Logging**: Track all data changes
- **Backup Integration**: Automated backup procedures

### Monitoring & Logging
- **Structured Logging**: Serilog integration with structured data
- **Error Tracking**: Comprehensive error logging and alerting
- **Performance Metrics**: API response time monitoring
- **Health Checks**: Automated system health monitoring

## 🔧 Configuration & Setup

### Running the Application
```bash
# Navigate to the WebApp directory
cd src/WebApp

# Restore NuGet packages
dotnet restore

# Build the application
dotnet build

# Run in development mode
dotnet run

# Run with specific profile
dotnet run --launch-profile https
```

### Environment Configuration
```json
{
  "Supabase": {
    "Url": "your-supabase-url",
    "ServiceKey": "your-service-key"
  },
  "JWT": {
    "SecretKey": "your-jwt-secret",
    "Issuer": "trustloops-api",
    "Audience": "trustloops-client"
  },
  "AWS": {
    "AccessKey": "your-aws-access-key",
    "SecretKey": "your-aws-secret-key",
    "BucketName": "trustloops-media"
  }
}
```

### Default Ports
- **HTTP**: http://localhost:5000
- **HTTPS**: https://localhost:5001
- **Swagger UI**: https://localhost:5001/swagger

## 📊 Request/Response Examples

### Create Testimonial
```http
POST /api/testimonials
Content-Type: application/json
Authorization: Bearer {jwt-token}

{
  "projectId": "123e4567-e89b-12d3-a456-426614174000",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "rating": 5,
  "content": "Excellent service!",
  "type": "text"
}
```

### Response
```json
{
  "id": "987fcdeb-51a2-43d7-b123-456789abcdef",
  "projectId": "123e4567-e89b-12d3-a456-426614174000",
  "customerName": "John Doe",
  "rating": 5,
  "content": "Excellent service!",
  "type": "text",
  "approved": false,
  "createdAt": "2025-01-15T10:30:00Z",
  "thumbnailUrl": null
}
```

## 🏗️ Development Workflow

### 1. **Adding New Features**
- Create command/query classes
- Implement handlers with business logic
- Add API endpoints
- Write unit tests
- Update documentation

### 2. **Database Changes**
- Create migration scripts
- Update domain models
- Modify repository interfaces
- Test data access layer

### 3. **Testing Strategy**
- **Unit Tests**: Test individual components
- **Integration Tests**: Test API endpoints
- **Performance Tests**: Load testing for scalability
- **Security Tests**: Vulnerability assessments

## 🔒 Security Implementation

### Authentication & Authorization
- **JWT Validation**: Verify token signature and expiration
- **Role-Based Access**: Different permissions for admin/user roles
- **Rate Limiting**: Prevent brute force attacks
- **HTTPS Enforcement**: All traffic encrypted in production

### Data Protection
- **Input Sanitization**: Clean all user inputs
- **Output Encoding**: Prevent XSS attacks
- **SQL Injection Prevention**: Parameterized queries
- **File Upload Validation**: Restrict file types and sizes

## 📈 Monitoring & Maintenance

### Logging
- **Application Logs**: Business logic and error tracking
- **Access Logs**: API request/response logging
- **Performance Logs**: Response time and resource usage
- **Security Logs**: Authentication and authorization events

### Health Monitoring
- **Database Health**: Connection and query performance
- **External Services**: Supabase and AWS service status
- **Memory Usage**: Application resource consumption
- **Error Rates**: Track and alert on error thresholds

---

*This backend API provides the core functionality for the TrustLoops testimonial management system, ensuring security, performance, and reliability.*
