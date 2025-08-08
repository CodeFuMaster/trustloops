// File: src/WebApp/Services/ProjectService.cs
using Shared.Models;
using FluentResults;
using TrustLoops.Infrastructure.Services;
using Infrastructure.Services;

namespace WebApp.Services;

public class ProjectService
{
    private readonly ILogger<ProjectService> _logger;
    private readonly SupabaseClient? _supabaseClient;
    private readonly ISupabaseClientWrapper _supabaseWrapper;

    public ProjectService(ILogger<ProjectService> logger, ISupabaseClientWrapper supabaseWrapper, SupabaseClient? supabaseClient = null)
    {
        _logger = logger;
        _supabaseWrapper = supabaseWrapper;
        _supabaseClient = supabaseClient;
    }

    public async Task<Result<Project>> CreateProjectAsync(CreateProjectRequest request, string userEmail)
    {
        try
        {
            _logger.LogInformation("Creating project {ProjectName}", request.Name);
            
            if (_supabaseClient != null)
            {
                // Use new Supabase client
                var project = await _supabaseClient.CreateProjectAsync(
                    request.Name, 
                    request.Description ?? "", 
                    request.UserId,
                    userEmail,
                    request.CallToAction ?? "Share your experience"
                );
                _logger.LogInformation("Created project {ProjectId} with slug {Slug}", project.Id, project.Slug);
                return Result.Ok(project);
            }
            else
            {
                // Fallback to wrapper
                var projectEntity = new Shared.Entities.Project
                {
                    Id = Guid.NewGuid(),
                    Name = request.Name,
                    Slug = GenerateSlug(request.Name),
                    Description = request.Description,
                    UserId = request.UserId,
                    CreatedUtc = DateTime.UtcNow
                };

                var result = await _supabaseWrapper.CreateProjectAsync(projectEntity);
                if (result.IsFailed)
                {
                    return Result.Fail($"Failed to create project: {result.Errors.FirstOrDefault()?.Message}");
                }
                
                // Convert Entity to Model
                var project = new Project
                {
                    Id = result.Value.Id,
                    Name = result.Value.Name,
                    Slug = result.Value.Slug,
                    Description = result.Value.Description,
                    UserId = result.Value.UserId,
                    CreatedUtc = result.Value.CreatedUtc,
                    UpdatedUtc = result.Value.UpdatedUtc
                };
                
                return Result.Ok(project);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create project {ProjectName}", request.Name);
            return Result.Fail($"Failed to create project: {ex.Message}");
        }
    }

    public async Task<Result<List<Project>>> GetUserProjectsAsync(Guid userId, string userEmail)
    {
        try
        {
            _logger.LogInformation("Getting projects for user {UserId} with email {Email}", userId, userEmail);
            
            if (_supabaseClient != null)
            {
                // First, we need to get the actual database user ID using the email
                // The JWT user ID might be different from the database user ID
                _logger.LogInformation("Looking up actual database user ID for JWT user {JwtUserId} with email {Email}", userId, userEmail);
                
                var actualUser = await _supabaseClient.UpsertUserDirectly(userId, userEmail);
                var actualUserId = actualUser.Id;
                
                if (actualUserId != userId)
                {
                    _logger.LogInformation("User ID mismatch detected - JWT: {JwtUserId}, Database: {DatabaseUserId}", userId, actualUserId);
                }
                
                // Use the actual database user ID to get projects
                var projects = await _supabaseClient.GetProjectsAsync(actualUserId);
                _logger.LogInformation("Found {ProjectCount} projects for database user {DatabaseUserId}", projects.Count, actualUserId);
                
                return Result.Ok(projects);
            }
            else
            {
                // Fallback to wrapper
                var result = await _supabaseWrapper.GetProjectsAsync(userId);
                if (result.IsFailed)
                {
                    return Result.Fail($"Failed to get projects: {result.Errors.FirstOrDefault()?.Message}");
                }
                
                // Convert Entities to Models
                var projects = result.Value.Select(p => new Project
                {
                    Id = p.Id,
                    Name = p.Name,
                    Slug = p.Slug,
                    Description = p.Description,
                    UserId = p.UserId,
                    CreatedUtc = p.CreatedUtc,
                    UpdatedUtc = p.UpdatedUtc
                }).ToList();
                
                return Result.Ok(projects);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get projects for user {UserId}", userId);
            return Result.Fail($"Failed to get projects: {ex.Message}");
        }
    }

    public Task<Result<Project>> GetProjectByIdAsync(Guid projectId)
    {
        try
        {
            _logger.LogInformation("Getting project {ProjectId}", projectId);
            
            // For now, we don't have this method in Supabase wrapper, so return not implemented
            return Task.FromResult(Result.Fail<Project>("Get project by ID not yet implemented"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get project {ProjectId}", projectId);
            return Task.FromResult(Result.Fail<Project>($"Failed to get project: {ex.Message}"));
        }
    }

    public async Task<Result<Project>> GetProjectBySlugAsync(string slug)
    {
        try
        {
            _logger.LogInformation("Getting project by slug {Slug}", slug);
            
            if (_supabaseClient != null)
            {
                // Use new Supabase client
                var project = await _supabaseClient.GetProjectBySlugAsync(slug);
                if (project != null)
                {
                    return Result.Ok(project);
                }
                return Result.Fail("Project not found");
            }
            else
            {
                // Fallback to wrapper
                var result = await _supabaseWrapper.GetProjectBySlugAsync(slug);
                if (result.IsSuccess)
                {
                    var project = new Project
                    {
                        Id = result.Value.Id,
                        Name = result.Value.Name,
                        Slug = result.Value.Slug,
                        Description = result.Value.Description,
                        UserId = result.Value.UserId,
                        CreatedUtc = result.Value.CreatedUtc,
                        UpdatedUtc = result.Value.UpdatedUtc
                    };
                    return Result.Ok(project);
                }
                return Result.Fail("Project not found");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get project by slug {Slug}", slug);
            return Result.Fail($"Failed to get project: {ex.Message}");
        }
    }
    
    private static string GenerateSlug(string name)
    {
        return name.ToLowerInvariant()
                  .Replace(' ', '-')
                  .Replace("'", "")
                  .Replace("\"", "")
                  .Trim();
    }
}
