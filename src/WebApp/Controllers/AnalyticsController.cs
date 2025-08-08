using Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Models = Shared.Models;

namespace WebApp.Controllers;

[ApiController]
[Route("api/analytics")]
[Authorize]
public class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _analyticsService;
    private readonly ILogger<AnalyticsController> _logger;

    public AnalyticsController(IAnalyticsService analyticsService, ILogger<AnalyticsController> logger)
    {
        _analyticsService = analyticsService;
        _logger = logger;
    }

    [HttpGet("project/{projectId}")]
    public async Task<ActionResult<Models.TestimonialAnalytics>> GetProjectAnalytics(
        Guid projectId,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        try
        {
            var analytics = await _analyticsService.GetProjectAnalyticsAsync(projectId, startDate, endDate);
            return Ok(analytics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting analytics for project {ProjectId}", projectId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("project/{projectId}/top-performers")]
    public async Task<ActionResult<List<Models.EngagementMetrics>>> GetTopPerformers(
        Guid projectId,
        [FromQuery] int limit = 10)
    {
        try
        {
            var topPerformers = await _analyticsService.GetTopPerformingTestimonialsAsync(projectId, limit);
            return Ok(topPerformers);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting top performers for project {ProjectId}", projectId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("project/{projectId}/conversion")]
    public async Task<ActionResult<Models.ConversionMetrics>> GetConversionMetrics(
        Guid projectId,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        try
        {
            var metrics = await _analyticsService.GetConversionMetricsAsync(projectId, startDate, endDate);
            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting conversion metrics for project {ProjectId}", projectId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("project/{projectId}/trends")]
    public async Task<ActionResult<List<Models.MonthlyStats>>> GetMonthlyTrends(
        Guid projectId,
        [FromQuery] int months = 12)
    {
        try
        {
            var trends = await _analyticsService.GetMonthlyTrendsAsync(projectId, months);
            return Ok(trends);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting monthly trends for project {ProjectId}", projectId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("testimonial/{testimonialId}/view")]
    [AllowAnonymous]
    public async Task<IActionResult> TrackView(
        Guid testimonialId,
        [FromBody] TrackViewRequest request)
    {
        try
        {
            var userAgent = Request.Headers.UserAgent.ToString();
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            var referrer = Request.Headers.Referer.ToString();

            await _analyticsService.TrackTestimonialViewAsync(
                testimonialId,
                request.ProjectId,
                request.VisitorId,
                ipAddress,
                userAgent,
                referrer);

            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error tracking view for testimonial {TestimonialId}", testimonialId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("testimonial/{testimonialId}/share")]
    [AllowAnonymous]
    public async Task<IActionResult> TrackShare(
        Guid testimonialId,
        [FromBody] TrackShareRequest request)
    {
        try
        {
            await _analyticsService.TrackTestimonialShareAsync(
                testimonialId,
                request.ProjectId,
                request.Platform,
                request.VisitorId);

            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error tracking share for testimonial {TestimonialId}", testimonialId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("project/{projectId}/pixel")]
    [AllowAnonymous]
    public async Task<IActionResult> TrackProjectPixel(Guid projectId)
    {
        try
        {
            var userAgent = Request.Headers.UserAgent.ToString();
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            var referrer = Request.Headers.Referer.ToString();
            var vid = Request.Query["v"].ToString();

            await _analyticsService.TrackProjectViewAsync(projectId, vid, ipAddress, userAgent, referrer);

            // Return a 1x1 transparent gif
            var pixel = new byte[]
            {
                71,73,70,56,57,97,1,0,1,0,128,0,0,0,0,0,255,255,255,33,249,4,1,0,0,1,0,44,0,0,0,0,1,0,1,0,0,2,2,68,1,0,59
            };
            return File(pixel, "image/gif");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error tracking project pixel for {ProjectId}", projectId);
            return StatusCode(500, "Internal server error");
        }
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
    }
}

public class TrackViewRequest
{
    public Guid ProjectId { get; set; }
    public string? VisitorId { get; set; }
}

public class TrackShareRequest
{
    public Guid ProjectId { get; set; }
    public string Platform { get; set; } = string.Empty;
    public string? VisitorId { get; set; }
}
