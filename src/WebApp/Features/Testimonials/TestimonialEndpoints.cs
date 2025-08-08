using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using TrustLoops.Shared.DTOs;

namespace TrustLoops.WebApp.Features.Testimonials;

public static class TestimonialEndpoints
{
    public static void MapTestimonialEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/testimonials")
            .WithTags("Testimonials");

        group.MapPost("/", CreateTestimonial)
            .WithSummary("Create a new video or text testimonial")
            .WithDescription("Accepts video file upload or text content with customer information");

        group.MapGet("/project/{projectId}", ListTestimonials)
            .WithSummary("Get testimonials for a project")
            .WithDescription("Returns paginated testimonials with optional filtering");

        group.MapGet("/wall/{projectId}", GetWallTestimonials)
            .WithSummary("Get approved testimonials for public wall")
            .WithDescription("Public endpoint for displaying testimonials on wall");

        group.MapPut("/{id}/approve", ApproveTestimonial)
            .WithSummary("Approve or reject a testimonial")
            .WithDescription("Admin action to change testimonial approval status")
            .RequireAuthorization();

        group.MapDelete("/{id}", DeleteTestimonial)
            .WithSummary("Delete a testimonial")
            .WithDescription("Permanently remove a testimonial")
            .RequireAuthorization();

        group.MapPost("/bulk-approve", BulkApproveTestimonials)
            .WithSummary("Bulk approve multiple testimonials")
            .WithDescription("Pro feature: approve multiple testimonials at once")
            .RequireAuthorization();

        group.MapGet("/export/{projectId}", ExportTestimonials)
            .WithSummary("Export testimonials to CSV")
            .WithDescription("Pro feature: download testimonials as CSV file")
            .RequireAuthorization();
    }

    private static async Task<IResult> CreateTestimonial(
        [FromForm] CreateTestimonialRequest request,
        IFormFile? video,
        IMediator mediator)
    {
        try
        {
            var command = new CreateTestimonialCommand
            {
                ProjectId = request.ProjectId,
                Type = request.Type,
                CustomerName = request.CustomerName,
                CustomerEmail = request.CustomerEmail,
                CustomerTitle = request.CustomerTitle,
                CustomerCompany = request.CustomerCompany,
                Quote = request.Quote,
                Rating = request.Rating,
                VideoFile = video
            };

            var result = await mediator.Send(command);
            return Results.Ok(result);
        }
        catch (Exception ex)
        {
            return Results.BadRequest(new { error = ex.Message });
        }
    }

    private static async Task<IResult> ListTestimonials(
        string projectId,
        IMediator mediator,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] bool? approved = null,
        [FromQuery] int? minRating = null)
    {
        var query = new ListTestimonialsQuery
        {
            ProjectId = projectId,
            Page = page,
            PageSize = pageSize,
            Approved = approved,
            MinRating = minRating
        };

        var result = await mediator.Send(query);
        return Results.Ok(result);
    }

    private static async Task<IResult> GetWallTestimonials(
        string projectId,
        IMediator mediator,
        [FromQuery] int? minRating = null,
        [FromQuery] string? type = null)
    {
        var query = new GetWallTestimonialsQuery
        {
            ProjectId = projectId,
            MinRating = minRating,
            Type = type
        };

        var result = await mediator.Send(query);
        return Results.Ok(result);
    }

    private static async Task<IResult> ApproveTestimonial(
        string id,
        [FromBody] ApproveTestimonialRequest request,
        IMediator mediator)
    {
        var command = new ApproveTestimonialCommand
        {
            Id = id,
            Approved = request.Approved,
            RejectionReason = request.RejectionReason
        };

        var result = await mediator.Send(command);
        return result ? Results.Ok() : Results.NotFound();
    }

    private static async Task<IResult> DeleteTestimonial(
        string id,
        IMediator mediator)
    {
        var command = new DeleteTestimonialCommand { Id = id };
        var result = await mediator.Send(command);
        return result ? Results.Ok() : Results.NotFound();
    }

    private static async Task<IResult> BulkApproveTestimonials(
        [FromBody] BulkApproveRequest request,
        IMediator mediator)
    {
        var command = new BulkApproveTestimonialsCommand
        {
            TestimonialIds = request.TestimonialIds,
            Approved = request.Approved
        };

        var result = await mediator.Send(command);
        return Results.Ok(new { approvedCount = result });
    }

    private static async Task<IResult> ExportTestimonials(
        string projectId,
        IMediator mediator,
        [FromQuery] bool approvedOnly = true)
    {
        var query = new ExportTestimonialsQuery
        {
            ProjectId = projectId,
            ApprovedOnly = approvedOnly
        };

        var csvData = await mediator.Send(query);
        var fileName = $"testimonials-{projectId}-{DateTime.UtcNow:yyyy-MM-dd}.csv";
        
        return Results.File(
            System.Text.Encoding.UTF8.GetBytes(csvData),
            "text/csv",
            fileName);
    }
}

// Request/Response DTOs
public record CreateTestimonialRequest(
    string ProjectId,
    string Type,
    string CustomerName,
    string? CustomerEmail,
    string? CustomerTitle,
    string? CustomerCompany,
    string? Quote,
    int Rating);

public record ApproveTestimonialRequest(bool Approved, string? RejectionReason);

public record BulkApproveRequest(List<string> TestimonialIds, bool Approved);
