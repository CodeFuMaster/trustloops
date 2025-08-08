using MediatR;
using TrustLoops.Shared.DTOs;

namespace TrustLoops.WebApp.Features.Status;

// Status Page Commands
public record CreateStatusPageCommand : IRequest<StatusPageDto>
{
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string Slug { get; init; } = string.Empty;
    public bool IsPublic { get; init; }
    public string? CustomDomain { get; init; }
    public string? LogoUrl { get; init; }
    public string? PrimaryColor { get; init; }
}

public record UpdateStatusPageCommand : IRequest<bool>
{
    public string Id { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public bool IsPublic { get; init; }
    public string? LogoUrl { get; init; }
    public string? PrimaryColor { get; init; }
}

public record DeleteStatusPageCommand : IRequest<bool>
{
    public string Id { get; init; } = string.Empty;
}

// Component Commands
public record AddComponentCommand : IRequest<ComponentDto>
{
    public string StatusPageId { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string Status { get; init; } = "operational";
}

public record UpdateComponentStatusCommand : IRequest<ComponentDto?>
{
    public string Id { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string? StatusMessage { get; init; }
}

public record DeleteComponentCommand : IRequest<bool>
{
    public string Id { get; init; } = string.Empty;
}

// Incident Commands
public record CreateIncidentCommand : IRequest<IncidentDto>
{
    public string StatusPageId { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string Status { get; init; } = "investigating";
    public string Impact { get; init; } = "minor";
    public List<string> AffectedComponentIds { get; init; } = new();
}

public record AddIncidentUpdateCommand : IRequest<IncidentDto?>
{
    public string IncidentId { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
}

public record ResolveIncidentCommand : IRequest<IncidentDto?>
{
    public string Id { get; init; } = string.Empty;
    public string ResolutionMessage { get; init; } = string.Empty;
}

public record SubscribeToUpdatesCommand : IRequest<bool>
{
    public string StatusPageId { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
}

// Queries
public record ListStatusPagesQuery : IRequest<List<StatusPageDto>>;

public record GetStatusPageQuery : IRequest<StatusPageDto?>
{
    public string Id { get; init; } = string.Empty;
}

public record GetPublicStatusPageQuery : IRequest<PublicStatusPageDto?>
{
    public string Slug { get; init; } = string.Empty;
}

public record GetStatusFeedQuery : IRequest<StatusFeedDto?>
{
    public string Slug { get; init; } = string.Empty;
}

// Response DTOs
public record StatusPageDto
{
    public string Id { get; init; } = string.Empty;
    public string UserId { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string Slug { get; init; } = string.Empty;
    public bool IsPublic { get; init; }
    public string? CustomDomain { get; init; }
    public string? LogoUrl { get; init; }
    public string? PrimaryColor { get; init; }
    public DateTime CreatedUtc { get; init; }
    public DateTime UpdatedUtc { get; init; }
    public List<ComponentDto> Components { get; init; } = new();
    public List<IncidentDto> RecentIncidents { get; init; } = new();
}

public record ComponentDto
{
    public string Id { get; init; } = string.Empty;
    public string StatusPageId { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? StatusMessage { get; init; }
    public DateTime CreatedUtc { get; init; }
    public DateTime UpdatedUtc { get; init; }
}

public record IncidentDto
{
    public string Id { get; init; } = string.Empty;
    public string StatusPageId { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string Impact { get; init; } = string.Empty;
    public bool IsResolved { get; init; }
    public DateTime CreatedUtc { get; init; }
    public DateTime? ResolvedUtc { get; init; }
    public List<string> AffectedComponentIds { get; init; } = new();
    public List<IncidentUpdateDto> Updates { get; init; } = new();
}

public record IncidentUpdateDto
{
    public string Id { get; init; } = string.Empty;
    public string IncidentId { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
    public DateTime CreatedUtc { get; init; }
}

public record PublicStatusPageDto
{
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? LogoUrl { get; init; }
    public string? PrimaryColor { get; init; }
    public string OverallStatus { get; init; } = "operational";
    public List<ComponentDto> Components { get; init; } = new();
    public List<IncidentDto> ActiveIncidents { get; init; } = new();
    public List<IncidentDto> RecentIncidents { get; init; } = new();
}

public record StatusFeedDto
{
    public string StatusPageId { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string OverallStatus { get; init; } = "operational";
    public DateTime LastUpdated { get; init; }
    public List<ComponentDto> Components { get; init; } = new();
    public List<IncidentDto> ActiveIncidents { get; init; } = new();
}
