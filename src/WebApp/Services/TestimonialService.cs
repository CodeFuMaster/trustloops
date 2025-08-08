// File: src/WebApp/Services/TestimonialService.cs
using Shared.Models;
using TrustLoops.Infrastructure.Services;
using Infrastructure.Services;
using FluentResults;

namespace WebApp.Services;

public class TestimonialService
{
    private readonly ILogger<TestimonialService> _logger;
    private readonly SupabaseClient? _supabaseClient;
    private readonly ISupabaseClientWrapper _supabaseWrapper;

    public TestimonialService(ILogger<TestimonialService> logger, ISupabaseClientWrapper supabaseWrapper, SupabaseClient? supabaseClient = null)
    {
        _logger = logger;
        _supabaseWrapper = supabaseWrapper;
        _supabaseClient = supabaseClient;
    }

    public async Task<Result<Testimonial>> CreateTestimonialAsync(CreateTestimonialRequest request)
    {
        try
        {
            _logger.LogInformation("Creating testimonial for project {ProjectId}", request.ProjectId);
            
            if (_supabaseClient != null)
            {
                var testimonial = await _supabaseClient.CreateTestimonialAsync(request);
                _logger.LogInformation("Created testimonial {TestimonialId} for project {ProjectId}", 
                    testimonial.Id, request.ProjectId);
                return Result.Ok(testimonial);
            }
            else
            {
                // Fallback to wrapper
                var testimonialEntity = new Shared.Entities.Testimonial
                {
                    Id = Guid.NewGuid(),
                    ProjectId = request.ProjectId,
                    Quote = request.Quote,
                    Rating = request.Rating,
                    CustomerName = request.CustomerName,
                    CustomerEmail = request.CustomerEmail,
                    CustomerTitle = request.CustomerTitle,
                    CustomerCompany = request.CustomerCompany,
                    CreatedUtc = DateTime.UtcNow,
                    Approved = false
                };

                var result = await _supabaseWrapper.CreateTestimonialAsync(testimonialEntity);
                if (result.IsFailed)
                {
                    return Result.Fail($"Failed to create testimonial: {result.Errors.FirstOrDefault()?.Message}");
                }
                
                // Convert Entity to Model
                var testimonial = new Testimonial
                {
                    Id = result.Value.Id,
                    ProjectId = result.Value.ProjectId,
                    Quote = result.Value.Quote,
                    Rating = result.Value.Rating,
                    CustomerName = result.Value.CustomerName,
                    CustomerEmail = result.Value.CustomerEmail,
                    CustomerTitle = result.Value.CustomerTitle,
                    CustomerCompany = result.Value.CustomerCompany,
                    VideoUrl = result.Value.VideoUrl,
                    ThumbnailUrl = result.Value.ThumbnailUrl,
                    CreatedUtc = result.Value.CreatedUtc,
                    UpdatedUtc = result.Value.UpdatedUtc,
                    Approved = result.Value.Approved,
                    Transcript = result.Value.Transcript,
                    Summary = result.Value.Summary,
                    Sentiment = result.Value.Sentiment,
                    Tags = result.Value.Tags,
                    CaptionsUrl = result.Value.CaptionsUrl
                };
                
                return Result.Ok(testimonial);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create testimonial for project {ProjectId}", request.ProjectId);
            return Result.Fail($"Failed to create testimonial: {ex.Message}");
        }
    }

    public async Task<Result<List<Testimonial>>> GetApprovedTestimonialsByProjectAsync(Guid projectId)
    {
        try
        {
            _logger.LogInformation("Getting approved testimonials for project {ProjectId}", projectId);
            
            if (_supabaseClient != null)
            {
                var testimonials = await _supabaseClient.GetApprovedTestimonialsAsync(projectId);
                _logger.LogInformation("Found {TestimonialCount} approved testimonials for project {ProjectId}", 
                    testimonials.Count, projectId);
                return Result.Ok(testimonials);
            }
            else
            {
                // Fallback to wrapper
                var result = await _supabaseWrapper.GetApprovedAsync(projectId);
                if (result.IsFailed)
                {
                    return Result.Fail($"Failed to get testimonials: {result.Errors.FirstOrDefault()?.Message}");
                }
                
                // Convert Entities to Models
                var testimonials = result.Value.Select(t => new Testimonial
                {
                    Id = t.Id,
                    ProjectId = t.ProjectId,
                    Quote = t.Quote,
                    Rating = t.Rating,
                    CustomerName = t.CustomerName,
                    CustomerEmail = t.CustomerEmail,
                    CustomerTitle = t.CustomerTitle,
                    CustomerCompany = t.CustomerCompany,
                    VideoUrl = t.VideoUrl,
                    ThumbnailUrl = t.ThumbnailUrl,
                    CreatedUtc = t.CreatedUtc,
                    UpdatedUtc = t.UpdatedUtc,
                    Approved = t.Approved,
                    Transcript = t.Transcript,
                    Summary = t.Summary,
                    Sentiment = t.Sentiment,
                    Tags = t.Tags,
                    CaptionsUrl = t.CaptionsUrl
                }).ToList();
                
                return Result.Ok(testimonials);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get approved testimonials for project {ProjectId}", projectId);
            return Result.Fail($"Failed to get testimonials: {ex.Message}");
        }
    }

    public async Task<Result<List<Testimonial>>> GetPendingTestimonialsAsync(Guid userId)
    {
        try
        {
            _logger.LogInformation("Getting pending testimonials for user {UserId}", userId);
            
            if (_supabaseClient != null)
            {
                var testimonials = await _supabaseClient.GetPendingTestimonialsAsync(userId);
                _logger.LogInformation("Found {TestimonialCount} pending testimonials for user {UserId}", 
                    testimonials.Count, userId);
                return Result.Ok(testimonials);
            }
            else
            {
                // Fallback to wrapper - get pending for first project of user
                var projectsResult = await _supabaseWrapper.GetProjectsAsync(userId);
                if (projectsResult.IsFailed || !projectsResult.Value.Any())
                {
                    return Result.Ok(new List<Testimonial>());
                }
                
                var firstProject = projectsResult.Value.First();
                var result = await _supabaseWrapper.GetPendingAsync(firstProject.Id);
                if (result.IsFailed)
                {
                    return Result.Fail($"Failed to get pending testimonials: {result.Errors.FirstOrDefault()?.Message}");
                }
                
                // Convert Entities to Models
                var testimonials = result.Value.Select(t => new Testimonial
                {
                    Id = t.Id,
                    ProjectId = t.ProjectId,
                    Quote = t.Quote,
                    Rating = t.Rating,
                    CustomerName = t.CustomerName,
                    CustomerEmail = t.CustomerEmail,
                    CustomerTitle = t.CustomerTitle,
                    CustomerCompany = t.CustomerCompany,
                    VideoUrl = t.VideoUrl,
                    ThumbnailUrl = t.ThumbnailUrl,
                    CreatedUtc = t.CreatedUtc,
                    UpdatedUtc = t.UpdatedUtc,
                    Approved = t.Approved,
                    Transcript = t.Transcript,
                    Summary = t.Summary,
                    Sentiment = t.Sentiment,
                    Tags = t.Tags,
                    CaptionsUrl = t.CaptionsUrl
                }).ToList();
                
                return Result.Ok(testimonials);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get pending testimonials for user {UserId}", userId);
            return Result.Fail($"Failed to get pending testimonials: {ex.Message}");
        }
    }

    public async Task<Result<bool>> ApproveTestimonialAsync(Guid testimonialId, Guid userId)
    {
        try
        {
            _logger.LogInformation("Approving testimonial {TestimonialId} by user {UserId}", testimonialId, userId);
            
            if (_supabaseClient != null)
            {
                var success = await _supabaseClient.ApproveTestimonialAsync(testimonialId, true);
                
                if (success)
                {
                    _logger.LogInformation("Successfully approved testimonial {TestimonialId}", testimonialId);
                    return Result.Ok(true);
                }
                else
                {
                    _logger.LogWarning("Failed to approve testimonial {TestimonialId} - not found or unauthorized", testimonialId);
                    return Result.Fail("Testimonial not found or user not authorized");
                }
            }
            else
            {
                // Fallback to wrapper
                var result = await _supabaseWrapper.ApproveTestimonialAsync(testimonialId);
                if (result.IsSuccess)
                {
                    _logger.LogInformation("Successfully approved testimonial {TestimonialId}", testimonialId);
                    return Result.Ok(true);
                }
                else
                {
                    _logger.LogWarning("Failed to approve testimonial {TestimonialId}", testimonialId);
                    return Result.Fail("Failed to approve testimonial");
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to approve testimonial {TestimonialId}", testimonialId);
            return Result.Fail($"Failed to approve testimonial: {ex.Message}");
        }
    }

    public async Task<Result<string>> UploadVideoAsync(Stream fileStream, string fileName)
    {
        try
        {
            _logger.LogInformation("Uploading video file: {FileName}", fileName);
            
            if (_supabaseClient != null)
            {
                var videoUrl = await _supabaseClient.UploadVideoAsync(fileStream, fileName);
                _logger.LogInformation("Successfully uploaded video: {VideoUrl}", videoUrl);
                return Result.Ok(videoUrl);
            }
            else
            {
                // Fallback to wrapper
                var result = await _supabaseWrapper.UploadAsync(fileStream, fileName);
                if (result.IsSuccess)
                {
                    _logger.LogInformation("Successfully uploaded video: {VideoUrl}", result.Value);
                    return Result.Ok(result.Value);
                }
                else
                {
                    return Result.Fail($"Failed to upload video: {result.Errors.FirstOrDefault()?.Message}");
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload video: {FileName}", fileName);
            return Result.Fail($"Failed to upload video: {ex.Message}");
        }
    }
}
