namespace TrustLoops.Shared.DTOs;

public record TestimonialDto
{
    public Guid Id { get; init; }
    public Guid ProjectId { get; init; }
    public string Type { get; init; } = string.Empty;
    public string CustomerName { get; init; } = string.Empty;
    public string CustomerEmail { get; init; } = string.Empty;
    public string? CustomerTitle { get; init; }
    public string? CustomerCompany { get; init; }
    public string? Quote { get; init; }
    public int Rating { get; init; }
    public string? VideoUrl { get; init; }
    public string? ThumbnailUrl { get; init; }
    public bool Approved { get; init; }
    public DateTime CreatedUtc { get; init; }
    public DateTime UpdatedUtc { get; init; }
}

public record CreateTestimonialDto
{
    public Guid ProjectId { get; init; }
    public string Type { get; init; } = string.Empty;
    public string CustomerName { get; init; } = string.Empty;
    public string CustomerEmail { get; init; } = string.Empty;
    public string? CustomerTitle { get; init; }
    public string? CustomerCompany { get; init; }
    public string? Quote { get; init; }
    public int Rating { get; init; }
    public string? VideoUrl { get; init; }
    public string? ThumbnailUrl { get; init; }
    public bool Approved { get; init; }
}

public record PagedResult<T>
{
    public List<T> Items { get; init; } = new();
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasNextPage => Page < TotalPages;
    public bool HasPreviousPage => Page > 1;
}

public record ProjectDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string Slug { get; init; } = string.Empty;
    public string CallToAction { get; init; } = string.Empty;
    public Guid UserId { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
    public int TestimonialCount { get; init; }
    public int PendingCount { get; init; }
}

public record StatusPageDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string Slug { get; init; } = string.Empty;
    public Guid UserId { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
    public List<StatusComponentDto> Components { get; init; } = new();
    public List<StatusIncidentDto> RecentIncidents { get; init; } = new();
}

public record StatusComponentDto
{
    public Guid Id { get; init; }
    public Guid StatusPageId { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string Status { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public record StatusIncidentDto
{
    public Guid Id { get; init; }
    public Guid StatusPageId { get; init; }
    public string Title { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string Status { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
    public List<StatusIncidentUpdateDto> Updates { get; init; } = new();
}

public record StatusIncidentUpdateDto
{
    public Guid Id { get; init; }
    public Guid IncidentId { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? Message { get; init; }
    public DateTime CreatedAt { get; init; }
}
