using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using WebApp.Services;
using Infrastructure.Extensions;
using Shared.Models;

var builder = WebApplication.CreateBuilder(args);

Console.WriteLine("=== TrustLoops Application Startup ===");

// Step 1: Add basic services
Console.WriteLine("Adding basic services...");
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Step 2: Configure CORS
Console.WriteLine("Configuring CORS...");
builder.Services.AddCors(options =>
{
    options.AddPolicy("DefaultPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "https://trustloops.com")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Step 3: Configure JWT Authentication with safe fallback
Console.WriteLine("Configuring Authentication...");
var jwtSecret = builder.Configuration["Supabase:JwtSecret"] ?? "default-development-secret-for-testing-purposes-only";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = "http://127.0.0.1:54321/auth/v1",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
    });

builder.Services.AddAuthorization();

// Step 4: Add Application Services
Console.WriteLine("Adding Application Services...");
builder.Services.AddScoped<TestimonialService>();
builder.Services.AddScoped<ProjectService>();  
builder.Services.AddScoped<UserService>();

// Step 5: Add Infrastructure services
Console.WriteLine("Adding Infrastructure services...");
try
{
    builder.Services.AddInfrastructure(builder.Configuration);
    Console.WriteLine("Infrastructure services registered successfully");
}
catch (Exception ex)
{
    Console.WriteLine($"Warning: Infrastructure services registration failed: {ex.Message}");
}

Console.WriteLine("Building application...");
var app = builder.Build();

// Configure the HTTP request pipeline
Console.WriteLine("Configuring HTTP pipeline...");
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("DefaultPolicy");
app.UseAuthentication();
app.UseAuthorization();

// Health check endpoint
app.MapGet("/health", () => Results.Ok("healthy"))
   .WithTags("Health");

// Project endpoints
Console.WriteLine("Adding Project API endpoints...");
app.MapGet("/api/projects", async (HttpContext context, ProjectService projectService) =>
{
    try
    {
        // Extract user ID from JWT claims for now, we'll use a test user ID
        var testUserId = Guid.Parse("3908b701-dea7-4430-ba7b-6688e0e58127");
        
        var result = await projectService.GetUserProjectsAsync(testUserId);
        
        if (result.IsSuccess)
        {
            return Results.Ok(result.Value);
        }
        
        return Results.BadRequest(result.Errors.FirstOrDefault()?.Message ?? "Failed to get projects");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error in GET /api/projects: {ex.Message}");
        return Results.Problem("Internal server error");
    }
})
.WithTags("Projects");

app.MapPost("/api/projects", async (CreateProjectRequest request, ProjectService projectService) =>
{
    try
    {
        // Use test user ID for now
        request.UserId = Guid.Parse("3908b701-dea7-4430-ba7b-6688e0e58127");
        
        var result = await projectService.CreateProjectAsync(request);
        
        if (result.IsSuccess)
        {
            return Results.Created($"/api/projects/{result.Value.Id}", result.Value);
        }
        
        return Results.BadRequest(result.Errors.FirstOrDefault()?.Message ?? "Failed to create project");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error in POST /api/projects: {ex.Message}");
        return Results.Problem("Internal server error");
    }
})
.WithTags("Projects");

// Get project by slug
app.MapGet("/api/projects/{slug}", async (string slug, ProjectService projectService) =>
{
    try
    {
        var result = await projectService.GetProjectBySlugAsync(slug);
        
        if (result.IsSuccess)
        {
            return Results.Ok(result.Value);
        }
        
        return Results.NotFound("Project not found");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error in GET /api/projects/{slug}: {ex.Message}");
        return Results.Problem("Internal server error");
    }
})
.WithTags("Projects");

// Testimonial endpoints
Console.WriteLine("Adding Testimonial API endpoints...");
app.MapPost("/api/testimonials", async (CreateTestimonialRequest request, TestimonialService testimonialService) =>
{
    try
    {
        var result = await testimonialService.CreateTestimonialAsync(request);
        
        if (result.IsSuccess)
        {
            return Results.Created($"/api/testimonials/{result.Value.Id}", result.Value);
        }
        
        return Results.BadRequest(result.Errors.FirstOrDefault()?.Message ?? "Failed to create testimonial");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error in POST /api/testimonials: {ex.Message}");
        return Results.Problem("Internal server error");
    }
})
.WithTags("Testimonials");

app.MapGet("/api/projects/{projectId}/testimonials", async (Guid projectId, TestimonialService testimonialService) =>
{
    try
    {
        var result = await testimonialService.GetApprovedTestimonialsByProjectAsync(projectId);
        
        if (result.IsSuccess)
        {
            return Results.Ok(result.Value);
        }
        
        return Results.BadRequest(result.Errors.FirstOrDefault()?.Message ?? "Failed to get testimonials");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error in GET /api/projects/{projectId}/testimonials: {ex.Message}");
        return Results.Problem("Internal server error");
    }
})
.WithTags("Testimonials");

// Public Embed Wall endpoint - doesn't require authentication
app.MapGet("/api/wall/{projectSlug}", async (string projectSlug, ProjectService projectService, TestimonialService testimonialService) =>
{
    try
    {
        // Get project by slug (public endpoint)
        var projectResult = await projectService.GetProjectBySlugAsync(projectSlug);
        if (!projectResult.IsSuccess)
        {
            return Results.NotFound("Project not found");
        }
        
        var project = projectResult.Value;
        
        // Get approved testimonials for the project
        var testimonialsResult = await testimonialService.GetApprovedTestimonialsByProjectAsync(project.Id);
        
        var wallData = new
        {
            project = new
            {
                id = project.Id,
                name = project.Name,
                slug = project.Slug,
                description = project.Description,
                callToAction = project.CallToAction,
                createdAt = project.CreatedUtc
            },
            testimonials = testimonialsResult.IsSuccess ? testimonialsResult.Value : new List<Testimonial>()
        };
        
        return Results.Ok(wallData);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error in GET /api/wall/{projectSlug}: {ex.Message}");
        return Results.Problem("Internal server error");
    }
})
.WithTags("Wall")
.AllowAnonymous(); // This endpoint should be public

try
{
    Console.WriteLine("=== Starting TrustLoops WebApp ===");
    app.Run();
}
catch (Exception ex)
{
    Console.WriteLine($"Application terminated unexpectedly: {ex.Message}");
}

// Make Program class accessible for testing
public partial class Program { }
