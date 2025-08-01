using Supabase;
using Supabase.Gotrue;
using Models = Shared.Models;
using Infrastructure.Models;
using Microsoft.Extensions.Logging;

namespace TrustLoops.Infrastructure.Services;

public class SupabaseClient
{
    private readonly Supabase.Client _client;
    private readonly ILogger<SupabaseClient> _logger;

    public SupabaseClient(Supabase.Client client, ILogger<SupabaseClient> logger)
    {
        _client = client;
        _logger = logger;
    }

    public async Task<Models.Project> CreateProjectAsync(string name, string description, Guid userId)
    {
        try
        {
            var slug = GenerateSlug(name);
            
            var project = new SupabaseProject
            {
                Id = Guid.NewGuid(),
                Name = name,
                Description = description,
                Slug = slug,
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var result = await _client
                .From<SupabaseProject>()
                .Insert(project);

            if (result?.Models?.FirstOrDefault() != null)
            {
                var createdProject = result.Models.First();
                _logger.LogInformation("Project created successfully: {ProjectId}", createdProject.Id);
                
                return new Models.Project
                {
                    Id = createdProject.Id,
                    Name = createdProject.Name,
                    Slug = createdProject.Slug,
                    Description = createdProject.Description,
                    UserId = createdProject.UserId,
                    CreatedUtc = createdProject.CreatedAt,
                    UpdatedUtc = createdProject.UpdatedAt
                };
            }

            throw new InvalidOperationException("Failed to create project");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating project: {Name}", name);
            throw;
        }
    }

    public async Task<List<Models.Project>> GetProjectsAsync(Guid userId)
    {
        try
        {
            var result = await _client
                .From<SupabaseProject>()
                .Where(p => p.UserId == userId)
                .Order("created_utc", Supabase.Postgrest.Constants.Ordering.Descending)
                .Get();

            return result?.Models?.Select(p => new Models.Project
            {
                Id = p.Id,
                Name = p.Name,
                Slug = p.Slug,
                Description = p.Description,
                UserId = p.UserId,
                CreatedUtc = p.CreatedAt,
                UpdatedUtc = p.UpdatedAt
            }).ToList() ?? new List<Models.Project>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching projects for user: {UserId}", userId);
            throw;
        }
    }

    public async Task<Models.Project?> GetProjectBySlugAsync(string slug)
    {
        try
        {
            var result = await _client
                .From<SupabaseProject>()
                .Where(p => p.Slug == slug)
                .Single();

            if (result != null)
            {
                return new Models.Project
                {
                    Id = result.Id,
                    Name = result.Name,
                    Slug = result.Slug,
                    Description = result.Description,
                    UserId = result.UserId,
                    CreatedUtc = result.CreatedAt,
                    UpdatedUtc = result.UpdatedAt
                };
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching project by slug: {Slug}", slug);
            return null;
        }
    }

    public async Task<Models.Testimonial> CreateTestimonialAsync(Models.CreateTestimonialRequest request)
    {
        try
        {
            var testimonial = new SupabaseTestimonial
            {
                Id = Guid.NewGuid(),
                ProjectId = request.ProjectId,
                CustomerName = request.CustomerName,
                CustomerEmail = request.CustomerEmail,
                CustomerTitle = request.CustomerTitle,
                CustomerCompany = request.CustomerCompany,
                Quote = request.Quote,
                Rating = request.Rating,
                Approved = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var result = await _client
                .From<SupabaseTestimonial>()
                .Insert(testimonial);

            if (result?.Models?.FirstOrDefault() != null)
            {
                var created = result.Models.First();
                _logger.LogInformation("Testimonial created successfully: {TestimonialId}", created.Id);
                
                return new Models.Testimonial
                {
                    Id = created.Id,
                    ProjectId = created.ProjectId,
                    Quote = created.Quote,
                    VideoUrl = created.VideoUrl,
                    ThumbnailUrl = created.ThumbnailUrl,
                    CustomerName = created.CustomerName,
                    CustomerEmail = created.CustomerEmail,
                    CustomerTitle = created.CustomerTitle,
                    CustomerCompany = created.CustomerCompany,
                    Rating = created.Rating,
                    Approved = created.Approved,
                    CreatedUtc = created.CreatedAt,
                    UpdatedUtc = created.UpdatedAt
                };
            }

            throw new InvalidOperationException("Failed to create testimonial");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating testimonial for project: {ProjectId}", request.ProjectId);
            throw;
        }
    }

    public async Task<bool> ApproveTestimonialAsync(Guid id, Guid userId)
    {
        try
        {
            // First verify the user owns the project
            var testimonial = await _client
                .From<SupabaseTestimonial>()
                .Where(t => t.Id == id)
                .Single();

            if (testimonial == null)
            {
                _logger.LogWarning("Testimonial not found: {TestimonialId}", id);
                return false;
            }

            var project = await _client
                .From<SupabaseProject>()
                .Where(p => p.Id == testimonial.ProjectId && p.UserId == userId)
                .Single();

            if (project == null)
            {
                _logger.LogWarning("User {UserId} not authorized to approve testimonial {TestimonialId}", userId, id);
                return false;
            }

            // Update approval status
            testimonial.Approved = true;
            testimonial.UpdatedAt = DateTime.UtcNow;

            var result = await _client
                .From<SupabaseTestimonial>()
                .Where(t => t.Id == id)
                .Update(testimonial);

            _logger.LogInformation("Testimonial approved: {TestimonialId} by user: {UserId}", id, userId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error approving testimonial: {TestimonialId}", id);
            throw;
        }
    }

    public async Task<List<Models.Testimonial>> GetApprovedTestimonialsAsync(Guid projectId)
    {
        try
        {
            var result = await _client
                .From<SupabaseTestimonial>()
                .Where(t => t.ProjectId == projectId && t.Approved == true)
                .Order("created_utc", Supabase.Postgrest.Constants.Ordering.Descending)
                .Get();

            return result?.Models?.Select(t => new Models.Testimonial
            {
                Id = t.Id,
                ProjectId = t.ProjectId,
                Quote = t.Quote,
                VideoUrl = t.VideoUrl,
                ThumbnailUrl = t.ThumbnailUrl,
                CustomerName = t.CustomerName,
                CustomerEmail = t.CustomerEmail,
                CustomerTitle = t.CustomerTitle,
                CustomerCompany = t.CustomerCompany,
                Rating = t.Rating,
                Approved = t.Approved,
                CreatedUtc = t.CreatedAt,
                UpdatedUtc = t.UpdatedAt
            }).ToList() ?? new List<Models.Testimonial>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching approved testimonials for project: {ProjectId}", projectId);
            throw;
        }
    }

    public async Task<List<Models.Testimonial>> GetPendingTestimonialsAsync(Guid userId)
    {
        try
        {
            // Get all pending testimonials for projects owned by the user
            var result = await _client
                .From<SupabaseTestimonial>()
                .Where(t => t.Approved == false)
                .Get();

            return result?.Models?.Select(t => new Models.Testimonial
            {
                Id = t.Id,
                ProjectId = t.ProjectId,
                Quote = t.Quote,
                VideoUrl = t.VideoUrl,
                ThumbnailUrl = t.ThumbnailUrl,
                CustomerName = t.CustomerName,
                CustomerEmail = t.CustomerEmail,
                CustomerTitle = t.CustomerTitle,
                CustomerCompany = t.CustomerCompany,
                Rating = t.Rating,
                Approved = t.Approved,
                CreatedUtc = t.CreatedAt,
                UpdatedUtc = t.UpdatedAt
            }).ToList() ?? new List<Models.Testimonial>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching pending testimonials for user: {UserId}", userId);
            throw;
        }
    }

    public async Task<string> UploadVideoAsync(Stream fileStream, string fileName)
    {
        try
        {
            var uniqueFileName = $"{Guid.NewGuid()}_{fileName}";
            var bucketName = "testimonial-videos";

            // Convert stream to byte array
            using var memoryStream = new MemoryStream();
            await fileStream.CopyToAsync(memoryStream);
            var fileBytes = memoryStream.ToArray();

            var result = await _client.Storage
                .From(bucketName)
                .Upload(fileBytes, uniqueFileName);

            if (!string.IsNullOrEmpty(result))
            {
                var publicUrl = _client.Storage
                    .From(bucketName)
                    .GetPublicUrl(uniqueFileName);

                _logger.LogInformation("Video uploaded successfully: {FileName}", uniqueFileName);
                return publicUrl;
            }

            throw new InvalidOperationException("Failed to upload video");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading video: {FileName}", fileName);
            throw;
        }
    }

    private static string GenerateSlug(string name)
    {
        return name
            .ToLowerInvariant()
            .Replace(" ", "-")
            .Replace("'", "")
            .Replace("\"", "")
            .Replace(".", "")
            .Replace(",", "")
            .Replace("!", "")
            .Replace("?", "")
            .Replace("&", "and");
    }
}
