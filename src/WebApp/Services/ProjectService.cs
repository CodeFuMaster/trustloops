// File: src/WebApp/Services/ProjectService.cs
using Shared.Models;
using Shared.Entities;
using FluentResults;
using Infrastructure.Services;

namespace WebApp.Services;

public class ProjectService
{
    private readonly ILogger<ProjectService> _logger;
    private readonly SupabaseClientWrapper _supabase;

    public ProjectService(ILogger<ProjectService> logger, SupabaseClientWrapper supabase)
    {
        _logger = logger;
        _supabase = supabase;
    }

    public async Task<Result<Project>> CreateProjectAsync(CreateProjectRequest request)
    {
        try
        {
            _logger.LogInformation("Creating project {ProjectName}", request.Name);
            
            // Generate slug from name
            var slug = GenerateSlug(request.Name);
            
            // Create project entity
            var project = new Project
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Slug = slug,
                Description = request.Description,
                UserId = request.UserId,
                CreatedUtc = DateTime.UtcNow
            };

            // TODO: Use Supabase to create project when available
            // For now, return the created project
            _logger.LogInformation("Created project {ProjectId} with slug {Slug}", project.Id, project.Slug);
            
            return Result.Ok(project);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create project {ProjectName}", request.Name);
            return Result.Fail($"Failed to create project: {ex.Message}");
        }
    }

    public async Task<Result<List<Project>>> GetUserProjectsAsync(Guid userId)
    {
        try
        {
            _logger.LogInformation("Getting projects for user {UserId}", userId);
            
            // TODO: Use Supabase to get user projects when available
            // For now, return sample project
            var sampleProject = new Project
            {
                Id = Guid.Parse("550e8400-e29b-41d4-a716-446655440000"),
                Name = "Sample Product",
                Slug = "sample-product",
                Description = "A sample project for testing testimonials",
                UserId = userId,
                CreatedUtc = DateTime.UtcNow.AddDays(-7)
            };
            
            return Result.Ok(new List<Project> { sampleProject });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get projects for user {UserId}", userId);
            return Result.Fail($"Failed to get projects: {ex.Message}");
        }
    }

    private static string GenerateSlug(string name)
    {
        // Simple slug generation - replace spaces with hyphens and lowercase
        return name.ToLowerInvariant()
                  .Replace(' ', '-')
                  .Replace("'", "")
                  .Replace("\"", "")
                  .Trim();
    }

    public async Task<Result<Project>> GetProjectByIdAsync(Guid projectId)
    {
        // TODO: Implement get project by ID from Supabase
        _logger.LogInformation("Getting project {ProjectId}", projectId);
        
        throw new NotImplementedException("Get project by ID not yet implemented");
    }
}
