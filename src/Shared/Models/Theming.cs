namespace Shared.Models;

public class ProjectTheme
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string ThemeName { get; set; } = string.Empty;
    public string PrimaryColor { get; set; } = "#007AFF";
    public string SecondaryColor { get; set; } = "#34C759";
    public string BackgroundColor { get; set; } = "#FFFFFF";
    public string TextColor { get; set; } = "#000000";
    public string AccentColor { get; set; } = "#FF9500";
    public string FontFamily { get; set; } = "Inter, system-ui, sans-serif";
    public string? LogoUrl { get; set; }
    public string? CustomCss { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateThemeRequest
{
    public string ThemeName { get; set; } = string.Empty;
    public string? PrimaryColor { get; set; }
    public string? SecondaryColor { get; set; }
    public string? BackgroundColor { get; set; }
    public string? TextColor { get; set; }
    public string? AccentColor { get; set; }
    public string? FontFamily { get; set; }
    public string? LogoUrl { get; set; }
    public string? CustomCss { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UpdateThemeRequest
{
    public string? ThemeName { get; set; }
    public string? PrimaryColor { get; set; }
    public string? SecondaryColor { get; set; }
    public string? BackgroundColor { get; set; }
    public string? TextColor { get; set; }
    public string? AccentColor { get; set; }
    public string? FontFamily { get; set; }
    public string? LogoUrl { get; set; }
    public string? CustomCss { get; set; }
}

public class SocialShareRequest
{
    public Guid TestimonialId { get; set; }
    public string Platform { get; set; } = string.Empty; // twitter, linkedin, facebook
    public string? CustomMessage { get; set; }
    public string? VisitorId { get; set; }
}

public class SocialShareResult
{
    public string ShareUrl { get; set; } = string.Empty;
    public string Platform { get; set; } = string.Empty;
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
}

public class TestimonialFilter
{
    public string? Search { get; set; }
    public int? MinRating { get; set; }
    public int? MaxRating { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool? Approved { get; set; }
    public string? SortBy { get; set; } // rating, date, name
    public string? SortDirection { get; set; } // asc, desc
    public List<string>? Tags { get; set; }
}
