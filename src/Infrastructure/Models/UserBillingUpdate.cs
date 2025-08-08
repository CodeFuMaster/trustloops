namespace Infrastructure.Models;

public class UserBillingUpdate
{
    public string? CustomerId { get; set; }
    public string? SubscriptionId { get; set; }
    public string? PlanType { get; set; }
    public string? PlanStatus { get; set; }
    public DateTime? CurrentPeriodStart { get; set; }
    public DateTime? CurrentPeriodEnd { get; set; }
    public DateTime UpdatedUtc { get; set; }
}
