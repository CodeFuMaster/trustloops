using Microsoft.Extensions.Logging;
using Shared.Models;
using System.Web;
using TrustLoops.Infrastructure.Services;

namespace Infrastructure.Services;

public interface ISocialSharingService
{
    Task<SocialShareResult> GenerateShareUrlAsync(SocialShareRequest request);
    Task<string> GenerateShareContentAsync(Guid testimonialId, string? customMessage = null);
    Task<Dictionary<string, string>> GetAllSocialShareUrlsAsync(Guid testimonialId, string? customMessage = null);
}

public class SocialSharingService : ISocialSharingService
{
    private readonly ISupabaseClient _supabaseClient;
    private readonly IAnalyticsService _analyticsService;
    private readonly ILogger<SocialSharingService> _logger;

    private readonly Dictionary<string, string> _platformTemplates = new()
    {
        { "twitter", "https://twitter.com/intent/tweet?text={text}&url={url}" },
        { "linkedin", "https://www.linkedin.com/sharing/share-offsite/?url={url}" },
        { "facebook", "https://www.facebook.com/sharer/sharer.php?u={url}&quote={text}" },
        { "reddit", "https://reddit.com/submit?url={url}&title={text}" },
        { "whatsapp", "https://wa.me/?text={text}%20{url}" },
        { "telegram", "https://t.me/share/url?url={url}&text={text}" }
    };

    public SocialSharingService(
        ISupabaseClient supabaseClient, 
        IAnalyticsService analyticsService,
        ILogger<SocialSharingService> logger)
    {
        _supabaseClient = supabaseClient;
        _analyticsService = analyticsService;
        _logger = logger;
    }

    public async Task<SocialShareResult> GenerateShareUrlAsync(SocialShareRequest request)
    {
        try
        {
            var testimonial = await GetTestimonialAsync(request.TestimonialId);
            if (testimonial == null)
            {
                return new SocialShareResult
                {
                    Success = false,
                    ErrorMessage = "Testimonial not found",
                    Platform = request.Platform
                };
            }

            var project = await _supabaseClient.GetProjectAsync(testimonial.ProjectId);
            if (project == null)
            {
                return new SocialShareResult
                {
                    Success = false,
                    ErrorMessage = "Project not found",
                    Platform = request.Platform
                };
            }

            var shareText = request.CustomMessage ?? await GenerateShareContentAsync(request.TestimonialId, request.CustomMessage);
            var testimonialUrl = $"https://trustloops.app/testimonials/{project.Slug}/{testimonial.Id}";

            var platform = request.Platform.ToLowerInvariant();
            if (!_platformTemplates.ContainsKey(platform))
            {
                return new SocialShareResult
                {
                    Success = false,
                    ErrorMessage = $"Unsupported platform: {request.Platform}",
                    Platform = request.Platform
                };
            }

            var shareUrl = _platformTemplates[platform]
                .Replace("{text}", HttpUtility.UrlEncode(shareText))
                .Replace("{url}", HttpUtility.UrlEncode(testimonialUrl));

            // Track the share action
            await _analyticsService.TrackTestimonialShareAsync(request.TestimonialId, testimonial.ProjectId, platform, request.VisitorId);

            _logger.LogInformation("Generated share URL for testimonial {TestimonialId} on {Platform}", request.TestimonialId, request.Platform);

            return new SocialShareResult
            {
                ShareUrl = shareUrl,
                Platform = request.Platform,
                Success = true
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating share URL for testimonial {TestimonialId}", request.TestimonialId);
            return new SocialShareResult
            {
                Success = false,
                ErrorMessage = ex.Message,
                Platform = request.Platform
            };
        }
    }

    public async Task<string> GenerateShareContentAsync(Guid testimonialId, string? customMessage = null)
    {
        try
        {
            if (!string.IsNullOrEmpty(customMessage))
            {
                return customMessage;
            }

            var testimonial = await GetTestimonialAsync(testimonialId);
            if (testimonial == null) return "Check out this amazing testimonial!";

            var project = await _supabaseClient.GetProjectAsync(testimonial.ProjectId);
            if (project == null) return "Check out this amazing testimonial!";

            var ratingStars = new string('⭐', testimonial.Rating);
            
            var shareText = $"Amazing feedback! {ratingStars}\n\n";
            
            if (!string.IsNullOrEmpty(testimonial.Quote) && testimonial.Quote.Length > 100)
            {
                shareText += $"\"{testimonial.Quote.Substring(0, 97)}...\"\n\n";
            }
            else if (!string.IsNullOrEmpty(testimonial.Quote))
            {
                shareText += $"\"{testimonial.Quote}\"\n\n";
            }

            shareText += $"- {testimonial.CustomerName}";
            
            if (!string.IsNullOrEmpty(testimonial.CustomerTitle) || !string.IsNullOrEmpty(testimonial.CustomerCompany))
            {
                shareText += ", ";
                if (!string.IsNullOrEmpty(testimonial.CustomerTitle))
                {
                    shareText += testimonial.CustomerTitle;
                }
                if (!string.IsNullOrEmpty(testimonial.CustomerCompany))
                {
                    if (!string.IsNullOrEmpty(testimonial.CustomerTitle))
                    {
                        shareText += " at ";
                    }
                    shareText += testimonial.CustomerCompany;
                }
            }

            shareText += $"\n\n#{project.Name.Replace(" ", "")} #Testimonial #CustomerFeedback";

            return shareText;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating share content for testimonial {TestimonialId}", testimonialId);
            return "Check out this amazing testimonial!";
        }
    }

    public async Task<Dictionary<string, string>> GetAllSocialShareUrlsAsync(Guid testimonialId, string? customMessage = null)
    {
        var shareUrls = new Dictionary<string, string>();
        
        foreach (var platform in _platformTemplates.Keys)
        {
            try
            {
                var request = new SocialShareRequest
                {
                    TestimonialId = testimonialId,
                    Platform = platform,
                    CustomMessage = customMessage
                };

                var result = await GenerateShareUrlAsync(request);
                if (result.Success)
                {
                    shareUrls[platform] = result.ShareUrl;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating share URL for platform {Platform}", platform);
            }
        }

        return shareUrls;
    }

    private async Task<Shared.Models.Testimonial?> GetTestimonialAsync(Guid testimonialId)
    {
        try
        {
            return await _supabaseClient.GetTestimonialByIdAsync(testimonialId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting testimonial {TestimonialId}", testimonialId);
            return null;
        }
    }
}
