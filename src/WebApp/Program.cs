using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;
using Serilog;
using WebApp.Services;
using Infrastructure.Extensions;
using Infrastructure.Services;
using Shared.Models;
using Shared.Entities;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("DefaultPolicy", policy =>
    {
        policy.WithOrigins(builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? new[] { "http://localhost:5173" })
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Configure JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Supabase:Url"],
            ValidAudience = builder.Configuration["Supabase:Url"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Supabase:JwtSecret"] ?? throw new InvalidOperationException("JWT Secret not found")))
        };
    });

builder.Services.AddAuthorization();

// Register services
builder.Services.AddScoped<TestimonialService>();
builder.Services.AddScoped<ProjectService>();
builder.Services.AddScoped<UserService>();

// Register Infrastructure services
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

// Configure the HTTP request pipeline
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

// Testimonials endpoints
app.MapPost("/api/testimonials", async (
    HttpRequest request,
    ISupabaseClientWrapper supabaseClient,
    ILogger<Program> logger) =>
{
    try
    {
        if (!request.HasFormContentType)
        {
            return Results.BadRequest("Request must be multipart/form-data");
        }

        var form = await request.ReadFormAsync();
        
        // Extract form data
        var projectIdStr = form["projectId"].FirstOrDefault();
        var customerName = form["customerName"].FirstOrDefault();
        var customerEmail = form["customerEmail"].FirstOrDefault();
        var customerTitle = form["customerTitle"].FirstOrDefault();
        var customerCompany = form["customerCompany"].FirstOrDefault();
        var quote = form["quote"].FirstOrDefault();
        var ratingStr = form["rating"].FirstOrDefault();
        var videoFile = form.Files.GetFile("video");

        // Validation
        if (!Guid.TryParse(projectIdStr, out var projectId))
        {
            return Results.BadRequest("Invalid project ID");
        }

        if (string.IsNullOrWhiteSpace(customerName))
        {
            return Results.BadRequest("Customer name is required");
        }

        string? videoUrl = null;
        
        // Handle video upload if present
        if (videoFile != null && videoFile.Length > 0)
        {
            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(videoFile.FileName)}";
            
            using var stream = videoFile.OpenReadStream();
            var uploadResult = await supabaseClient.UploadAsync(stream, fileName);
            
            if (uploadResult.IsFailed)
            {
                logger.LogError("Video upload failed: {Error}", uploadResult.Errors.FirstOrDefault()?.Message);
                return Results.Problem("Failed to upload video");
            }
            
            // Get public URL from Supabase storage
            videoUrl = $"https://your-project.supabase.co/storage/v1/object/public/testimonials/videos/{fileName}";
        }

        // Create testimonial entity
        var testimonial = new Testimonial
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            CustomerName = customerName,
            CustomerEmail = customerEmail,
            CustomerTitle = customerTitle,
            CustomerCompany = customerCompany,
            Quote = quote,
            VideoUrl = videoUrl,
            Rating = int.TryParse(ratingStr, out var rating) ? rating : 5,
            Approved = false,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow
        };

        var createResult = await supabaseClient.CreateTestimonialAsync(testimonial);
        
        if (createResult.IsFailed)
        {
            logger.LogError("Failed to create testimonial: {Error}", createResult.Errors.FirstOrDefault()?.Message);
            return Results.Problem("Failed to create testimonial");
        }

        return Results.Created($"/api/testimonials/{createResult.Value.Id}", createResult.Value);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error creating testimonial");
        return Results.Problem("An error occurred while creating the testimonial");
    }
})
.DisableAntiforgery()
.WithTags("Testimonials");

app.MapGet("/api/testimonials/{projectId:guid}", async (
    Guid projectId,
    ISupabaseClientWrapper supabaseClient,
    bool? approved) =>
{
    if (approved == false)
    {
        var pendingResult = await supabaseClient.GetPendingAsync(projectId);
        return pendingResult.IsSuccess 
            ? Results.Ok(pendingResult.Value)
            : Results.Problem(pendingResult.Errors.FirstOrDefault()?.Message ?? "Failed to fetch pending testimonials");
    }

    var result = await supabaseClient.GetApprovedAsync(projectId);
    return result.IsSuccess 
        ? Results.Ok(result.Value)
        : Results.Problem(result.Errors.FirstOrDefault()?.Message ?? "Failed to fetch testimonials");
})
.WithTags("Testimonials");

app.MapPut("/api/testimonials/{id:guid}/approve", async (
    Guid id,
    ISupabaseClientWrapper supabaseClient) =>
{
    var result = await supabaseClient.ApproveTestimonialAsync(id);
    return result.IsSuccess 
        ? Results.Ok(result.Value)
        : Results.Problem(result.Errors.FirstOrDefault()?.Message ?? "Failed to approve testimonial");
})
.RequireAuthorization()
.WithTags("Testimonials");

// Projects endpoints
app.MapGet("/api/projects", async (ProjectService service, ClaimsPrincipal user) =>
{
    var userIdClaim = user.FindFirst("sub")?.Value;
    if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
    {
        return Results.Unauthorized();
    }

    var result = await service.GetUserProjectsAsync(userId);
    return result.IsSuccess
        ? Results.Ok(result.Value)
        : Results.Problem(result.Errors.FirstOrDefault()?.Message ?? "Failed to fetch projects");
})
.RequireAuthorization()
.WithTags("Projects");

app.MapPost("/api/projects", async (ProjectService service, CreateProjectRequest request, ClaimsPrincipal user) =>
{
    var userIdClaim = user.FindFirst("sub")?.Value;
    if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
    {
        return Results.Unauthorized();
    }

    // Set the user ID from the authenticated user
    request.UserId = userId;

    var result = await service.CreateProjectAsync(request);
    return result.IsSuccess
        ? Results.Created($"/api/projects/{result.Value.Id}", result.Value)
        : Results.Problem(result.Errors.FirstOrDefault()?.Message ?? "Failed to create project");
})
.RequireAuthorization()
.WithTags("Projects");

// Widget endpoint - serve the embeddable JavaScript
app.MapGet("/widget.js", async () =>
{
    var widgetPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "widget", "widget.js");
    
    if (File.Exists(widgetPath))
    {
        var content = await File.ReadAllTextAsync(widgetPath);
        return Results.Content(content, "application/javascript");
    }
    
    return Results.NotFound("Widget script not found");
})
.WithTags("Widget");

try
{
    Log.Information("Starting TrustLoops WebApp");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

// Make Program class accessible for testing
public partial class Program { }
