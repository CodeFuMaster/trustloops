namespace Shared.Models;

public class StatusPage
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Slug { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<StatusComponent> Components { get; set; } = new();
    public List<StatusIncident> Incidents { get; set; } = new();
}

public class StatusComponent
{
    public Guid Id { get; set; }
    public Guid StatusPageId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = "operational"; // operational, degraded, down
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public StatusPage? StatusPage { get; set; }
}

public class StatusIncident
{
    public Guid Id { get; set; }
    public Guid StatusPageId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = "investigating"; // investigating, identified, monitoring, resolved
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public StatusPage? StatusPage { get; set; }
    public List<StatusIncidentUpdate> Updates { get; set; } = new();
}

public class StatusIncidentUpdate
{
    public Guid Id { get; set; }
    public Guid IncidentId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Message { get; set; }
    public DateTime CreatedAt { get; set; }
    public StatusIncident? Incident { get; set; }
}

public class EmailNotification
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // incident_created, incident_updated, incident_resolved
    public bool Sent { get; set; } = false;
    public DateTime? SentAt { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UserSubscription
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string SubscriptionId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // active, canceled, expired
    public string Plan { get; set; } = string.Empty; // free, pro, enterprise
    public DateTime? ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

// Request DTOs
public class CreateStatusPageRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid UserId { get; set; }
}

public class CreateStatusComponentRequest
{
    public Guid StatusPageId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = "operational";
}

public class CreateIncidentRequest
{
    public Guid StatusPageId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = "investigating";
}
