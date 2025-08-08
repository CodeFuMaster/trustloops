# TrustLoops Infrastructure Layer

## 🎯 Goal of the Application

The TrustLoops Infrastructure Layer is the foundation that connects the application to external services and manages all data operations. It provides a clean abstraction layer between the business logic and external dependencies like databases, file storage, email services, and third-party APIs.

## 🏗️ How the Workflow is Designed

### Architecture Overview
- **Technology Stack**: .NET 8 + C# with dependency injection
- **Pattern**: Repository and Service patterns
- **Database**: Supabase (PostgreSQL) integration
- **Storage**: AWS S3 for file management  
- **Email**: Integrated notification services
- **Background Jobs**: Async processing for long-running tasks

### Key Responsibilities
1. **Data Access**: All database operations and queries
2. **External Service Integration**: Third-party API communication
3. **File Management**: Upload, storage, and retrieval of media files
4. **Background Processing**: Async tasks and scheduled jobs
5. **Configuration Management**: Service setup and dependency injection

### Infrastructure Components

#### 1. **Services Layer**
- **SupabaseClient**: Direct database operations and real-time features
- **StorageService**: File upload and management (AWS S3)
- **EmailService**: Notification and communication
- **BillingService**: Payment processing integration

#### 2. **Repository Layer**
- **TestimonialRepository**: Testimonial data operations
- **ProjectRepository**: Project management data access
- **UserRepository**: User profile and authentication data

#### 3. **Background Services**
- **EmailWorker**: Async email processing
- **DataSyncWorker**: Periodic data synchronization
- **CleanupWorker**: Automated maintenance tasks

#### 4. **External Integrations**
- **Supabase Integration**: Real-time database and authentication
- **AWS S3 Integration**: Secure file storage and CDN
- **Payment Gateway**: Subscription and billing management

## 🔧 How the System Works

### Data Flow Architecture
```
Application Layer → Infrastructure Interface → Infrastructure Implementation → External Service
       ↓                      ↓                           ↓                        ↓
Business Logic → IRepository → Repository Class → Database/API Call → Response
```

### Service Registration Flow
```
Program.cs → AddInfrastructure() → Register Services → Dependency Injection Container
```

### Database Operations
1. **Connection Management**: Automatic connection pooling and management
2. **Query Execution**: Optimized queries with proper error handling
3. **Transaction Support**: ACID compliance for data integrity
4. **Real-time Updates**: Live data synchronization with Supabase

### File Storage Operations
1. **Upload Validation**: File type, size, and security checks
2. **Processing**: Image optimization and video transcoding
3. **Storage**: Secure upload to AWS S3 with organized folder structure
4. **Access**: Generated signed URLs for secure file access

## 🏗️ Service Implementations

### ISupabaseClient Interface
The main interface for all database operations:

```csharp
public interface ISupabaseClient
{
    // Project Operations
    Task<Project> CreateProjectAsync(string name, string description, Guid userId);
    Task<List<Project>> GetProjectsAsync(Guid userId);
    Task<Project?> GetProjectBySlugAsync(string slug);
    
    // Testimonial Operations  
    Task<Testimonial> CreateTestimonialAsync(CreateTestimonialRequest request);
    Task<List<Testimonial>> GetTestimonialsAsync(Guid projectId, bool? approved);
    Task<bool> ApproveTestimonialAsync(Guid id, bool approved);
    Task<bool> DeleteTestimonialAsync(Guid id);
    
    // File Operations
    Task<string> UploadFileAsync(string bucket, string fileName, Stream fileStream);
    Task<string> UploadVideoAsync(Stream fileStream, string fileName);
    
    // User Operations
    Task<SupabaseUser> UpsertUserDirectly(Guid id, string email);
}
```

### SupabaseClient Implementation
Concrete implementation that handles all database operations:

#### Key Features:
- **Error Handling**: Comprehensive error handling with logging
- **Performance Optimization**: Efficient queries and connection management
- **Security**: Parameterized queries and input validation
- **Transactions**: Support for complex multi-table operations

#### Example Operations:
```csharp
// Create testimonial with transaction support
public async Task<Testimonial> CreateTestimonialAsync(CreateTestimonialRequest request)
{
    // Validate input
    // Begin transaction
    // Insert testimonial
    // Process media uploads
    // Commit transaction
    // Return result
}

// Get testimonials with filtering and pagination
public async Task<List<Testimonial>> GetTestimonialsAsync(Guid projectId, bool? approved)
{
    // Build query with filters
    // Execute with proper ordering
    // Map to domain models
    // Return paginated results
}
```

## 🚀 Key Features

### Database Integration
- **Real-time Subscriptions**: Live updates from Supabase
- **Connection Pooling**: Efficient connection management
- **Query Optimization**: Fast, indexed queries
- **Schema Management**: Database migration support

### File Storage Management
- **Multi-format Support**: Images, videos, documents
- **Automatic Optimization**: Image compression and resizing
- **CDN Integration**: Fast global content delivery
- **Secure Access**: Time-limited signed URLs

### Background Processing
- **Async Operations**: Non-blocking long-running tasks
- **Queue Management**: Reliable task queuing system
- **Error Recovery**: Automatic retry mechanisms
- **Monitoring**: Task status and performance tracking

### Configuration Management
- **Environment Variables**: Secure configuration storage
- **Service Registration**: Automatic dependency injection setup
- **Health Checks**: Monitor external service connectivity
- **Fallback Mechanisms**: Graceful degradation when services are unavailable

## 🔧 Service Configuration

### Dependency Injection Setup
```csharp
public static IServiceCollection AddInfrastructure(
    this IServiceCollection services, 
    IConfiguration configuration)
{
    // Register Supabase client
    services.AddScoped<ISupabaseClient, SupabaseClient>();
    
    // Register repositories
    services.AddScoped<ITestimonialRepository, TestimonialRepository>();
    services.AddScoped<IProjectRepository, ProjectRepository>();
    services.AddScoped<IUserRepository, UserRepository>();
    
    // Register services
    services.AddScoped<IStorageService, AwsS3StorageService>();
    services.AddScoped<IEmailService, EmailService>();
    
    // Register background services
    services.AddHostedService<EmailWorker>();
    services.AddHostedService<DataSyncWorker>();
    
    return services;
}
```

### Configuration Requirements
```json
{
  "Supabase": {
    "Url": "https://your-project.supabase.co",
    "ServiceKey": "your-service-key",
    "MaxRetries": 3,
    "TimeoutSeconds": 30
  },
  "AWS": {
    "AccessKey": "your-access-key",
    "SecretKey": "your-secret-key", 
    "BucketName": "trustloops-storage",
    "Region": "us-east-1"
  },
  "Email": {
    "SmtpHost": "smtp.example.com",
    "SmtpPort": 587,
    "Username": "your-email@example.com",
    "Password": "your-password"
  }
}
```

## 📊 Data Models

### Supabase Models
Models that match the database schema:

```csharp
public class SupabaseUser
{
    public Guid Id { get; set; }
    public string Email { get; set; }
    public string? FullName { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; }
}

public class SupabaseProject  
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public string Slug { get; set; }
    public Guid UserId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class SupabaseTestimonial
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string CustomerName { get; set; }
    public string CustomerEmail { get; set; }
    public int Rating { get; set; }
    public string Content { get; set; }
    public string Type { get; set; }
    public bool Approved { get; set; }
    public string? ThumbnailUrl { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

## 🛠️ Background Services

### Email Worker
Processes email notifications asynchronously:

```csharp
public class EmailWorker : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            // Process email queue
            // Send notifications
            // Handle errors
            // Wait for next cycle
        }
    }
}
```

### Data Sync Worker
Keeps data synchronized between services:

```csharp
public class DataSyncWorker : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            // Sync user data
            // Update statistics
            // Clean up old data
            // Schedule next sync
        }
    }
}
```

## 🔒 Security Implementation

### Data Access Security
- **Parameterized Queries**: Prevent SQL injection
- **Input Validation**: Sanitize all inputs
- **Access Control**: Row-level security
- **Encryption**: Data at rest and in transit

### File Upload Security
- **File Type Validation**: Whitelist allowed file types
- **Size Limits**: Prevent oversized uploads
- **Virus Scanning**: Scan uploaded files
- **Secure Storage**: Encrypted storage with access controls

### API Security
- **Rate Limiting**: Prevent abuse
- **Authentication**: Verify all requests
- **Authorization**: Check permissions
- **Audit Logging**: Track all operations

## 📈 Monitoring & Diagnostics

### Logging
- **Structured Logging**: JSON-formatted logs with Serilog
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Query execution times
- **Business Events**: Track important business operations

### Health Checks
```csharp
public class SupabaseHealthCheck : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, 
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Test database connection
            // Check response times
            // Verify service availability
            return HealthCheckResult.Healthy();
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy(ex.Message);
        }
    }
}
```

## 🔧 Development & Testing

### Repository Pattern Benefits
- **Testability**: Easy mocking for unit tests
- **Maintainability**: Clear separation of concerns
- **Flexibility**: Easy to swap implementations
- **Consistency**: Standardized data access patterns

### Testing Strategy
- **Unit Tests**: Test individual service methods
- **Integration Tests**: Test external service connectivity
- **Performance Tests**: Load testing for database operations
- **Contract Tests**: Verify API contract compliance

### Local Development Setup
```bash
# Install dependencies
dotnet restore

# Run database migrations
dotnet ef database update

# Set up local configuration
cp appsettings.example.json appsettings.Development.json

# Run tests
dotnet test
```

---

*The Infrastructure Layer provides the robust foundation that powers the TrustLoops application, ensuring reliable data access, external service integration, and background processing capabilities.*
