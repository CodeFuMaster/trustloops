using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace Infrastructure.Models;

[Table("users")]
public class SupabaseUser : BaseModel
{
    [PrimaryKey("id")]
    public Guid Id { get; set; }

    [Column("email")]
    public string Email { get; set; } = string.Empty;

    [Column("customer_id")]
    public string? CustomerId { get; set; }

    [Column("subscription_id")]
    public string? SubscriptionId { get; set; }

    [Column("plan_type")]
    public string? PlanType { get; set; }

    [Column("created_utc")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_utc")]
    public DateTime UpdatedAt { get; set; }
}

[Table("projects")]
public class SupabaseProject : BaseModel
{
    [PrimaryKey("id")]
    public Guid Id { get; set; }

    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("slug")]
    public string Slug { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Column("call_to_action")]
    public string CallToAction { get; set; } = "Share your experience";

    [Column("user_id")]
    public Guid UserId { get; set; }

    [Column("created_utc")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_utc")]
    public DateTime UpdatedAt { get; set; }
}

[Table("testimonials")]
public class SupabaseTestimonial : BaseModel
{
    [PrimaryKey("id")]
    public Guid Id { get; set; }

    [Column("project_id")]
    public Guid ProjectId { get; set; }

    [Column("customer_name")]
    public string CustomerName { get; set; } = string.Empty;

    [Column("customer_email")]
    public string? CustomerEmail { get; set; }

    [Column("customer_title")]
    public string? CustomerTitle { get; set; }

    [Column("customer_company")]
    public string? CustomerCompany { get; set; }

    [Column("quote")]
    public string? Quote { get; set; }

    [Column("video_url")]
    public string? VideoUrl { get; set; }

    [Column("thumbnail_url")]
    public string? ThumbnailUrl { get; set; }

    [Column("rating")]
    public int Rating { get; set; } = 5;

    [Column("approved")]
    public bool Approved { get; set; } = false;

    [Column("created_utc")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_utc")]
    public DateTime UpdatedAt { get; set; }

    // AI enrichment columns
    [Column("transcript")]
    public string? Transcript { get; set; }

    [Column("summary")]
    public string? Summary { get; set; }

    [Column("sentiment")]
    public string? Sentiment { get; set; }

    [Column("tags")]
    public string[]? Tags { get; set; }

    [Column("captions_url")]
    public string? CaptionsUrl { get; set; }
}

[Table("ai_jobs")]
public class SupabaseAiJob : BaseModel
{
    [PrimaryKey("id")]
    public Guid Id { get; set; }

    [Column("testimonial_id")]
    public Guid TestimonialId { get; set; }

    [Column("status")]
    public string Status { get; set; } = "queued"; // queued, processing, done, failed

    [Column("error")]
    public string? Error { get; set; }

    [Column("created_utc")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_utc")]
    public DateTime UpdatedAt { get; set; }
}
