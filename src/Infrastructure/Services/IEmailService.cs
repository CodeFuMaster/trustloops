using FluentResults;

namespace Infrastructure.Services;

public interface IEmailService
{
    /// <summary>
    /// Sends a notification email when a new testimonial is submitted
    /// </summary>
    Task<Result> SendNewTestimonialNotificationAsync(string projectOwnerEmail, NewTestimonialEmailData data);
    
    /// <summary>
    /// Sends a notification email when a testimonial is approved
    /// </summary>
    Task<Result> SendTestimonialApprovedNotificationAsync(string customerEmail, TestimonialApprovedEmailData data);
    
    /// <summary>
    /// Sends a notification email when a testimonial is rejected
    /// </summary>
    Task<Result> SendTestimonialRejectedNotificationAsync(string customerEmail, TestimonialRejectedEmailData data);
    
    /// <summary>
    /// Sends a welcome email to new project owners
    /// </summary>
    Task<Result> SendWelcomeEmailAsync(string userEmail, WelcomeEmailData data);
}

public record NewTestimonialEmailData(
    string ProjectName,
    string CustomerName,
    string CustomerEmail,
    string TestimonialQuote,
    int Rating,
    bool HasVideo,
    string DashboardUrl
);

public record TestimonialApprovedEmailData(
    string ProjectName,
    string CustomerName,
    string TestimonialQuote,
    int Rating,
    string WallUrl
);

public record TestimonialRejectedEmailData(
    string ProjectName,
    string CustomerName,
    string RejectionReason,
    string RecordNewUrl
);

public record WelcomeEmailData(
    string UserName,
    string DashboardUrl,
    string SampleProjectUrl
);
