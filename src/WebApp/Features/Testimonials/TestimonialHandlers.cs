using MediatR;
using Microsoft.Extensions.Logging;
using System.Text;
using TrustLoops.Infrastructure.Services;
using TrustLoops.Shared.DTOs;
using Infrastructure.Services;
using Models = Shared.Models;

namespace TrustLoops.WebApp.Features.Testimonials;

public class CreateTestimonialHandler : IRequestHandler<CreateTestimonialCommand, TestimonialDto>
{
    private readonly ISupabaseClient _supabase;
    private readonly IEmailService _emailService;
    private readonly ILogger<CreateTestimonialHandler> _logger;

    public CreateTestimonialHandler(ISupabaseClient supabase, IEmailService emailService, ILogger<CreateTestimonialHandler> logger)
    {
        _supabase = supabase;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<TestimonialDto> Handle(CreateTestimonialCommand request, CancellationToken cancellationToken)
    {
        try
        {
            string? videoUrl = null;
            string? thumbnailUrl = null;

            // Handle video upload if provided
            if (request.VideoFile != null && request.Type == "video")
            {
                var fileName = $"{Guid.NewGuid()}.webm";
                using var stream = request.VideoFile.OpenReadStream();
                
                videoUrl = await _supabase.UploadFileAsync("testimonials", fileName, stream);
                
                // TODO: Generate thumbnail from video
                thumbnailUrl = videoUrl; // Placeholder
                
                _logger.LogInformation("Video uploaded successfully: {VideoUrl}", videoUrl);
            }

            var testimonial = new CreateTestimonialDto
            {
                ProjectId = Guid.Parse(request.ProjectId),
                Type = request.Type,
                CustomerName = request.CustomerName,
                CustomerEmail = request.CustomerEmail ?? string.Empty,
                CustomerTitle = request.CustomerTitle,
                CustomerCompany = request.CustomerCompany,
                Quote = request.Quote,
                Rating = request.Rating,
                VideoUrl = videoUrl,
                ThumbnailUrl = thumbnailUrl,
                Approved = false // Requires approval
            };

            // Convert DTO to request model
            var requestModel = new global::Shared.Models.CreateTestimonialRequest
            {
                ProjectId = testimonial.ProjectId,
                Quote = testimonial.Quote,
                CustomerName = testimonial.CustomerName,
                CustomerEmail = testimonial.CustomerEmail,
                CustomerTitle = testimonial.CustomerTitle,
                CustomerCompany = testimonial.CustomerCompany,
                Rating = testimonial.Rating
            };

            var result = await _supabase.CreateTestimonialAsync(requestModel);
            
            // Convert result to DTO
            var dto = new TestimonialDto
            {
                Id = result.Id,
                ProjectId = result.ProjectId,
                Type = request.Type,
                CustomerName = result.CustomerName,
                CustomerEmail = result.CustomerEmail ?? string.Empty,
                CustomerTitle = result.CustomerTitle,
                CustomerCompany = result.CustomerCompany,
                Quote = result.Quote,
                Rating = result.Rating,
                VideoUrl = result.VideoUrl,
                ThumbnailUrl = result.ThumbnailUrl,
                Approved = result.Approved,
                CreatedUtc = result.CreatedUtc,
                UpdatedUtc = result.UpdatedUtc
            };
            
            // Send email notification to project owner
            try
            {
                // Get project details to find owner email
                var project = await _supabase.GetProjectAsync(result.ProjectId);
                if (project != null && !string.IsNullOrEmpty(project.UserEmail))
                {
                    var emailData = new NewTestimonialEmailData(
                        ProjectName: project.Name,
                        CustomerName: result.CustomerName,
                        CustomerEmail: result.CustomerEmail ?? "Not provided",
                        TestimonialQuote: result.Quote ?? "No message provided",
                        Rating: result.Rating,
                        HasVideo: !string.IsNullOrEmpty(result.VideoUrl),
                        DashboardUrl: "https://trustloops.com/dashboard"
                    );
                    
                    await _emailService.SendNewTestimonialNotificationAsync(project.UserEmail, emailData);
                    _logger.LogInformation("New testimonial notification sent to project owner: {Email}", project.UserEmail);
                }
            }
            catch (Exception emailEx)
            {
                _logger.LogWarning(emailEx, "Failed to send new testimonial notification email, but testimonial was created successfully");
                // Don't fail the entire operation if email fails
            }
            
            _logger.LogInformation("Testimonial created successfully: {TestimonialId}", dto.Id);
            return dto;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating testimonial for project {ProjectId}", request.ProjectId);
            throw;
        }
    }
}

public class ListTestimonialsHandler : IRequestHandler<ListTestimonialsQuery, PagedResult<TestimonialDto>>
{
    private readonly ISupabaseClient _supabase;
    private readonly ILogger<ListTestimonialsHandler> _logger;

    public ListTestimonialsHandler(ISupabaseClient supabase, ILogger<ListTestimonialsHandler> logger)
    {
        _supabase = supabase;
        _logger = logger;
    }

    public async Task<PagedResult<TestimonialDto>> Handle(ListTestimonialsQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var testimonials = await _supabase.GetTestimonialsAsync(
                Guid.Parse(request.ProjectId), 
                request.Approved,
                request.Page,
                request.PageSize);

            // Convert Models to DTOs
            var dtoItems = testimonials.Select(t => new TestimonialDto
            {
                Id = t.Id,
                ProjectId = t.ProjectId,
                Type = "text", // Default type, should be stored in model
                CustomerName = t.CustomerName,
                CustomerEmail = t.CustomerEmail ?? string.Empty,
                CustomerTitle = t.CustomerTitle,
                CustomerCompany = t.CustomerCompany,
                Quote = t.Quote,
                Rating = t.Rating,
                VideoUrl = t.VideoUrl,
                ThumbnailUrl = t.ThumbnailUrl,
                Approved = t.Approved,
                CreatedUtc = t.CreatedUtc,
                UpdatedUtc = t.UpdatedUtc
            }).ToList();

            // Filter by rating if specified
            if (request.MinRating.HasValue)
            {
                dtoItems = dtoItems.Where(t => t.Rating >= request.MinRating.Value).ToList();
            }

            var totalCount = dtoItems.Count;
            var pagedItems = dtoItems
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToList();

            return new PagedResult<TestimonialDto>
            {
                Items = pagedItems,
                TotalCount = totalCount,
                Page = request.Page,
                PageSize = request.PageSize
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing testimonials for project {ProjectId}", request.ProjectId);
            throw;
        }
    }
}

public class GetWallTestimonialsHandler : IRequestHandler<GetWallTestimonialsQuery, List<TestimonialDto>>
{
    private readonly ISupabaseClient _supabase;
    private readonly ILogger<GetWallTestimonialsHandler> _logger;

    public GetWallTestimonialsHandler(ISupabaseClient supabase, ILogger<GetWallTestimonialsHandler> logger)
    {
        _supabase = supabase;
        _logger = logger;
    }

    public async Task<List<TestimonialDto>> Handle(GetWallTestimonialsQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var testimonials = await _supabase.GetApprovedTestimonialsAsync(Guid.Parse(request.ProjectId));

            // Convert Models to DTOs
            var dtoTestimonials = testimonials.Select(t => new TestimonialDto
            {
                Id = t.Id,
                ProjectId = t.ProjectId,
                Type = "text", // Default type, should be stored in model
                CustomerName = t.CustomerName,
                CustomerEmail = t.CustomerEmail ?? string.Empty,
                CustomerTitle = t.CustomerTitle,
                CustomerCompany = t.CustomerCompany,
                Quote = t.Quote,
                Rating = t.Rating,
                VideoUrl = t.VideoUrl,
                ThumbnailUrl = t.ThumbnailUrl,
                Approved = t.Approved,
                CreatedUtc = t.CreatedUtc,
                UpdatedUtc = t.UpdatedUtc
            }).ToList();

            // Filter by type if specified
            if (!string.IsNullOrEmpty(request.Type))
            {
                dtoTestimonials = dtoTestimonials.Where(t => t.Type == request.Type).ToList();
            }

            // Filter by minimum rating if specified
            if (request.MinRating.HasValue)
            {
                dtoTestimonials = dtoTestimonials.Where(t => t.Rating >= request.MinRating.Value).ToList();
            }

            // Sort by rating (highest first), then by creation date
            return dtoTestimonials
                .OrderByDescending(t => t.Rating)
                .ThenByDescending(t => t.CreatedUtc)
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting wall testimonials for project {ProjectId}", request.ProjectId);
            throw;
        }
    }
}

public class ApproveTestimonialHandler : IRequestHandler<ApproveTestimonialCommand, bool>
{
    private readonly ISupabaseClient _supabase;
    private readonly IEmailService _emailService;
    private readonly ILogger<ApproveTestimonialHandler> _logger;

    public ApproveTestimonialHandler(ISupabaseClient supabase, IEmailService emailService, ILogger<ApproveTestimonialHandler> logger)
    {
        _supabase = supabase;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<bool> Handle(ApproveTestimonialCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // First, get testimonial details before approval for email notifications
            var testimonials = await _supabase.GetTestimonialsAsync(Guid.Empty, null, 1, 100); // Get all testimonials
            var testimonial = testimonials.FirstOrDefault(t => t.Id.ToString() == request.Id);
            
            Models.Project? project = null;
            if (testimonial != null)
            {
                project = await _supabase.GetProjectAsync(testimonial.ProjectId);
            }

            var result = await _supabase.ApproveTestimonialAsync(Guid.Parse(request.Id), request.Approved);
            
            // Send email notification to customer
            if (result && testimonial != null && project != null && !string.IsNullOrEmpty(testimonial.CustomerEmail))
            {
                try
                {
                    if (request.Approved)
                    {
                        var emailData = new TestimonialApprovedEmailData(
                            ProjectName: project.Name,
                            CustomerName: testimonial.CustomerName,
                            TestimonialQuote: testimonial.Quote ?? "No message provided",
                            Rating: testimonial.Rating,
                            WallUrl: $"https://trustloops.com/wall/{project.Slug}"
                        );
                        
                        await _emailService.SendTestimonialApprovedNotificationAsync(testimonial.CustomerEmail, emailData);
                        _logger.LogInformation("Testimonial approved notification sent to customer: {Email}", testimonial.CustomerEmail);
                    }
                    else if (!string.IsNullOrEmpty(request.RejectionReason))
                    {
                        var emailData = new TestimonialRejectedEmailData(
                            ProjectName: project.Name,
                            CustomerName: testimonial.CustomerName,
                            RejectionReason: request.RejectionReason,
                            RecordNewUrl: $"https://trustloops.com/record/{project.Slug}"
                        );
                        
                        await _emailService.SendTestimonialRejectedNotificationAsync(testimonial.CustomerEmail, emailData);
                        _logger.LogInformation("Testimonial rejected notification sent to customer: {Email}", testimonial.CustomerEmail);
                    }
                }
                catch (Exception emailEx)
                {
                    _logger.LogWarning(emailEx, "Failed to send testimonial status notification email, but approval was successful");
                    // Don't fail the entire operation if email fails
                }
            }
            
            _logger.LogInformation("Testimonial {TestimonialId} {Action}", 
                request.Id, 
                request.Approved ? "approved" : "rejected");
            
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error approving testimonial {TestimonialId}", request.Id);
            throw;
        }
    }
}

public class DeleteTestimonialHandler : IRequestHandler<DeleteTestimonialCommand, bool>
{
    private readonly ISupabaseClient _supabase;
    private readonly ILogger<DeleteTestimonialHandler> _logger;

    public DeleteTestimonialHandler(ISupabaseClient supabase, ILogger<DeleteTestimonialHandler> logger)
    {
        _supabase = supabase;
        _logger = logger;
    }

    public async Task<bool> Handle(DeleteTestimonialCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _supabase.DeleteTestimonialAsync(Guid.Parse(request.Id));
            
            _logger.LogInformation("Testimonial {TestimonialId} deleted", request.Id);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting testimonial {TestimonialId}", request.Id);
            throw;
        }
    }
}

public class BulkApproveTestimonialsHandler : IRequestHandler<BulkApproveTestimonialsCommand, int>
{
    private readonly ISupabaseClient _supabase;
    private readonly ILogger<BulkApproveTestimonialsHandler> _logger;

    public BulkApproveTestimonialsHandler(ISupabaseClient supabase, ILogger<BulkApproveTestimonialsHandler> logger)
    {
        _supabase = supabase;
        _logger = logger;
    }

    public async Task<int> Handle(BulkApproveTestimonialsCommand request, CancellationToken cancellationToken)
    {
        try
        {
            int approvedCount = 0;
            
            foreach (var testimonialId in request.TestimonialIds)
            {
                var success = await _supabase.ApproveTestimonialAsync(Guid.Parse(testimonialId), request.Approved);
                if (success) approvedCount++;
            }
            
            _logger.LogInformation("Bulk approved {Count} testimonials", approvedCount);
            return approvedCount;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error bulk approving testimonials");
            throw;
        }
    }
}

public class ExportTestimonialsHandler : IRequestHandler<ExportTestimonialsQuery, string>
{
    private readonly ISupabaseClient _supabase;
    private readonly ILogger<ExportTestimonialsHandler> _logger;

    public ExportTestimonialsHandler(ISupabaseClient supabase, ILogger<ExportTestimonialsHandler> logger)
    {
        _supabase = supabase;
        _logger = logger;
    }

    public async Task<string> Handle(ExportTestimonialsQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var testimonials = await _supabase.GetTestimonialsAsync(
                Guid.Parse(request.ProjectId), 
                request.ApprovedOnly ? true : null);

            var csv = new StringBuilder();
            csv.AppendLine("Name,Email,Title,Company,Rating,Type,Quote,Created,Approved");
            
            foreach (var testimonial in testimonials)
            {
                csv.AppendLine($"\"{testimonial.CustomerName}\",\"{testimonial.CustomerEmail}\",\"{testimonial.CustomerTitle}\",\"{testimonial.CustomerCompany}\",{testimonial.Rating},\"text\",\"{testimonial.Quote}\",\"{testimonial.CreatedUtc:yyyy-MM-dd HH:mm:ss}\",{testimonial.Approved}");
            }
            
            _logger.LogInformation("Exported {Count} testimonials for project {ProjectId}", testimonials.Count, request.ProjectId);
            return csv.ToString();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting testimonials for project {ProjectId}", request.ProjectId);
            throw;
        }
    }
}
