// File: src/Shared/Models/Testimonial.cs
namespace Shared.Models;

public class Testimonial
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string? Quote { get; set; } // Text content for testimonials
    public string? VideoUrl { get; set; } // Video file URL for video testimonials
    public string? ThumbnailUrl { get; set; } // Video thumbnail URL
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerEmail { get; set; }
    public string? CustomerTitle { get; set; }
    public string? CustomerCompany { get; set; }
    public int Rating { get; set; } = 5; // 1-5 star rating
    public bool Approved { get; set; } = false;
    public DateTime CreatedUtc { get; set; }
    public DateTime UpdatedUtc { get; set; }

    // AI enrichment fields (TASK 3)
    public string? Transcript { get; set; }
    public string? Summary { get; set; }
    public string? Sentiment { get; set; }
    public string[]? Tags { get; set; }
    public string? CaptionsUrl { get; set; }
    
    // Relations
    public Project? Project { get; set; }
}

public class CreateTestimonialRequest
{
    public Guid ProjectId { get; set; }
    public string? Quote { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerEmail { get; set; }
    public string? CustomerTitle { get; set; }
    public string? CustomerCompany { get; set; }
    public int Rating { get; set; } = 5;
    // Video file will be handled via multipart form data
}
