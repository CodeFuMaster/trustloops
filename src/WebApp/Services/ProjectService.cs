// File: src/WebApp/Services/ProjectService.cs
using Shared.Models;
using Shared.Entities;
using FluentResults;
using Infrastructure.Services;

namespace WebApp.Services;

public class ProjectService
{
    private readonly ILogger<ProjectService> _logger;
    private readonly ISupabaseClientWrapper _supabase;

    public ProjectService(ILogger<ProjectService> logger, ISupabaseClientWrapper supabase)
    {
        _logger = logger;
        _supabase = supabase;
    }

    public async Task<Result<Shared.Entities.Project>> CreateProjectAsync(CreateProjectRequest request)
    {
        try
        {
            _logger.LogInformation("Creating project {ProjectName}", request.Name);
            
            // Generate slug from name
            var slug = GenerateSlug(request.Name);
            
            // Create project entity
            var project = new Shared.Entities.Project
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Slug = slug,
                Description = request.Description,
                UserId = request.UserId,
                CreatedUtc = DateTime.UtcNow
            };

            // Use Supabase to create project
            var result = await _supabase.CreateProjectAsync(project);
            if (result.IsFailed)
            {
                return Result.Fail($"Failed to create project in database: {result.Errors.FirstOrDefault()?.Message}");
            }
            
            _logger.LogInformation("Created project {ProjectId} with slug {Slug}", result.Value.Id, result.Value.Slug);
            
            return Result.Ok(result.Value);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create project {ProjectName}", request.Name);
            return Result.Fail($"Failed to create project: {ex.Message}");
        }
    }

    public async Task<Result<List<Shared.Entities.Project>>> GetUserProjectsAsync(Guid userId)
    {
        try
        {
            _logger.LogInformation("Getting projects for user {UserId}", userId);
            
            // Use Supabase to get user projects
            var result = await _supabase.GetProjectsAsync(userId);
            if (result.IsFailed)
            {
                return Result.Fail($"Failed to fetch projects from database: {result.Errors.FirstOrDefault()?.Message}");
            }
            
            _logger.LogInformation("Found {ProjectCount} projects for user {UserId}", result.Value.Count, userId);
            return Result.Ok(result.Value);
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

    public async Task<Result<Shared.Entities.Project>> GetProjectByIdAsync(Guid projectId)
    {
        try
        {
            _logger.LogInformation("Getting project {ProjectId}", projectId);
            
            // For now, we don't have this method in Supabase wrapper, so return not implemented
            return Result.Fail("Get project by ID not yet implemented");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get project {ProjectId}", projectId);
            return Result.Fail($"Failed to get project: {ex.Message}");
        }
    }

    public async Task<Result<Shared.Entities.Project>> GetProjectBySlugAsync(string slug)
    {
        try
        {
            _logger.LogInformation("Getting project by slug {Slug}", slug);
            
            // Use Supabase to get project by slug
            var result = await _supabase.GetProjectBySlugAsync(slug);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get project by slug {Slug}", slug);
            return Result.Fail($"Failed to get project: {ex.Message}");
        }
    }
}
