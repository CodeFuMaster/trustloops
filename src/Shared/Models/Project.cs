// File: src/Shared/Models/Project.cs
namespace Shared.Models;

public class Project
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string CallToAction { get; set; } = "Share your experience";
    public DateTime CreatedUtc { get; set; }
    public DateTime UpdatedUtc { get; set; }
    public bool IsActive { get; set; } = true;
    
    // Embed settings
    public string Theme { get; set; } = "default";
    public bool AutoApprove { get; set; } = false;
    public bool ShowPoweredBy { get; set; } = true;
    
    // Relations
    public User? User { get; set; }
    public List<Testimonial> Testimonials { get; set; } = new();
}

public class CreateProjectRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? CallToAction { get; set; } = "Share your experience";
    public string? Theme { get; set; } = "default";
    public bool AutoApprove { get; set; } = false;
    public Guid UserId { get; set; }
}
