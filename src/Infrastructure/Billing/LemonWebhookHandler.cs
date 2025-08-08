using Microsoft.Extensions.Logging;
using System.Text.Json;
using TrustLoops.Infrastructure.Services;
using Infrastructure.Models;

namespace TrustLoops.Infrastructure.Billing;

public class LemonWebhookHandler
{
    private readonly ISupabaseClient _supabase;
    private readonly ILogger<LemonWebhookHandler> _logger;

    public LemonWebhookHandler(ISupabaseClient supabase, ILogger<LemonWebhookHandler> logger)
    {
        _supabase = supabase;
        _logger = logger;
    }

    public async Task<bool> HandleWebhookAsync(string payload, string signature)
    {
        try
        {
            // TODO: Verify webhook signature with LemonSqueezy secret
            if (!VerifySignature(payload, signature))
            {
                _logger.LogWarning("Invalid webhook signature");
                return false;
            }

            var webhookData = JsonSerializer.Deserialize<LemonSqueezyWebhook>(payload);
            if (webhookData == null)
            {
                _logger.LogWarning("Failed to deserialize webhook payload");
                return false;
            }

            _logger.LogInformation("Processing LemonSqueezy webhook: {EventName} for customer {CustomerId}", 
                webhookData.EventName, webhookData.Data.Attributes.CustomerId);

            return webhookData.EventName switch
            {
                "subscription_created" => await HandleSubscriptionCreated(webhookData),
                "subscription_updated" => await HandleSubscriptionUpdated(webhookData),
                "subscription_cancelled" or "subscription_expired" => await HandleSubscriptionEnded(webhookData),
                "subscription_payment_success" => await HandlePaymentSuccess(webhookData),
                "subscription_payment_failed" => await HandlePaymentFailed(webhookData),
                _ => await HandleUnknownEvent(webhookData)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling LemonSqueezy webhook");
            return false;
        }
    }

    private bool VerifySignature(string payload, string signature)
    {
        // TODO: Implement HMAC signature verification with LemonSqueezy webhook secret
        // For development, return true. In production, implement proper verification:
        // 
        // var secret = _configuration["LemonSqueezy:WebhookSecret"];
        // var computedSignature = ComputeHmacSha256(payload, secret);
        // return signature.Equals($"sha256={computedSignature}", StringComparison.OrdinalIgnoreCase);
        
        return true; // TODO: Implement proper signature verification
    }

    private async Task<bool> HandleSubscriptionCreated(LemonSqueezyWebhook webhook)
    {
        try
        {
            var subscription = webhook.Data.Attributes;
            var customerId = subscription.CustomerId.ToString();

            // Find user by customer ID (you'd need to store this during checkout)
            var user = await _supabase.GetUserByCustomerIdAsync(customerId);
            if (user == null)
            {
                _logger.LogWarning("User not found for customer ID: {CustomerId}", customerId);
                return false;
            }

            // Determine plan based on product/variant
            var planType = DeterminePlanType(subscription.ProductId, subscription.VariantId);

            // Update user's billing info
            await _supabase.UpdateUserBillingAsync(user.Id, new global::Infrastructure.Models.UserBillingUpdate
            {
                CustomerId = customerId,
                SubscriptionId = subscription.Id.ToString(),
                PlanType = planType,
                PlanStatus = "active",
                CurrentPeriodStart = subscription.CreatedAt,
                CurrentPeriodEnd = subscription.RenewsAt,
                UpdatedUtc = DateTime.UtcNow
            });

            _logger.LogInformation("Subscription created for user {UserId}, plan: {PlanType}", user.Id, planType);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling subscription created webhook");
            return false;
        }
    }

    private async Task<bool> HandleSubscriptionUpdated(LemonSqueezyWebhook webhook)
    {
        try
        {
            var subscription = webhook.Data.Attributes;
            var subscriptionId = subscription.Id.ToString();

            // Find user by subscription ID
            var user = await _supabase.GetUserBySubscriptionIdAsync(subscriptionId);
            if (user == null)
            {
                _logger.LogWarning("User not found for subscription ID: {SubscriptionId}", subscriptionId);
                return false;
            }

            var planType = DeterminePlanType(subscription.ProductId, subscription.VariantId);
            var planStatus = subscription.Status == "cancelled" ? "cancelled" : "active";

            await _supabase.UpdateUserBillingAsync(user.Id, new global::Infrastructure.Models.UserBillingUpdate
            {
                PlanType = planType,
                PlanStatus = planStatus,
                CurrentPeriodStart = subscription.CreatedAt,
                CurrentPeriodEnd = subscription.RenewsAt,
                UpdatedUtc = DateTime.UtcNow
            });

            _logger.LogInformation("Subscription updated for user {UserId}, status: {Status}", user.Id, planStatus);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling subscription updated webhook");
            return false;
        }
    }

    private async Task<bool> HandleSubscriptionEnded(LemonSqueezyWebhook webhook)
    {
        try
        {
            var subscription = webhook.Data.Attributes;
            var subscriptionId = subscription.Id.ToString();

            var user = await _supabase.GetUserBySubscriptionIdAsync(subscriptionId);
            if (user == null)
            {
                _logger.LogWarning("User not found for subscription ID: {SubscriptionId}", subscriptionId);
                return false;
            }

            await _supabase.UpdateUserBillingAsync(user.Id, new global::Infrastructure.Models.UserBillingUpdate
            {
                PlanStatus = "cancelled",
                UpdatedUtc = DateTime.UtcNow
            });

            _logger.LogInformation("Subscription ended for user {UserId}", user.Id);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling subscription ended webhook");
            return false;
        }
    }

    private async Task<bool> HandlePaymentSuccess(LemonSqueezyWebhook webhook)
    {
        try
        {
            var subscription = webhook.Data.Attributes;
            var subscriptionId = subscription.Id.ToString();

            var user = await _supabase.GetUserBySubscriptionIdAsync(subscriptionId);
            if (user == null)
            {
                _logger.LogWarning("User not found for subscription ID: {SubscriptionId}", subscriptionId);
                return false;
            }

            // Update subscription renewal date
            await _supabase.UpdateUserBillingAsync(user.Id, new global::Infrastructure.Models.UserBillingUpdate
            {
                PlanStatus = "active",
                CurrentPeriodEnd = subscription.RenewsAt,
                UpdatedUtc = DateTime.UtcNow
            });

            _logger.LogInformation("Payment success for user {UserId}", user.Id);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling payment success webhook");
            return false;
        }
    }

    private async Task<bool> HandlePaymentFailed(LemonSqueezyWebhook webhook)
    {
        try
        {
            var subscription = webhook.Data.Attributes;
            var subscriptionId = subscription.Id.ToString();

            var user = await _supabase.GetUserBySubscriptionIdAsync(subscriptionId);
            if (user == null)
            {
                _logger.LogWarning("User not found for subscription ID: {SubscriptionId}", subscriptionId);
                return false;
            }

            // Mark as past due, but don't immediately cancel
            await _supabase.UpdateUserBillingAsync(user.Id, new global::Infrastructure.Models.UserBillingUpdate
            {
                PlanStatus = "past_due",
                UpdatedUtc = DateTime.UtcNow
            });

            _logger.LogWarning("Payment failed for user {UserId}", user.Id);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling payment failed webhook");
            return false;
        }
    }

    private async Task<bool> HandleUnknownEvent(LemonSqueezyWebhook webhook)
    {
        _logger.LogInformation("Received unknown webhook event: {EventName}", webhook.EventName);
        return true;
    }

    private string DeterminePlanType(int productId, int variantId)
    {
        // TODO: Map your LemonSqueezy product/variant IDs to plan types
        // This would be configured based on your actual LemonSqueezy setup
        return variantId switch
        {
            // Example mapping - replace with your actual variant IDs
            12345 => "testimonialhub_pro",
            12346 => "statusloops_pro", 
            12347 => "shotloops_pro",
            12348 => "trustloops_bundle",
            _ => "free"
        };
    }
}

// LemonSqueezy webhook models
public record LemonSqueezyWebhook
{
    public string EventName { get; init; } = string.Empty;
    public WebhookData Data { get; init; } = new();
}

public record WebhookData
{
    public string Type { get; init; } = string.Empty;
    public string Id { get; init; } = string.Empty;
    public SubscriptionAttributes Attributes { get; init; } = new();
}

public record SubscriptionAttributes
{
    public int Id { get; init; }
    public int CustomerId { get; init; }
    public int ProductId { get; init; }
    public int VariantId { get; init; }
    public string Status { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public DateTime? RenewsAt { get; init; }
    public DateTime? EndsAt { get; init; }
}
