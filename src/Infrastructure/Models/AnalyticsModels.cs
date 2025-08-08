using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace Infrastructure.Models;

[Table("testimonial_views")]
public class SupabaseTestimonialView : BaseModel
{
    [PrimaryKey("id")]
    public Guid Id { get; set; }

    [Column("testimonial_id")]
    public Guid TestimonialId { get; set; }

    [Column("project_id")]
    public Guid ProjectId { get; set; }

    [Column("visitor_id")]
    public string? VisitorId { get; set; }

    [Column("ip_address")]
    public string? IpAddress { get; set; }

    [Column("user_agent")]
    public string? UserAgent { get; set; }

    [Column("referrer")]
    public string? Referrer { get; set; }

    [Column("country")]
    public string? Country { get; set; }

    [Column("created_utc")]
    public DateTime CreatedAt { get; set; }
}

[Table("testimonial_shares")]
public class SupabaseTestimonialShare : BaseModel
{
    [PrimaryKey("id")]
    public Guid Id { get; set; }

    [Column("testimonial_id")]
    public Guid TestimonialId { get; set; }

    [Column("project_id")]
    public Guid ProjectId { get; set; }

    [Column("platform")]
    public string Platform { get; set; } = string.Empty; // twitter, linkedin, facebook, etc.

    [Column("visitor_id")]
    public string? VisitorId { get; set; }

    [Column("created_utc")]
    public DateTime CreatedAt { get; set; }
}

[Table("project_themes")]
public class SupabaseProjectTheme : BaseModel
{
    [PrimaryKey("id")]
    public Guid Id { get; set; }

    [Column("project_id")]
    public Guid ProjectId { get; set; }

    [Column("theme_name")]
    public string ThemeName { get; set; } = string.Empty;

    [Column("primary_color")]
    public string PrimaryColor { get; set; } = "#007AFF";

    [Column("secondary_color")]
    public string SecondaryColor { get; set; } = "#34C759";

    [Column("background_color")]
    public string BackgroundColor { get; set; } = "#FFFFFF";

    [Column("text_color")]
    public string TextColor { get; set; } = "#000000";

    [Column("accent_color")]
    public string AccentColor { get; set; } = "#FF9500";

    [Column("font_family")]
    public string FontFamily { get; set; } = "Inter, system-ui, sans-serif";

    [Column("logo_url")]
    public string? LogoUrl { get; set; }

    [Column("custom_css")]
    public string? CustomCss { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_utc")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_utc")]
    public DateTime UpdatedAt { get; set; }
}
