using Infrastructure.Models;
using Microsoft.Extensions.Logging;
using Shared.Models;
using TrustLoops.Infrastructure.Services;

namespace Infrastructure.Services;

public interface IAnalyticsService
{
    Task TrackTestimonialViewAsync(Guid testimonialId, Guid projectId, string? visitorId = null, string? ipAddress = null, string? userAgent = null, string? referrer = null);
    Task TrackTestimonialShareAsync(Guid testimonialId, Guid projectId, string platform, string? visitorId = null);
    Task<TestimonialAnalytics> GetProjectAnalyticsAsync(Guid projectId, DateTime? startDate = null, DateTime? endDate = null);
    Task<List<EngagementMetrics>> GetTopPerformingTestimonialsAsync(Guid projectId, int limit = 10);
    Task<ConversionMetrics> GetConversionMetricsAsync(Guid projectId, DateTime? startDate = null, DateTime? endDate = null);
    Task<List<MonthlyStats>> GetMonthlyTrendsAsync(Guid projectId, int months = 12);
}

public class AnalyticsService : IAnalyticsService
{
    private readonly ISupabaseClient _supabaseClient;
    private readonly ILogger<AnalyticsService> _logger;
    private readonly Supabase.Client _client;

    public AnalyticsService(ISupabaseClient supabaseClient, ILogger<AnalyticsService> logger, Supabase.Client client)
    {
        _supabaseClient = supabaseClient;
        _logger = logger;
        _client = client;
    }

    public async Task TrackTestimonialViewAsync(Guid testimonialId, Guid projectId, string? visitorId = null, string? ipAddress = null, string? userAgent = null, string? referrer = null)
    {
        try
        {
            var view = new SupabaseTestimonialView
            {
                Id = Guid.NewGuid(),
                TestimonialId = testimonialId,
                ProjectId = projectId,
                VisitorId = visitorId,
                IpAddress = ipAddress,
                UserAgent = userAgent,
                Referrer = referrer,
                CreatedAt = DateTime.UtcNow
            };

            await _client
                .From<SupabaseTestimonialView>()
                .Insert(view);

            _logger.LogInformation("Tracked testimonial view: {TestimonialId}", testimonialId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error tracking testimonial view: {TestimonialId}", testimonialId);
        }
    }

    public async Task TrackTestimonialShareAsync(Guid testimonialId, Guid projectId, string platform, string? visitorId = null)
    {
        try
        {
            var share = new SupabaseTestimonialShare
            {
                Id = Guid.NewGuid(),
                TestimonialId = testimonialId,
                ProjectId = projectId,
                Platform = platform.ToLowerInvariant(),
                VisitorId = visitorId,
                CreatedAt = DateTime.UtcNow
            };

            await _client
                .From<SupabaseTestimonialShare>()
                .Insert(share);

            _logger.LogInformation("Tracked testimonial share: {TestimonialId} on {Platform}", testimonialId, platform);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error tracking testimonial share: {TestimonialId}", testimonialId);
        }
    }

    public async Task<TestimonialAnalytics> GetProjectAnalyticsAsync(Guid projectId, DateTime? startDate = null, DateTime? endDate = null)
    {
        try
        {
            startDate ??= DateTime.UtcNow.AddMonths(-6);
            endDate ??= DateTime.UtcNow;

            // Get project info
            var project = await _supabaseClient.GetProjectAsync(projectId);
            if (project == null)
            {
                throw new ArgumentException($"Project not found: {projectId}");
            }

            // Get all testimonials for the project
            var testimonials = await _supabaseClient.GetTestimonialsAsync(projectId, null, 1, 1000);
            var approvedTestimonials = testimonials.Where(t => t.Approved).ToList();
            var pendingTestimonials = testimonials.Where(t => !t.Approved).ToList();

            // Get view counts
            var views = await _client
                .From<SupabaseTestimonialView>()
                .Where(v => v.ProjectId == projectId && v.CreatedAt >= startDate && v.CreatedAt <= endDate)
                .Get();

            var shares = await _client
                .From<SupabaseTestimonialShare>()
                .Where(s => s.ProjectId == projectId && s.CreatedAt >= startDate && s.CreatedAt <= endDate)
                .Get();

            // Calculate rating distribution
            var ratingDistribution = testimonials
                .GroupBy(t => t.Rating)
                .Select(g => new RatingBreakdown
                {
                    Rating = g.Key,
                    Count = g.Count(),
                    Percentage = (double)g.Count() / testimonials.Count * 100
                })
                .OrderBy(r => r.Rating)
                .ToList();

            // Calculate monthly trends
            var monthlyTrends = await GetMonthlyTrendsAsync(projectId, 6);

            // Get top performers
            var topPerformers = await GetTopPerformingTestimonialsAsync(projectId, 5);

            return new TestimonialAnalytics
            {
                ProjectId = projectId,
                ProjectName = project.Name,
                TotalTestimonials = testimonials.Count,
                ApprovedTestimonials = approvedTestimonials.Count,
                PendingTestimonials = pendingTestimonials.Count,
                AverageRating = testimonials.Any() ? testimonials.Average(t => t.Rating) : 0,
                TotalViews = views?.Models?.Count ?? 0,
                TotalShares = shares?.Models?.Count ?? 0,
                LastTestimonialDate = testimonials.Any() ? testimonials.Max(t => t.CreatedUtc) : DateTime.MinValue,
                RatingDistribution = ratingDistribution,
                MonthlyTrends = monthlyTrends,
                TopPerformers = topPerformers.Select(t => new TopTestimonial
                {
                    Id = t.TestimonialId,
                    CustomerName = "", // Will be populated from testimonials
                    Quote = "",
                    Rating = 0,
                    Views = t.Views,
                    Shares = t.Shares,
                    CreatedAt = DateTime.UtcNow
                }).ToList()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting project analytics: {ProjectId}", projectId);
            throw;
        }
    }

    public async Task<List<EngagementMetrics>> GetTopPerformingTestimonialsAsync(Guid projectId, int limit = 10)
    {
        try
        {
            var views = await _client
                .From<SupabaseTestimonialView>()
                .Where(v => v.ProjectId == projectId)
                .Get();

            var shares = await _client
                .From<SupabaseTestimonialShare>()
                .Where(s => s.ProjectId == projectId)
                .Get();

            var testimonialMetrics = new Dictionary<Guid, EngagementMetrics>();

            // Process views
            if (views?.Models != null)
            {
                foreach (var viewGroup in views.Models.GroupBy(v => v.TestimonialId))
                {
                    testimonialMetrics[viewGroup.Key] = new EngagementMetrics
                    {
                        TestimonialId = viewGroup.Key,
                        Views = viewGroup.Count(),
                        Shares = 0,
                        Likes = 0,
                        LastViewedAt = viewGroup.Max(v => v.CreatedAt),
                        ReferrerSources = viewGroup
                            .Where(v => !string.IsNullOrEmpty(v.Referrer))
                            .Select(v => v.Referrer!)
                            .Distinct()
                            .ToList()
                    };
                }
            }

            // Process shares
            if (shares?.Models != null)
            {
                foreach (var shareGroup in shares.Models.GroupBy(s => s.TestimonialId))
                {
                    if (testimonialMetrics.ContainsKey(shareGroup.Key))
                    {
                        testimonialMetrics[shareGroup.Key].Shares = shareGroup.Count();
                    }
                    else
                    {
                        testimonialMetrics[shareGroup.Key] = new EngagementMetrics
                        {
                            TestimonialId = shareGroup.Key,
                            Views = 0,
                            Shares = shareGroup.Count(),
                            Likes = 0,
                            LastViewedAt = DateTime.UtcNow
                        };
                    }
                }
            }

            return testimonialMetrics.Values
                .OrderByDescending(m => m.Views + m.Shares * 3) // Weight shares more heavily
                .Take(limit)
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting top performing testimonials: {ProjectId}", projectId);
            return new List<EngagementMetrics>();
        }
    }

    public async Task<ConversionMetrics> GetConversionMetricsAsync(Guid projectId, DateTime? startDate = null, DateTime? endDate = null)
    {
        try
        {
            startDate ??= DateTime.UtcNow.AddMonths(-1);
            endDate ??= DateTime.UtcNow;

            var views = await _client
                .From<SupabaseTestimonialView>()
                .Where(v => v.ProjectId == projectId && v.CreatedAt >= startDate && v.CreatedAt <= endDate)
                .Get();

            var shares = await _client
                .From<SupabaseTestimonialShare>()
                .Where(s => s.ProjectId == projectId && s.CreatedAt >= startDate && s.CreatedAt <= endDate)
                .Get();

            var totalViews = views?.Models?.Count ?? 0;
            var totalShares = shares?.Models?.Count ?? 0;

            return new ConversionMetrics
            {
                ProjectId = projectId,
                TestimonialWallViews = totalViews,
                ClickThroughs = totalShares, // Simplified - shares as proxy for CTR
                ConversionRate = totalViews > 0 ? (double)totalShares / totalViews * 100 : 0,
                FunnelSteps = new List<ConversionFunnel>
                {
                    new() { Step = "Testimonial Wall Visits", Count = totalViews, DropoffRate = 0 },
                    new() { Step = "Testimonial Interactions", Count = totalShares, DropoffRate = totalViews > 0 ? (1.0 - (double)totalShares / totalViews) * 100 : 0 }
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting conversion metrics: {ProjectId}", projectId);
            throw;
        }
    }

    public async Task<List<MonthlyStats>> GetMonthlyTrendsAsync(Guid projectId, int months = 12)
    {
        try
        {
            var startDate = DateTime.UtcNow.AddMonths(-months);
            
            var testimonials = await _supabaseClient.GetTestimonialsAsync(projectId, null, 1, 1000);
            var views = await _client
                .From<SupabaseTestimonialView>()
                .Where(v => v.ProjectId == projectId && v.CreatedAt >= startDate)
                .Get();
            
            var shares = await _client
                .From<SupabaseTestimonialShare>()
                .Where(s => s.ProjectId == projectId && s.CreatedAt >= startDate)
                .Get();

            var monthlyStats = new List<MonthlyStats>();

            for (int i = months - 1; i >= 0; i--)
            {
                var monthStart = DateTime.UtcNow.AddMonths(-i).AddDays(-DateTime.UtcNow.Day + 1);
                var monthEnd = monthStart.AddMonths(1).AddDays(-1);
                
                var monthTestimonials = testimonials.Where(t => t.CreatedUtc >= monthStart && t.CreatedUtc <= monthEnd).ToList();
                var monthViews = views?.Models?.Where(v => v.CreatedAt >= monthStart && v.CreatedAt <= monthEnd).Count() ?? 0;
                var monthShares = shares?.Models?.Where(s => s.CreatedAt >= monthStart && s.CreatedAt <= monthEnd).Count() ?? 0;

                monthlyStats.Add(new MonthlyStats
                {
                    Month = monthStart.ToString("MMM yyyy"),
                    TestimonialCount = monthTestimonials.Count,
                    Views = monthViews,
                    Shares = monthShares,
                    AverageRating = monthTestimonials.Any() ? monthTestimonials.Average(t => t.Rating) : 0
                });
            }

            return monthlyStats;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting monthly trends: {ProjectId}", projectId);
            return new List<MonthlyStats>();
        }
    }
}
