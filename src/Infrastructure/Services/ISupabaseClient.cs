using Models = Shared.Models;
using Infrastructure.Models;

namespace TrustLoops.Infrastructure.Services;

public interface ISupabaseClient
{
    // Project methods
    Task<Models.Project> CreateProjectAsync(string name, string description, Guid userId, string userEmail, string callToAction = "Share your experience");
    Task<List<Models.Project>> GetProjectsAsync(Guid userId);
    Task<Models.Project?> GetProjectBySlugAsync(string slug);
    Task<Models.Project?> GetProjectAsync(Guid projectId);

    // Testimonial methods
    Task<Models.Testimonial> CreateTestimonialAsync(Models.CreateTestimonialRequest request);
    Task<List<Models.Testimonial>> GetTestimonialsAsync(Guid projectId, bool? approved = null, int page = 1, int pageSize = 10);
    Task<Models.Testimonial?> GetTestimonialByIdAsync(Guid testimonialId);
    Task<bool> ApproveTestimonialAsync(Guid id, bool approved);
    Task<bool> DeleteTestimonialAsync(Guid id);
    Task<List<Models.Testimonial>> GetApprovedTestimonialsAsync(Guid projectId);
    Task<List<Models.Testimonial>> GetPendingTestimonialsAsync(Guid userId);

    // File upload methods
    Task<string> UploadFileAsync(string bucket, string fileName, Stream fileStream);
    Task<string> UploadVideoAsync(Stream fileStream, string fileName);

    // User methods
    Task<SupabaseUser> UpsertUserDirectly(Guid id, string email);

    // Billing methods
    Task<SupabaseUser?> GetUserByCustomerIdAsync(string customerId);
    Task<SupabaseUser?> GetUserBySubscriptionIdAsync(string subscriptionId);
    Task<bool> UpdateUserBillingAsync(Guid userId, UserBillingUpdate billingUpdate);
}
