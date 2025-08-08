using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using TrustLoops.Shared.DTOs;

namespace TrustLoops.WebApp.Features.Status;

public static class StatusEndpoints
{
    public static void MapStatusEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/status")
            .WithTags("Status Pages");

        // Status Page Management
        group.MapPost("/pages", CreateStatusPage)
            .WithSummary("Create a new status page")
            .WithDescription("Create a status page for monitoring services")
            .RequireAuthorization();

        group.MapGet("/pages", ListStatusPages)
            .WithSummary("List user's status pages")
            .WithDescription("Get all status pages owned by the user")
            .RequireAuthorization();

        group.MapGet("/pages/{id}", GetStatusPage)
            .WithSummary("Get status page details")
            .WithDescription("Get detailed status page information");

        group.MapPut("/pages/{id}", UpdateStatusPage)
            .WithSummary("Update status page")
            .WithDescription("Update status page settings")
            .RequireAuthorization();

        group.MapDelete("/pages/{id}", DeleteStatusPage)
            .WithSummary("Delete status page")
            .WithDescription("Permanently delete a status page")
            .RequireAuthorization();

        // Component Management
        group.MapPost("/pages/{pageId}/components", AddComponent)
            .WithSummary("Add a component to status page")
            .WithDescription("Add a service component to monitor")
            .RequireAuthorization();

        group.MapPut("/components/{id}/status", UpdateComponentStatus)
            .WithSummary("Update component status")
            .WithDescription("Change component status (operational/degraded/down)")
            .RequireAuthorization();

        group.MapDelete("/components/{id}", DeleteComponent)
            .WithSummary("Delete component")
            .WithDescription("Remove component from status page")
            .RequireAuthorization();

        // Incident Management
        group.MapPost("/pages/{pageId}/incidents", CreateIncident)
            .WithSummary("Create a new incident")
            .WithDescription("Report a new service incident")
            .RequireAuthorization();

        group.MapPost("/incidents/{id}/updates", AddIncidentUpdate)
            .WithSummary("Add incident update")
            .WithDescription("Post an update about an ongoing incident")
            .RequireAuthorization();

        group.MapPut("/incidents/{id}/resolve", ResolveIncident)
            .WithSummary("Resolve incident")
            .WithDescription("Mark an incident as resolved")
            .RequireAuthorization();

        // Public API
        group.MapGet("/public/{slug}", GetPublicStatusPage)
            .WithSummary("Get public status page")
            .WithDescription("Public endpoint for status page display");

        group.MapGet("/public/{slug}/feed", GetStatusFeed)
            .WithSummary("Get status page JSON feed")
            .WithDescription("JSON feed of current status and recent incidents");

        // Subscribers
        group.MapPost("/pages/{pageId}/subscribe", SubscribeToUpdates)
            .WithSummary("Subscribe to status updates")
            .WithDescription("Subscribe email for incident notifications");
    }

    private static async Task<IResult> CreateStatusPage(
        [FromBody] CreateStatusPageRequest request,
        IMediator mediator)
    {
        var command = new CreateStatusPageCommand
        {
            Name = request.Name,
            Description = request.Description,
            Slug = request.Slug,
            IsPublic = request.IsPublic,
            CustomDomain = request.CustomDomain,
            LogoUrl = request.LogoUrl,
            PrimaryColor = request.PrimaryColor
        };

        var result = await mediator.Send(command);
        return Results.Created($"/api/status/pages/{result.Id}", result);
    }

    private static async Task<IResult> ListStatusPages(IMediator mediator)
    {
        var query = new ListStatusPagesQuery();
        var result = await mediator.Send(query);
        return Results.Ok(result);
    }

    private static async Task<IResult> GetStatusPage(string id, IMediator mediator)
    {
        var query = new GetStatusPageQuery { Id = id };
        var result = await mediator.Send(query);
        return result != null ? Results.Ok(result) : Results.NotFound();
    }

    private static async Task<IResult> UpdateStatusPage(
        string id,
        [FromBody] UpdateStatusPageRequest request,
        IMediator mediator)
    {
        var command = new UpdateStatusPageCommand
        {
            Id = id,
            Name = request.Name,
            Description = request.Description,
            IsPublic = request.IsPublic,
            LogoUrl = request.LogoUrl,
            PrimaryColor = request.PrimaryColor
        };

        var result = await mediator.Send(command);
        return result ? Results.Ok() : Results.NotFound();
    }

    private static async Task<IResult> DeleteStatusPage(string id, IMediator mediator)
    {
        var command = new DeleteStatusPageCommand { Id = id };
        var result = await mediator.Send(command);
        return result ? Results.Ok() : Results.NotFound();
    }

    private static async Task<IResult> AddComponent(
        string pageId,
        [FromBody] AddComponentRequest request,
        IMediator mediator)
    {
        var command = new AddComponentCommand
        {
            StatusPageId = pageId,
            Name = request.Name,
            Description = request.Description,
            Status = request.Status
        };

        var result = await mediator.Send(command);
        return Results.Created($"/api/status/components/{result.Id}", result);
    }

    private static async Task<IResult> UpdateComponentStatus(
        string id,
        [FromBody] UpdateComponentStatusRequest request,
        IMediator mediator,
        IHubContext<StatusHub> hubContext)
    {
        var command = new UpdateComponentStatusCommand
        {
            Id = id,
            Status = request.Status,
            StatusMessage = request.StatusMessage
        };

        var result = await mediator.Send(command);
        
        if (result != null)
        {
            // Broadcast status update to subscribers
            await hubContext.Clients.Group($"status-{result.StatusPageId}")
                .SendAsync("ComponentStatusChanged", new
                {
                    ComponentId = id,
                    Status = request.Status,
                    StatusMessage = request.StatusMessage,
                    UpdatedAt = DateTime.UtcNow
                });
        }

        return result != null ? Results.Ok(result) : Results.NotFound();
    }

    private static async Task<IResult> DeleteComponent(string id, IMediator mediator)
    {
        var command = new DeleteComponentCommand { Id = id };
        var result = await mediator.Send(command);
        return result ? Results.Ok() : Results.NotFound();
    }

    private static async Task<IResult> CreateIncident(
        string pageId,
        [FromBody] CreateIncidentRequest request,
        IMediator mediator,
        IHubContext<StatusHub> hubContext)
    {
        var command = new CreateIncidentCommand
        {
            StatusPageId = pageId,
            Title = request.Title,
            Description = request.Description,
            Status = request.Status,
            Impact = request.Impact,
            AffectedComponentIds = request.AffectedComponentIds
        };

        var result = await mediator.Send(command);
        
        // Broadcast new incident to subscribers
        await hubContext.Clients.Group($"status-{pageId}")
            .SendAsync("IncidentCreated", result);

        return Results.Created($"/api/status/incidents/{result.Id}", result);
    }

    private static async Task<IResult> AddIncidentUpdate(
        string id,
        [FromBody] AddIncidentUpdateRequest request,
        IMediator mediator,
        IHubContext<StatusHub> hubContext)
    {
        var command = new AddIncidentUpdateCommand
        {
            IncidentId = id,
            Status = request.Status,
            Message = request.Message
        };

        var result = await mediator.Send(command);
        
        if (result != null)
        {
            // Broadcast incident update to subscribers
            await hubContext.Clients.Group($"status-{result.StatusPageId}")
                .SendAsync("IncidentUpdated", result);
        }

        return result != null ? Results.Ok(result) : Results.NotFound();
    }

    private static async Task<IResult> ResolveIncident(
        string id,
        [FromBody] ResolveIncidentRequest request,
        IMediator mediator,
        IHubContext<StatusHub> hubContext)
    {
        var command = new ResolveIncidentCommand
        {
            Id = id,
            ResolutionMessage = request.ResolutionMessage
        };

        var result = await mediator.Send(command);
        
        if (result != null)
        {
            // Broadcast incident resolution to subscribers
            await hubContext.Clients.Group($"status-{result.StatusPageId}")
                .SendAsync("IncidentResolved", result);
        }

        return result != null ? Results.Ok(result) : Results.NotFound();
    }

    private static async Task<IResult> GetPublicStatusPage(string slug, IMediator mediator)
    {
        var query = new GetPublicStatusPageQuery { Slug = slug };
        var result = await mediator.Send(query);
        return result != null ? Results.Ok(result) : Results.NotFound();
    }

    private static async Task<IResult> GetStatusFeed(string slug, IMediator mediator)
    {
        var query = new GetStatusFeedQuery { Slug = slug };
        var result = await mediator.Send(query);
        return result != null ? Results.Ok(result) : Results.NotFound();
    }

    private static async Task<IResult> SubscribeToUpdates(
        string pageId,
        [FromBody] SubscribeRequest request,
        IMediator mediator)
    {
        var command = new SubscribeToUpdatesCommand
        {
            StatusPageId = pageId,
            Email = request.Email
        };

        var result = await mediator.Send(command);
        return result ? Results.Ok(new { message = "Successfully subscribed to updates" }) 
                     : Results.BadRequest(new { error = "Failed to subscribe" });
    }
}

// Request DTOs
public record CreateStatusPageRequest(
    string Name,
    string? Description,
    string Slug,
    bool IsPublic,
    string? CustomDomain,
    string? LogoUrl,
    string? PrimaryColor);

public record UpdateStatusPageRequest(
    string Name,
    string? Description,
    bool IsPublic,
    string? LogoUrl,
    string? PrimaryColor);

public record AddComponentRequest(
    string Name,
    string? Description,
    string Status);

public record UpdateComponentStatusRequest(
    string Status,
    string? StatusMessage);

public record CreateIncidentRequest(
    string Title,
    string Description,
    string Status,
    string Impact,
    List<string> AffectedComponentIds);

public record AddIncidentUpdateRequest(
    string Status,
    string Message);

public record ResolveIncidentRequest(string ResolutionMessage);

public record SubscribeRequest(string Email);
