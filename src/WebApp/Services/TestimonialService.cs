// File: src/WebApp/Services/TestimonialService.cs
using Shared.Models;
using FluentResults;

namespace WebApp.Services;

public class TestimonialService
{
    private readonly ILogger<TestimonialService> _logger;

    public TestimonialService(ILogger<TestimonialService> logger)
    {
        _logger = logger;
    }

    public async Task<Result<Testimonial>> CreateTestimonialAsync(CreateTestimonialRequest request)
    {
        // TODO: Implement testimonial creation with Supabase
        _logger.LogInformation("Creating testimonial for project {ProjectId}", request.ProjectId);
        
        throw new NotImplementedException("Testimonial creation not yet implemented");
    }

    public async Task<Result<List<Testimonial>>> GetTestimonialsByProjectAsync(Guid projectId)
    {
        // TODO: Implement get testimonials by project from Supabase
        _logger.LogInformation("Getting testimonials for project {ProjectId}", projectId);
        
        throw new NotImplementedException("Get testimonials not yet implemented");
    }

    public async Task<Result<Testimonial>> ApproveTestimonialAsync(Guid testimonialId)
    {
        // TODO: Implement testimonial approval
        _logger.LogInformation("Approving testimonial {TestimonialId}", testimonialId);
        
        throw new NotImplementedException("Testimonial approval not yet implemented");
    }
}
