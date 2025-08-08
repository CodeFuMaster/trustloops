using Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models = Shared.Models;

namespace WebApp.Controllers;

[ApiController]
[Route("api/social")]
public class SocialController : ControllerBase
{
    private readonly ISocialSharingService _socialSharingService;
    private readonly ILogger<SocialController> _logger;

    public SocialController(ISocialSharingService socialSharingService, ILogger<SocialController> logger)
    {
        _socialSharingService = socialSharingService;
        _logger = logger;
    }

    [HttpPost("share")]
    [AllowAnonymous]
    public async Task<ActionResult<Models.SocialShareResult>> GenerateShareUrl([FromBody] Models.SocialShareRequest request)
    {
        try
        {
            var result = await _socialSharingService.GenerateShareUrlAsync(request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating share URL for testimonial {TestimonialId}", request.TestimonialId);
            return StatusCode(500, new Models.SocialShareResult
            {
                Success = false,
                ErrorMessage = "Internal server error",
                Platform = request.Platform
            });
        }
    }

    [HttpGet("testimonial/{testimonialId}/share-urls")]
    [AllowAnonymous]
    public async Task<ActionResult<Dictionary<string, string>>> GetAllShareUrls(
        Guid testimonialId,
        [FromQuery] string? customMessage = null)
    {
        try
        {
            var shareUrls = await _socialSharingService.GetAllSocialShareUrlsAsync(testimonialId, customMessage);
            return Ok(shareUrls);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting share URLs for testimonial {TestimonialId}", testimonialId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("testimonial/{testimonialId}/share-content")]
    [AllowAnonymous]
    public async Task<ActionResult<string>> GenerateShareContent(
        Guid testimonialId,
        [FromQuery] string? customMessage = null)
    {
        try
        {
            var content = await _socialSharingService.GenerateShareContentAsync(testimonialId, customMessage);
            return Ok(new { content });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating share content for testimonial {TestimonialId}", testimonialId);
            return StatusCode(500, "Internal server error");
        }
    }
}
