// File: src/Shared/Models/User.cs
namespace Shared.Models;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? AvatarUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsActive { get; set; } = true;
    
    // Subscription info (for future billing integration)
    public string? SubscriptionId { get; set; }
    public string SubscriptionTier { get; set; } = "free";
    public DateTime? SubscriptionExpiresAt { get; set; }
}

public class CreateUserRequest
{
    public string Email { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
}
