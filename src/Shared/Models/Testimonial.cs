// File: src/Shared/Models/Testimonial.cs
namespace Shared.Models;

public class Testimonial
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string Type { get; set; } = "text"; // "text" or "video"
    public string? Content { get; set; } // Text content for text testimonials
    public string? VideoUrl { get; set; } // Video file URL for video testimonials
    public string? ThumbnailUrl { get; set; } // Video thumbnail URL
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerEmail { get; set; }
    public string? CustomerTitle { get; set; }
    public string? CustomerCompany { get; set; }
    public string? CustomerAvatarUrl { get; set; }
    public int Rating { get; set; } = 5; // 1-5 star rating
    public TestimonialStatus Status { get; set; } = TestimonialStatus.Pending;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
    
    // Relations
    public Project? Project { get; set; }
}

public enum TestimonialStatus
{
    Pending,
    Approved,
    Rejected,
    Archived
}

public class CreateTestimonialRequest
{
    public Guid ProjectId { get; set; }
    public string Type { get; set; } = "text";
    public string? Content { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerEmail { get; set; }
    public string? CustomerTitle { get; set; }
    public string? CustomerCompany { get; set; }
    public int Rating { get; set; } = 5;
    // Video file will be handled via multipart form data
}
