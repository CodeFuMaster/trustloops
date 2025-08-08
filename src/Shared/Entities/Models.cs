namespace Shared.Entities;

public record Project
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Slug { get; init; } = string.Empty;
    public string? Description { get; init; }
    public Guid UserId { get; init; }
    public DateTime CreatedUtc { get; init; }
    public DateTime UpdatedUtc { get; init; }
    
    // Navigation properties
    public ICollection<Testimonial> Testimonials { get; init; } = new List<Testimonial>();
}

public record Testimonial
{
    public Guid Id { get; init; }
    public Guid ProjectId { get; init; }
    public string CustomerName { get; init; } = string.Empty;
    public string? CustomerEmail { get; init; }
    public string? CustomerTitle { get; init; }
    public string? CustomerCompany { get; init; }
    public string? Quote { get; init; }
    public string? VideoUrl { get; init; }
    public string? ThumbnailUrl { get; init; }
    public int Rating { get; init; } = 5;
    public bool Approved { get; init; } = false;
    public DateTime CreatedUtc { get; init; }
    public DateTime UpdatedUtc { get; init; }
    // AI enrichment
    public string? Transcript { get; init; }
    public string? Summary { get; init; }
    public string? Sentiment { get; init; }
    public string[]? Tags { get; init; }
    public string? CaptionsUrl { get; init; }
    
    // Navigation properties
    public Project? Project { get; init; }
}
