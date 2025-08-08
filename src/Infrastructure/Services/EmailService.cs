using System.Net;
using System.Net.Mail;
using System.Text;
using FluentResults;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;
    private readonly SmtpClient _smtpClient;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        
        // Configure SMTP client
        _smtpClient = new SmtpClient
        {
            Host = _configuration["Email:SmtpHost"] ?? "smtp.gmail.com",
            Port = int.Parse(_configuration["Email:SmtpPort"] ?? "587"),
            EnableSsl = bool.Parse(_configuration["Email:EnableSsl"] ?? "true"),
            UseDefaultCredentials = false,
            Credentials = new NetworkCredential(
                _configuration["Email:Username"],
                _configuration["Email:Password"]
            )
        };
    }

    public async Task<Result> SendNewTestimonialNotificationAsync(string projectOwnerEmail, NewTestimonialEmailData data)
    {
        try
        {
            var subject = $"🎉 New Testimonial for {data.ProjectName}";
            var body = GenerateNewTestimonialEmail(data);
            
            await SendEmailAsync(projectOwnerEmail, subject, body);
            
            _logger.LogInformation("New testimonial notification sent to {Email} for project {ProjectName}", 
                projectOwnerEmail, data.ProjectName);
            
            return Result.Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send new testimonial notification to {Email}", projectOwnerEmail);
            return Result.Fail($"Failed to send email notification: {ex.Message}");
        }
    }

    public async Task<Result> SendTestimonialApprovedNotificationAsync(string customerEmail, TestimonialApprovedEmailData data)
    {
        try
        {
            var subject = $"✅ Your testimonial for {data.ProjectName} is now live!";
            var body = GenerateTestimonialApprovedEmail(data);
            
            await SendEmailAsync(customerEmail, subject, body);
            
            _logger.LogInformation("Testimonial approved notification sent to {Email} for project {ProjectName}", 
                customerEmail, data.ProjectName);
            
            return Result.Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send testimonial approved notification to {Email}", customerEmail);
            return Result.Fail($"Failed to send email notification: {ex.Message}");
        }
    }

    public async Task<Result> SendTestimonialRejectedNotificationAsync(string customerEmail, TestimonialRejectedEmailData data)
    {
        try
        {
            var subject = $"Update on your testimonial for {data.ProjectName}";
            var body = GenerateTestimonialRejectedEmail(data);
            
            await SendEmailAsync(customerEmail, subject, body);
            
            _logger.LogInformation("Testimonial rejected notification sent to {Email} for project {ProjectName}", 
                customerEmail, data.ProjectName);
            
            return Result.Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send testimonial rejected notification to {Email}", customerEmail);
            return Result.Fail($"Failed to send email notification: {ex.Message}");
        }
    }

    public async Task<Result> SendWelcomeEmailAsync(string userEmail, WelcomeEmailData data)
    {
        try
        {
            var subject = "🚀 Welcome to TrustLoops - Start Collecting Testimonials Today!";
            var body = GenerateWelcomeEmail(data);
            
            await SendEmailAsync(userEmail, subject, body);
            
            _logger.LogInformation("Welcome email sent to {Email}", userEmail);
            
            return Result.Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send welcome email to {Email}", userEmail);
            return Result.Fail($"Failed to send welcome email: {ex.Message}");
        }
    }

    private async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
    {
        var fromEmail = _configuration["Email:FromAddress"] ?? "notifications@trustloops.com";
        var fromName = _configuration["Email:FromName"] ?? "TrustLoops";
        
        var message = new MailMessage
        {
            From = new MailAddress(fromEmail, fromName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true
        };
        
        message.To.Add(toEmail);
        
        await _smtpClient.SendMailAsync(message);
    }

    private string GenerateNewTestimonialEmail(NewTestimonialEmailData data)
    {
        var videoIndicator = data.HasVideo ? "📹 Video testimonial included" : "📝 Text testimonial";
        var stars = string.Join("", Enumerable.Repeat("⭐", data.Rating));
        
        return $$"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f8f9fa; padding: 30px; }
                    .testimonial-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
                    .btn { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
                    .footer { background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 New Testimonial Received!</h1>
                        <p>Someone just shared their experience with {{data.ProjectName}}</p>
                    </div>
                    <div class="content">
                        <div class="testimonial-card">
                            <h3>Testimonial Details:</h3>
                            <p><strong>Customer:</strong> {{data.CustomerName}} ({{data.CustomerEmail}})</p>
                            <p><strong>Rating:</strong> {{stars}} ({{data.Rating}}/5)</p>
                            <p><strong>Type:</strong> {{videoIndicator}}</p>
                            <blockquote style="font-style: italic; margin: 15px 0; padding: 10px; background: #f0f0f0; border-radius: 5px;">
                                "{{data.TestimonialQuote}}"
                            </blockquote>
                        </div>
                        
                        <p>This testimonial is pending your approval. You can review and approve it in your dashboard.</p>
                        
                        <a href="{{data.DashboardUrl}}" class="btn">Review Testimonials</a>
                        
                        <p><small>💡 <strong>Tip:</strong> Approved testimonials automatically appear on your testimonial wall and can be embedded on your website!</small></p>
                    </div>
                    <div class="footer">
                        <p>© 2025 TrustLoops - Making testimonial collection effortless</p>
                        <p><a href="mailto:support@trustloops.com" style="color: #667eea;">Need help? Contact support</a></p>
                    </div>
                </div>
            </body>
            </html>
            """;
    }

    private string GenerateTestimonialApprovedEmail(TestimonialApprovedEmailData data)
    {
        var stars = string.Join("", Enumerable.Repeat("⭐", data.Rating));
        
        return $$"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f8f9fa; padding: 30px; }
                    .testimonial-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #48bb78; }
                    .btn { display: inline-block; padding: 12px 24px; background: #48bb78; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
                    .footer { background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✅ Your Testimonial is Live!</h1>
                        <p>Thank you for sharing your experience with {{data.ProjectName}}</p>
                    </div>
                    <div class="content">
                        <p>Hi {{data.CustomerName}},</p>
                        
                        <p>Great news! Your testimonial has been approved and is now live on the {{data.ProjectName}} testimonial wall.</p>
                        
                        <div class="testimonial-card">
                            <p><strong>Your review:</strong></p>
                            <p><strong>Rating:</strong> {{stars}}</p>
                            <blockquote style="font-style: italic; margin: 15px 0; padding: 10px; background: #f0f0f0; border-radius: 5px;">
                                "{{data.TestimonialQuote}}"
                            </blockquote>
                        </div>
                        
                        <p>Your testimonial is now helping others discover the value of {{data.ProjectName}}. Thank you for taking the time to share your experience!</p>
                        
                        <a href="{{data.WallUrl}}" class="btn">View Testimonial Wall</a>
                        
                        <p><small>You can view your testimonial and others on the public testimonial wall.</small></p>
                    </div>
                    <div class="footer">
                        <p>© 2025 TrustLoops - Making testimonial collection effortless</p>
                    </div>
                </div>
            </body>
            </html>
            """;
    }

    private string GenerateTestimonialRejectedEmail(TestimonialRejectedEmailData data)
    {
        return $$"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f8f9fa; padding: 30px; }
                    .btn { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
                    .footer { background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📝 Update on Your Testimonial</h1>
                        <p>Regarding your testimonial for {{data.ProjectName}}</p>
                    </div>
                    <div class="content">
                        <p>Hi {{data.CustomerName}},</p>
                        
                        <p>Thank you for taking the time to submit a testimonial for {{data.ProjectName}}. We appreciate your feedback.</p>
                        
                        <p>Unfortunately, we're unable to publish your testimonial at this time for the following reason:</p>
                        
                        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <strong>Reason:</strong> {{data.RejectionReason}}
                        </div>
                        
                        <p>If you'd like to submit a new testimonial that addresses these concerns, you're welcome to do so:</p>
                        
                        <a href="{{data.RecordNewUrl}}" class="btn">Submit New Testimonial</a>
                        
                        <p>Thank you for your understanding, and we look forward to hearing from you again.</p>
                    </div>
                    <div class="footer">
                        <p>© 2025 TrustLoops - Making testimonial collection effortless</p>
                    </div>
                </div>
            </body>
            </html>
            """;
    }

    private string GenerateWelcomeEmail(WelcomeEmailData data)
    {
        return $$"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f8f9fa; padding: 30px; }
                    .feature-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; }
                    .btn { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
                    .btn-secondary { background: #48bb78; }
                    .footer { background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🚀 Welcome to TrustLoops!</h1>
                        <p>Start collecting powerful testimonials today</p>
                    </div>
                    <div class="content">
                        <p>Hi {{data.UserName}},</p>
                        
                        <p>Welcome to TrustLoops! We're excited to help you collect and showcase customer testimonials that will boost your business credibility and conversions.</p>
                        
                        <div class="feature-box">
                            <h3>🎥 What you can do with TrustLoops:</h3>
                            <ul>
                                <li><strong>Collect Video Testimonials:</strong> Let customers record testimonials directly in their browser</li>
                                <li><strong>Approval Workflow:</strong> Review and approve testimonials before they go live</li>
                                <li><strong>Embeddable Walls:</strong> Display approved testimonials on your website</li>
                                <li><strong>Email Notifications:</strong> Get notified when new testimonials arrive</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{{data.DashboardUrl}}" class="btn">Go to Dashboard</a>
                            <a href="{{data.SampleProjectUrl}}" class="btn btn-secondary">Try Sample Project</a>
                        </div>
                        
                        <div class="feature-box">
                            <h3>🚀 Quick Start Guide:</h3>
                            <ol>
                                <li><strong>Create your first project</strong> in the dashboard</li>
                                <li><strong>Share the collection link</strong> with your customers</li>
                                <li><strong>Review submissions</strong> and approve the best ones</li>
                                <li><strong>Embed the testimonial wall</strong> on your website</li>
                            </ol>
                        </div>
                        
                        <p>Need help getting started? Check out our <a href="https://docs.trustloops.com" style="color: #667eea;">documentation</a> or reply to this email with any questions.</p>
                        
                        <p>Happy testimonial collecting!</p>
                        <p><strong>The TrustLoops Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>© 2025 TrustLoops - Making testimonial collection effortless</p>
                        <p><a href="mailto:support@trustloops.com" style="color: #667eea;">support@trustloops.com</a> | <a href="https://trustloops.com" style="color: #667eea;">trustloops.com</a></p>
                    </div>
                </div>
            </body>
            </html>
            """;
    }

    public void Dispose()
    {
        _smtpClient?.Dispose();
    }
}
