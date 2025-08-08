namespace Shared.Models;

public class TestimonialAnalytics
{
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public int TotalTestimonials { get; set; }
    public int ApprovedTestimonials { get; set; }
    public int PendingTestimonials { get; set; }
    public double AverageRating { get; set; }
    public int TotalViews { get; set; }
    public int TotalShares { get; set; }
    public DateTime LastTestimonialDate { get; set; }
    public List<RatingBreakdown> RatingDistribution { get; set; } = new();
    public List<MonthlyStats> MonthlyTrends { get; set; } = new();
    public List<TopTestimonial> TopPerformers { get; set; } = new();
}

public class RatingBreakdown
{
    public int Rating { get; set; }
    public int Count { get; set; }
    public double Percentage { get; set; }
}

public class MonthlyStats
{
    public string Month { get; set; } = string.Empty;
    public int TestimonialCount { get; set; }
    public int Views { get; set; }
    public int Shares { get; set; }
    public double AverageRating { get; set; }
}

public class TopTestimonial
{
    public Guid Id { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string Quote { get; set; } = string.Empty;
    public int Rating { get; set; }
    public int Views { get; set; }
    public int Shares { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class EngagementMetrics
{
    public Guid TestimonialId { get; set; }
    public int Views { get; set; }
    public int Shares { get; set; }
    public int Likes { get; set; }
    public DateTime LastViewedAt { get; set; }
    public List<string> ReferrerSources { get; set; } = new();
}

public class ConversionMetrics
{
    public Guid ProjectId { get; set; }
    public int TestimonialWallViews { get; set; }
    public int ClickThroughs { get; set; }
    public double ConversionRate { get; set; }
    public List<ConversionFunnel> FunnelSteps { get; set; } = new();
}

public class ConversionFunnel
{
    public string Step { get; set; } = string.Empty;
    public int Count { get; set; }
    public double DropoffRate { get; set; }
}
