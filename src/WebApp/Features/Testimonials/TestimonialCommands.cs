using MediatR;
using TrustLoops.Shared.DTOs;

namespace TrustLoops.WebApp.Features.Testimonials;

// Commands
public record CreateTestimonialCommand : IRequest<TestimonialDto>
{
    public string ProjectId { get; init; } = string.Empty;
    public string Type { get; init; } = string.Empty;
    public string CustomerName { get; init; } = string.Empty;
    public string? CustomerEmail { get; init; }
    public string? CustomerTitle { get; init; }
    public string? CustomerCompany { get; init; }
    public string? Quote { get; init; }
    public int Rating { get; init; }
    public IFormFile? VideoFile { get; init; }
}

public record ApproveTestimonialCommand : IRequest<bool>
{
    public string Id { get; init; } = string.Empty;
    public bool Approved { get; init; }
    public string? RejectionReason { get; init; }
}

public record DeleteTestimonialCommand : IRequest<bool>
{
    public string Id { get; init; } = string.Empty;
}

public record BulkApproveTestimonialsCommand : IRequest<int>
{
    public List<string> TestimonialIds { get; init; } = new();
    public bool Approved { get; init; }
}

// Queries
public record ListTestimonialsQuery : IRequest<PagedResult<TestimonialDto>>
{
    public string ProjectId { get; init; } = string.Empty;
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 10;
    public bool? Approved { get; init; }
    public int? MinRating { get; init; }
}

public record GetWallTestimonialsQuery : IRequest<List<TestimonialDto>>
{
    public string ProjectId { get; init; } = string.Empty;
    public int? MinRating { get; init; }
    public string? Type { get; init; }
}

public record ExportTestimonialsQuery : IRequest<string>
{
    public string ProjectId { get; init; } = string.Empty;
    public bool ApprovedOnly { get; init; } = true;
}
