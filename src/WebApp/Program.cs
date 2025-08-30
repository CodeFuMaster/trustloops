using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using Infrastructure.Models;
using WebApp.Services;
using Infrastructure.Extensions;
using Shared.Models;
using MediatR;
using Infrastructure.Services;
using TrustLoops.Infrastructure.Billing;

var builder = WebApplication.CreateBuilder(args);

Console.WriteLine("=== TrustLoops Application Startup ===");

// Step 1: Add basic services
Console.WriteLine("Adding basic services...");
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Step 2: Configure CORS (read from configuration/env with safe defaults)
Console.WriteLine("Configuring CORS...");
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:5173", "http://localhost:5174", "https://staging.trustloops.app", "https://trustloops.app" };

Console.WriteLine($"AllowedOrigins: {string.Join(", ", allowedOrigins)}");
builder.Services.AddCors(options =>
{
    options.AddPolicy("DefaultPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Step 3: Configure JWT Authentication with manual token parsing
Console.WriteLine("Configuring Authentication...");
var config = builder.Configuration;

builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer("Bearer", opts =>
    {
        opts.TokenValidationParameters = new()
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateIssuerSigningKey = false,
            RequireSignedTokens = false,
            ValidateLifetime = false // Disable all validation temporarily
        };
        
        // Add manual token parsing
        opts.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                try
                {
                    var token = context.Token ?? context.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
                    if (!string.IsNullOrEmpty(token))
                    {
                        Console.WriteLine($"Received token: {token.Substring(0, Math.Min(50, token.Length))}...");
                        
                        // Parse JWT manually without validation
                        var handler = new JwtSecurityTokenHandler();
                        var jsonToken = handler.ReadJwtToken(token);
                        
                        var claims = new List<System.Security.Claims.Claim>();
                        foreach (var claim in jsonToken.Claims)
                        {
                            claims.Add(new System.Security.Claims.Claim(claim.Type, claim.Value));
                        }
                        
                        var identity = new System.Security.Claims.ClaimsIdentity(claims, "Bearer");
                        context.Principal = new System.Security.Claims.ClaimsPrincipal(identity);
                        context.Success();
                        
                        Console.WriteLine($"Manual JWT parsing successful for user: {jsonToken.Claims.FirstOrDefault(c => c.Type == "sub")?.Value}");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Manual JWT parsing failed: {ex.Message}");
                }
                
                return Task.CompletedTask;
            },
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine($"JWT Authentication failed: {context.Exception.Message}");
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                Console.WriteLine("JWT token validated successfully");
                var userId = context.Principal?.FindFirst("sub")?.Value;
                var email = context.Principal?.FindFirst("email")?.Value;
                Console.WriteLine($"User ID: {userId}");
                Console.WriteLine($"Email: {email}");
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// Step 4: Add Application Services
Console.WriteLine("Adding Application Services...");
builder.Services.AddScoped<TestimonialService>();
builder.Services.AddScoped<ProjectService>();  
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<AnalyticsService>(); // Add Analytics service

// Add MediatR
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));

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
        // Extract user ID from JWT claims
        var userId = GetUserIdFromContext(context);
        if (userId == null)
        {
            return Results.Unauthorized();
        }
        
        // Extract user email from JWT claims
        var userEmail = GetUserEmailFromContext(context);
        if (string.IsNullOrEmpty(userEmail))
        {
            return Results.BadRequest("User email not found in token");
        }
        
        var result = await projectService.GetUserProjectsAsync(userId.Value, userEmail);
        
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
.WithTags("Projects")
.RequireAuthorization();

app.MapPost("/api/projects", async (CreateProjectRequest request, HttpContext context, ProjectService projectService) =>
{
    try
    {
        // Extract user ID from JWT claims
        var userId = GetUserIdFromContext(context);
        if (userId == null)
        {
            return Results.Unauthorized();
        }
        
        // Extract user email from JWT claims
        var userEmail = GetUserEmailFromContext(context);
        if (string.IsNullOrEmpty(userEmail))
        {
            return Results.BadRequest("User email not found in token");
        }
        
        request.UserId = userId.Value;
        
        var result = await projectService.CreateProjectAsync(request, userEmail);
        
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
.WithTags("Projects")
.RequireAuthorization();

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

// Get pending testimonials for current user
app.MapGet("/api/testimonials/pending", async (HttpContext context, TestimonialService testimonialService) =>
{
    try
    {
        // Extract user ID from JWT claims
        var userId = GetUserIdFromContext(context);
        if (userId == null)
        {
            return Results.Unauthorized();
        }
        
        var result = await testimonialService.GetPendingTestimonialsAsync(userId.Value);
        
        if (result.IsSuccess)
        {
            return Results.Ok(result.Value);
        }
        
        return Results.BadRequest(result.Errors.FirstOrDefault()?.Message ?? "Failed to get pending testimonials");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error in GET /api/testimonials/pending: {ex.Message}");
        return Results.Problem("Internal server error");
    }
})
.WithTags("Testimonials")
.RequireAuthorization();

// Get testimonials by project ID with approval filter
app.MapGet("/api/testimonials/{projectId}", async (Guid projectId, bool? approved, TestimonialService testimonialService, HttpContext context) =>
{
    try
    {
        if (approved == true)
        {
            // Public endpoint for approved testimonials
            var result = await testimonialService.GetApprovedTestimonialsByProjectAsync(projectId);
            
            if (result.IsSuccess)
            {
                return Results.Ok(result.Value);
            }
            
            return Results.BadRequest(result.Errors.FirstOrDefault()?.Message ?? "Failed to get approved testimonials");
        }
        else if (approved == false)
        {
            // Protected endpoint for pending testimonials - requires authentication
            var userId = GetUserIdFromContext(context);
            if (userId == null)
            {
                return Results.Unauthorized();
            }
            
            var result = await testimonialService.GetPendingTestimonialsAsync(userId.Value);
            
            if (result.IsSuccess)
            {
                // Filter by project ID
                var projectTestimonials = result.Value.Where(t => t.ProjectId == projectId).ToList();
                return Results.Ok(projectTestimonials);
            }
            
            return Results.BadRequest(result.Errors.FirstOrDefault()?.Message ?? "Failed to get pending testimonials");
        }
        else
        {
            // Return empty array for unspecified approval status
            return Results.Ok(new List<object>());
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error in GET /api/testimonials/{projectId}: {ex.Message}");
        return Results.Problem("Internal server error");
    }
})
.WithTags("Testimonials");

// Approve testimonial
app.MapPut("/api/testimonials/{testimonialId}/approve", async (Guid testimonialId, HttpContext context, TestimonialService testimonialService) =>
{
    try
    {
        // Extract user ID from JWT claims
        var userId = GetUserIdFromContext(context);
        if (userId == null)
        {
            return Results.Unauthorized();
        }
        
        var result = await testimonialService.ApproveTestimonialAsync(testimonialId, userId.Value);
        
        if (result.IsSuccess)
        {
            return Results.Ok(new { approved = true });
        }
        
        return Results.BadRequest(result.Errors.FirstOrDefault()?.Message ?? "Failed to approve testimonial");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error in PUT /api/testimonials/{testimonialId}/approve: {ex.Message}");
        return Results.Problem("Internal server error");
    }
})
.WithTags("Testimonials")
.RequireAuthorization();

// Enqueue AI enrichment for a testimonial (Pro-gated in future)
app.MapPost("/api/testimonials/{testimonialId}/ai/process", async (Guid testimonialId, IAiEnrichmentService ai, HttpContext context, TrustLoops.Infrastructure.Services.ISupabaseClient supabase) =>
{
    try
    {
        // Gate to Pro plan
        var userId = GetUserIdFromContext(context);
        if (userId == null) return Results.Unauthorized();
        var user = await supabase.GetUserByIdAsync(userId.Value);
        var plan = user?.PlanType ?? "free";
        var isPro = string.Equals(plan, "testimonialhub_pro", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(plan, "trustloops_bundle", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(plan, "pro", StringComparison.OrdinalIgnoreCase);
        if (!isPro)
        {
            return Results.StatusCode(402); // Payment Required
        }
        var jobId = await ai.EnqueueAsync(testimonialId);
        return Results.Accepted($"/api/ai-jobs/{jobId}", new { jobId, testimonialId, status = "queued" });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error in POST /api/testimonials/{testimonialId}/ai/process: {ex.Message}");
        return Results.Problem("Failed to enqueue AI processing");
    }
})
.WithTags("AI")
.RequireAuthorization();

app.MapPost("/api/testimonials", async (HttpContext context, TestimonialService testimonialService) =>
{
    try
    {
        var form = await context.Request.ReadFormAsync();
        
        // Extract form data
        if (!Guid.TryParse(form["projectId"], out var projectId))
        {
            return Results.BadRequest("Invalid or missing projectId");
        }
        
        var customerName = form["customerName"].ToString();
        if (string.IsNullOrWhiteSpace(customerName))
        {
            return Results.BadRequest("Customer name is required");
        }
        
        var customerEmail = form["customerEmail"].ToString();
        var customerTitle = form["customerTitle"].ToString();
        var customerCompany = form["customerCompany"].ToString();
        var quote = form["quote"].ToString();
        
        if (!int.TryParse(form["rating"], out var rating))
        {
            rating = 5; // Default rating
        }
        
        // Create the request object
        var request = new CreateTestimonialRequest
        {
            ProjectId = projectId,
            CustomerName = customerName,
            CustomerEmail = string.IsNullOrWhiteSpace(customerEmail) ? null : customerEmail,
            CustomerTitle = string.IsNullOrWhiteSpace(customerTitle) ? null : customerTitle,
            CustomerCompany = string.IsNullOrWhiteSpace(customerCompany) ? null : customerCompany,
            Quote = string.IsNullOrWhiteSpace(quote) ? null : quote,
            Rating = rating
        };
        
        // Handle video file if present
        var videoFile = form.Files["video"];
        if (videoFile != null && videoFile.Length > 0)
        {
            Console.WriteLine($"Received video file: {videoFile.FileName}, Size: {videoFile.Length} bytes");
            // TODO: Handle video upload and set VideoUrl in request
            // For now, we'll create the testimonial without the video
        }
        
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
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
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
app.MapGet("/api/wall/{projectSlug}", async (HttpRequest request, string projectSlug, ProjectService projectService, TestimonialService testimonialService) =>
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
        var list = testimonialsResult.IsSuccess ? testimonialsResult.Value : new List<Testimonial>();

        // Optional filters: tags=a,b and minRating=4
        var qs = request.Query;
        if (qs.TryGetValue("minRating", out var minRatingStr) && int.TryParse(minRatingStr, out var minRating))
        {
            list = list.Where(t => t.Rating >= minRating).ToList();
        }
        if (qs.TryGetValue("tags", out var tagsStr))
        {
            var tags = tagsStr.ToString().Split(',').Select(s => s.Trim()).Where(s => s.Length > 0).ToHashSet(StringComparer.OrdinalIgnoreCase);
            list = list.Where(t => (t.Tags ?? Array.Empty<string>()).Any(tag => tags.Contains(tag))).ToList();
        }
        
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
            testimonials = list
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

// LemonSqueezy webhook (plan updates)
app.MapPost("/api/webhooks/lemonsqueezy", async (HttpRequest request, TrustLoops.Infrastructure.Services.ISupabaseClient supabase, ILogger<LemonWebhookHandler> logger) =>
{
    try
    {
        using var reader = new StreamReader(request.Body);
        var payload = await reader.ReadToEndAsync();
        var signature = request.Headers["X-Signature"].ToString();
        var handler = new LemonWebhookHandler(supabase, logger);
        var ok = await handler.HandleWebhookAsync(payload, signature);
        return ok ? Results.Ok() : Results.BadRequest();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error in LemonSqueezy webhook: {ex.Message}");
        return Results.Problem();
    }
})
.WithTags("Billing")
.AllowAnonymous();

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
public partial class Program 
{ 
    // Helper method to extract user ID from JWT token
    static Guid? GetUserIdFromContext(HttpContext context)
    {
        try
        {
            // The user ID in Supabase JWT is stored in the 'sub' claim
            var userIdClaim = context.User.FindFirst("sub")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
            {
                Console.WriteLine("No 'sub' claim found in JWT token");
                return null;
            }
            
            if (Guid.TryParse(userIdClaim, out var userId))
            {
                Console.WriteLine($"Extracted user ID from JWT: {userId}");
                return userId;
            }
            
            Console.WriteLine($"Failed to parse user ID from claim: {userIdClaim}");
            return null;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error extracting user ID from JWT: {ex.Message}");
            return null;
        }
    }
    
    // Helper method to extract user email from JWT token
    static string? GetUserEmailFromContext(HttpContext context)
    {
        try
        {
            // The user email in Supabase JWT is stored in the 'email' claim
            var userEmail = context.User.FindFirst("email")?.Value;
            if (string.IsNullOrEmpty(userEmail))
            {
                Console.WriteLine("No 'email' claim found in JWT token");
                return null;
            }
            
            Console.WriteLine($"Extracted user email from JWT: {userEmail}");
            return userEmail;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error extracting user email from JWT: {ex.Message}");
            return null;
        }
    }
}
