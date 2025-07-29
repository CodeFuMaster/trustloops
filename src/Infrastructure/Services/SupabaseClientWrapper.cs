using Supabase;
using Supabase.Storage;
using Shared.Entities;
using FluentResults;

namespace Infrastructure.Services;

public interface ISupabaseClientWrapper
{
    Task<Result<StorageFile>> UploadAsync(Stream file, string filename);
    Task<Result<List<Testimonial>>> GetApprovedAsync(Guid projectId);
    Task<Result<List<Testimonial>>> GetPendingAsync(Guid projectId);
    Task<Result<Testimonial>> CreateTestimonialAsync(Testimonial testimonial);
    Task<Result<Testimonial>> ApproveTestimonialAsync(Guid testimonialId);
    Task<Result<List<Project>>> GetProjectsAsync(Guid userId);
    Task<Result<Project>> GetProjectBySlugAsync(string slug);
}

public class SupabaseClientWrapper : ISupabaseClientWrapper
{
    private readonly Client _supabaseClient;
    private readonly ILogger<SupabaseClientWrapper> _logger;
    private readonly string _bucketName;

    public SupabaseClientWrapper(
        Client supabaseClient, 
        ILogger<SupabaseClientWrapper> logger,
        IConfiguration configuration)
    {
        _supabaseClient = supabaseClient;
        _logger = logger;
        _bucketName = configuration["Storage:BucketName"] ?? "testimonials";
    }

    public async Task<Result<StorageFile>> UploadAsync(Stream file, string filename)
    {
        try
        {
            _logger.LogInformation("Uploading file {Filename} to bucket {Bucket}", filename, _bucketName);
            
            var bucket = _supabaseClient.Storage.From(_bucketName);
            var result = await bucket.Upload(file, $"videos/{filename}");
            
            _logger.LogInformation("Successfully uploaded file {Filename}", filename);
            return Result.Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload file {Filename}", filename);
            return Result.Fail($"Upload failed: {ex.Message}");
        }
    }

    public async Task<Result<List<Testimonial>>> GetApprovedAsync(Guid projectId)
    {
        try
        {
            _logger.LogInformation("Fetching approved testimonials for project {ProjectId}", projectId);
            
            var response = await _supabaseClient
                .From<TestimonialDto>()
                .Select("*")
                .Where(t => t.ProjectId == projectId && t.Approved == true)
                .Order("created_utc", Postgrest.Constants.Ordering.Descending)
                .Get();

            var testimonials = response.Models.Select(MapToTestimonial).ToList();
            
            _logger.LogInformation("Found {Count} approved testimonials for project {ProjectId}", 
                testimonials.Count, projectId);
            
            return Result.Ok(testimonials);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch approved testimonials for project {ProjectId}", projectId);
            return Result.Fail($"Failed to fetch testimonials: {ex.Message}");
        }
    }

    public async Task<Result<List<Testimonial>>> GetPendingAsync(Guid projectId)
    {
        try
        {
            _logger.LogInformation("Fetching pending testimonials for project {ProjectId}", projectId);
            
            var response = await _supabaseClient
                .From<TestimonialDto>()
                .Select("*")
                .Where(t => t.ProjectId == projectId && t.Approved == false)
                .Order("created_utc", Postgrest.Constants.Ordering.Descending)
                .Get();

            var testimonials = response.Models.Select(MapToTestimonial).ToList();
            
            _logger.LogInformation("Found {Count} pending testimonials for project {ProjectId}", 
                testimonials.Count, projectId);
            
            return Result.Ok(testimonials);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch pending testimonials for project {ProjectId}", projectId);
            return Result.Fail($"Failed to fetch testimonials: {ex.Message}");
        }
    }

    public async Task<Result<Testimonial>> CreateTestimonialAsync(Testimonial testimonial)
    {
        try
        {
            _logger.LogInformation("Creating testimonial for project {ProjectId}", testimonial.ProjectId);
            
            var dto = MapFromTestimonial(testimonial);
            var response = await _supabaseClient
                .From<TestimonialDto>()
                .Insert(dto);

            var created = response.Models.FirstOrDefault();
            if (created == null)
            {
                return Result.Fail("Failed to create testimonial");
            }

            var result = MapToTestimonial(created);
            _logger.LogInformation("Successfully created testimonial {TestimonialId}", result.Id);
            
            return Result.Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create testimonial");
            return Result.Fail($"Failed to create testimonial: {ex.Message}");
        }
    }

    public async Task<Result<Testimonial>> ApproveTestimonialAsync(Guid testimonialId)
    {
        try
        {
            _logger.LogInformation("Approving testimonial {TestimonialId}", testimonialId);
            
            var response = await _supabaseClient
                .From<TestimonialDto>()
                .Where(t => t.Id == testimonialId)
                .Set(t => t.Approved!, true)
                .Update();

            var updated = response.Models.FirstOrDefault();
            if (updated == null)
            {
                return Result.Fail("Testimonial not found");
            }

            var result = MapToTestimonial(updated);
            _logger.LogInformation("Successfully approved testimonial {TestimonialId}", testimonialId);
            
            return Result.Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to approve testimonial {TestimonialId}", testimonialId);
            return Result.Fail($"Failed to approve testimonial: {ex.Message}");
        }
    }

    public async Task<Result<List<Project>>> GetProjectsAsync(Guid userId)
    {
        try
        {
            _logger.LogInformation("Fetching projects for user {UserId}", userId);
            
            var response = await _supabaseClient
                .From<ProjectDto>()
                .Select("*")
                .Where(p => p.UserId == userId)
                .Order("created_utc", Postgrest.Constants.Ordering.Descending)
                .Get();

            var projects = response.Models.Select(MapToProject).ToList();
            
            _logger.LogInformation("Found {Count} projects for user {UserId}", projects.Count, userId);
            
            return Result.Ok(projects);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch projects for user {UserId}", userId);
            return Result.Fail($"Failed to fetch projects: {ex.Message}");
        }
    }

    public async Task<Result<Project>> GetProjectBySlugAsync(string slug)
    {
        try
        {
            _logger.LogInformation("Fetching project by slug {Slug}", slug);
            
            var response = await _supabaseClient
                .From<ProjectDto>()
                .Select("*")
                .Where(p => p.Slug == slug)
                .Single();

            if (response == null)
            {
                return Result.Fail("Project not found");
            }

            var project = MapToProject(response);
            _logger.LogInformation("Found project {ProjectId} for slug {Slug}", project.Id, slug);
            
            return Result.Ok(project);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch project by slug {Slug}", slug);
            return Result.Fail($"Failed to fetch project: {ex.Message}");
        }
    }

    private static Testimonial MapToTestimonial(TestimonialDto dto) => new()
    {
        Id = dto.Id,
        ProjectId = dto.ProjectId,
        CustomerName = dto.CustomerName ?? string.Empty,
        CustomerEmail = dto.CustomerEmail,
        CustomerTitle = dto.CustomerTitle,
        CustomerCompany = dto.CustomerCompany,
        Quote = dto.Quote,
        VideoUrl = dto.VideoUrl,
        ThumbnailUrl = dto.ThumbnailUrl,
        Rating = dto.Rating ?? 5,
        Approved = dto.Approved ?? false,
        CreatedUtc = dto.CreatedUtc,
        UpdatedUtc = dto.UpdatedUtc
    };

    private static TestimonialDto MapFromTestimonial(Testimonial testimonial) => new()
    {
        Id = testimonial.Id,
        ProjectId = testimonial.ProjectId,
        CustomerName = testimonial.CustomerName,
        CustomerEmail = testimonial.CustomerEmail,
        CustomerTitle = testimonial.CustomerTitle,
        CustomerCompany = testimonial.CustomerCompany,
        Quote = testimonial.Quote,
        VideoUrl = testimonial.VideoUrl,
        ThumbnailUrl = testimonial.ThumbnailUrl,
        Rating = testimonial.Rating,
        Approved = testimonial.Approved,
        CreatedUtc = testimonial.CreatedUtc,
        UpdatedUtc = testimonial.UpdatedUtc
    };

    private static Project MapToProject(ProjectDto dto) => new()
    {
        Id = dto.Id,
        Name = dto.Name ?? string.Empty,
        Slug = dto.Slug ?? string.Empty,
        Description = dto.Description,
        UserId = dto.UserId,
        CreatedUtc = dto.CreatedUtc,
        UpdatedUtc = dto.UpdatedUtc
    };
}

// Supabase DTOs with proper attributes
[Postgrest.Attributes.Table("testimonials")]
public class TestimonialDto : Postgrest.Models.BaseModel
{
    [Postgrest.Attributes.PrimaryKey("id")]
    public Guid Id { get; set; }

    [Postgrest.Attributes.Column("project_id")]
    public Guid ProjectId { get; set; }

    [Postgrest.Attributes.Column("customer_name")]
    public string? CustomerName { get; set; }

    [Postgrest.Attributes.Column("customer_email")]
    public string? CustomerEmail { get; set; }

    [Postgrest.Attributes.Column("customer_title")]
    public string? CustomerTitle { get; set; }

    [Postgrest.Attributes.Column("customer_company")]
    public string? CustomerCompany { get; set; }

    [Postgrest.Attributes.Column("quote")]
    public string? Quote { get; set; }

    [Postgrest.Attributes.Column("video_url")]
    public string? VideoUrl { get; set; }

    [Postgrest.Attributes.Column("thumbnail_url")]
    public string? ThumbnailUrl { get; set; }

    [Postgrest.Attributes.Column("rating")]
    public int? Rating { get; set; }

    [Postgrest.Attributes.Column("approved")]
    public bool? Approved { get; set; }

    [Postgrest.Attributes.Column("created_utc")]
    public DateTime CreatedUtc { get; set; }

    [Postgrest.Attributes.Column("updated_utc")]
    public DateTime UpdatedUtc { get; set; }
}

[Postgrest.Attributes.Table("projects")]
public class ProjectDto : Postgrest.Models.BaseModel
{
    [Postgrest.Attributes.PrimaryKey("id")]
    public Guid Id { get; set; }

    [Postgrest.Attributes.Column("name")]
    public string? Name { get; set; }

    [Postgrest.Attributes.Column("slug")]
    public string? Slug { get; set; }

    [Postgrest.Attributes.Column("description")]
    public string? Description { get; set; }

    [Postgrest.Attributes.Column("user_id")]
    public Guid UserId { get; set; }

    [Postgrest.Attributes.Column("created_utc")]
    public DateTime CreatedUtc { get; set; }

    [Postgrest.Attributes.Column("updated_utc")]
    public DateTime UpdatedUtc { get; set; }
}
