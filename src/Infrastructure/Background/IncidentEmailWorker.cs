using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using TrustLoops.Infrastructure.Services;

namespace TrustLoops.Infrastructure.Background;

public class IncidentEmailWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<IncidentEmailWorker> _logger;
    private readonly TimeSpan _processInterval = TimeSpan.FromMinutes(1);

    public IncidentEmailWorker(
        IServiceProvider serviceProvider,
        ILogger<IncidentEmailWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Incident Email Worker starting");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessPendingEmailNotifications(stoppingToken);
                await Task.Delay(_processInterval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                // Expected when cancellation is requested
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in Incident Email Worker");
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken); // Wait longer on error
            }
        }

        _logger.LogInformation("Incident Email Worker stopped");
    }

    private async Task ProcessPendingEmailNotifications(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var supabase = scope.ServiceProvider.GetRequiredService<ISupabaseClient>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

        try
        {
            // Get pending email notifications (you'd need to implement this)
            var pendingNotifications = await GetPendingEmailNotifications(supabase);

            foreach (var notification in pendingNotifications)
            {
                try
                {
                    await SendIncidentNotification(emailService, notification);
                    await MarkNotificationSent(supabase, notification.Id);
                    
                    _logger.LogInformation("Sent incident notification {NotificationId} to {Email}", 
                        notification.Id, notification.Email);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send notification {NotificationId}", notification.Id);
                    await MarkNotificationFailed(supabase, notification.Id, ex.Message);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing pending email notifications");
        }
    }

    private async Task<List<PendingEmailNotification>> GetPendingEmailNotifications(ISupabaseClient supabase)
    {
        // TODO: Implement query to get pending email notifications
        // This would query a table like 'incident_notifications' where sent_at IS NULL
        return new List<PendingEmailNotification>();
    }

    private async Task SendIncidentNotification(IEmailService emailService, PendingEmailNotification notification)
    {
        var subject = notification.Type switch
        {
            "incident_created" => $"🚨 New Incident: {notification.IncidentTitle}",
            "incident_updated" => $"📋 Incident Update: {notification.IncidentTitle}",
            "incident_resolved" => $"✅ Incident Resolved: {notification.IncidentTitle}",
            _ => $"Status Update: {notification.IncidentTitle}"
        };

        var body = BuildEmailBody(notification);

        await emailService.SendEmailAsync(
            to: notification.Email,
            subject: subject,
            htmlBody: body,
            textBody: StripHtml(body));
    }

    private string BuildEmailBody(PendingEmailNotification notification)
    {
        var statusBadgeColor = notification.IncidentStatus switch
        {
            "investigating" => "#f59e0b", // yellow
            "identified" => "#ef4444",    // red
            "monitoring" => "#3b82f6",    // blue
            "resolved" => "#10b981",      // green
            _ => "#6b7280"                // gray
        };

        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1'>
    <title>{notification.StatusPageName} - Status Update</title>
</head>
<body style='font-family: -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;'>
    <div style='background: #f9fafb; padding: 30px; border-radius: 12px; border: 1px solid #e5e7eb;'>
        <div style='text-align: center; margin-bottom: 30px;'>
            <h1 style='color: #111827; margin: 0 0 10px 0;'>{notification.StatusPageName}</h1>
            <div style='background: {statusBadgeColor}; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-size: 14px; font-weight: 600; text-transform: uppercase;'>
                {notification.IncidentStatus}
            </div>
        </div>
        
        <div style='background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;'>
            <h2 style='color: #111827; margin: 0 0 15px 0; font-size: 20px;'>{notification.IncidentTitle}</h2>
            <p style='margin: 0 0 15px 0; color: #6b7280; font-size: 14px;'>
                {notification.CreatedAt:MMMM d, yyyy 'at' h:mm tt} UTC
            </p>
            <div style='color: #374151; line-height: 1.7;'>
                {notification.Message}
            </div>
        </div>
        
        <div style='text-align: center; padding: 20px 0;'>
            <a href='{notification.StatusPageUrl}' style='background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;'>
                View Full Status Page
            </a>
        </div>
        
        <div style='text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;'>
            <p>You're receiving this because you subscribed to updates for {notification.StatusPageName}.</p>
            <p><a href='{notification.UnsubscribeUrl}' style='color: #9ca3af;'>Unsubscribe from these notifications</a></p>
        </div>
    </div>
</body>
</html>";
    }

    private string StripHtml(string html)
    {
        // Simple HTML stripping for text version
        return System.Text.RegularExpressions.Regex.Replace(html, "<.*?>", "")
            .Replace("&nbsp;", " ")
            .Replace("&lt;", "<")
            .Replace("&gt;", ">")
            .Replace("&amp;", "&");
    }

    private async Task MarkNotificationSent(ISupabaseClient supabase, string notificationId)
    {
        // TODO: Update notification record with sent_at timestamp
        await Task.CompletedTask;
    }

    private async Task MarkNotificationFailed(ISupabaseClient supabase, string notificationId, string errorMessage)
    {
        // TODO: Update notification record with error details
        await Task.CompletedTask;
    }
}

// Supporting models
public record PendingEmailNotification
{
    public string Id { get; init; } = string.Empty;
    public string StatusPageId { get; init; } = string.Empty;
    public string StatusPageName { get; init; } = string.Empty;
    public string StatusPageUrl { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string Type { get; init; } = string.Empty; // incident_created, incident_updated, incident_resolved
    public string IncidentId { get; init; } = string.Empty;
    public string IncidentTitle { get; init; } = string.Empty;
    public string IncidentStatus { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
    public string UnsubscribeUrl { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
}

// Email service interface
public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string htmlBody, string? textBody = null);
}

// Basic email service implementation
public class SupabaseEmailService : IEmailService
{
    private readonly ISupabaseClient _supabase;
    private readonly ILogger<SupabaseEmailService> _logger;

    public SupabaseEmailService(ISupabaseClient supabase, ILogger<SupabaseEmailService> logger)
    {
        _supabase = supabase;
        _logger = logger;
    }

    public async Task SendEmailAsync(string to, string subject, string htmlBody, string? textBody = null)
    {
        try
        {
            // TODO: Implement email sending via Supabase Edge Functions or SMTP
            // For now, log the email that would be sent
            _logger.LogInformation("Would send email to {To} with subject: {Subject}", to, subject);
            
            // In production, you'd use:
            // - Supabase Edge Functions with Resend/SendGrid
            // - SMTP client
            // - Or integrate with your preferred email service
            
            await Task.CompletedTask;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To}", to);
            throw;
        }
    }
}
