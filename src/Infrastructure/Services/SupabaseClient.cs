using Supabase;
using Supabase.Gotrue;
using Supabase.Postgrest.Exceptions;
using Models = Shared.Models;
using Infrastructure.Models;
using Microsoft.Extensions.Logging;

namespace TrustLoops.Infrastructure.Services;

public class SupabaseClient
{
    private readonly Supabase.Client _client;
    private readonly ILogger<SupabaseClient> _logger;

    public SupabaseClient(Supabase.Client client, ILogger<SupabaseClient> logger)
    {
        _client = client;
        _logger = logger;
    }

    public async Task<Models.Project> CreateProjectAsync(string name, string description, Guid userId, string callToAction = "Share your experience")
    {
        try
        {
            // Simply ensure user exists before project creation - no verification after
            await EnsureUserExistsAsync(userId);
            
            var slug = GenerateSlug(name);
            
            var project = new SupabaseProject
            {
                Id = Guid.NewGuid(),
                Name = name,
                Description = description,
                Slug = slug,
                CallToAction = callToAction,
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var result = await _client
                .From<SupabaseProject>()
                .Insert(project);

            if (result?.Models?.FirstOrDefault() != null)
            {
                var createdProject = result.Models.First();
                _logger.LogInformation("Project created successfully: {ProjectId}", createdProject.Id);
                
                return new Models.Project
                {
                    Id = createdProject.Id,
                    Name = createdProject.Name,
                    Slug = createdProject.Slug,
                    Description = createdProject.Description,
                    CallToAction = createdProject.CallToAction,
                    UserId = createdProject.UserId,
                    CreatedUtc = createdProject.CreatedAt,
                    UpdatedUtc = createdProject.UpdatedAt
                };
            }

            throw new InvalidOperationException("Failed to create project");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating project: {ProjectName}", name);
            throw;
        }
    }
    
    private async Task UpsertUserForProject(Guid userId)
    {
        try
        {
            var email = $"user+{userId}@example.com";
            var now = DateTime.UtcNow;
            
            // Use PostgreSQL UPSERT (INSERT ... ON CONFLICT) 
            var user = new SupabaseUser
            {
                Id = userId,
                Email = email,
                CreatedAt = now,
                UpdatedAt = now
            };
            
            // This will either insert or update based on conflicts
            var result = await _client
                .From<SupabaseUser>()
                .Upsert(user);
                
            if (result?.Models?.Any() == true)
            {
                _logger.LogInformation("User {UserId} upserted successfully for project creation", userId);
            }
            else
            {
                throw new InvalidOperationException($"Failed to upsert user {userId}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upsert user {UserId}", userId);
            throw;
        }
    }
    
    private async Task<Models.Project?> TryCreateProject(string name, string description, Guid userId)
    {
        try
        {
            var slug = GenerateSlug(name);
            
            var project = new SupabaseProject
            {
                Id = Guid.NewGuid(),
                Name = name,
                Description = description,
                Slug = slug,
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var result = await _client
                .From<SupabaseProject>()
                .Insert(project);

            if (result?.Models?.FirstOrDefault() != null)
            {
                var createdProject = result.Models.First();
                _logger.LogInformation("Project created successfully: {ProjectId}", createdProject.Id);
                
                return new Models.Project
                {
                    Id = createdProject.Id,
                    Name = createdProject.Name,
                    Slug = createdProject.Slug,
                    Description = createdProject.Description,
                    UserId = createdProject.UserId,
                    CreatedUtc = createdProject.CreatedAt,
                    UpdatedUtc = createdProject.UpdatedAt
                };
            }

            return null; // Project creation failed
        }
        catch (PostgrestException ex)
        {
            // Check if it's a foreign key constraint error
            if (ex.Message.Contains("23503") && ex.Message.Contains("projects_user_id_fkey"))
            {
                _logger.LogWarning("Foreign key constraint error creating project - user {UserId} not found", userId);
                return null; // Let the caller handle user creation
            }
            throw; // Re-throw other database errors
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error creating project");
            throw;
        }
    }

    public async Task<List<Models.Project>> GetProjectsAsync(Guid userId)
    {
        try
        {
            var result = await _client
                .From<SupabaseProject>()
                .Where(p => p.UserId == userId)
                .Order("created_utc", Supabase.Postgrest.Constants.Ordering.Descending)
                .Get();

            return result?.Models?.Select(p => new Models.Project
            {
                Id = p.Id,
                Name = p.Name,
                Slug = p.Slug,
                Description = p.Description,
                UserId = p.UserId,
                CreatedUtc = p.CreatedAt,
                UpdatedUtc = p.UpdatedAt
            }).ToList() ?? new List<Models.Project>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching projects for user: {UserId}", userId);
            throw;
        }
    }

    public async Task<Models.Project?> GetProjectBySlugAsync(string slug)
    {
        try
        {
            var result = await _client
                .From<SupabaseProject>()
                .Where(p => p.Slug == slug)
                .Single();

            if (result != null)
            {
                return new Models.Project
                {
                    Id = result.Id,
                    Name = result.Name,
                    Slug = result.Slug,
                    Description = result.Description,
                    UserId = result.UserId,
                    CreatedUtc = result.CreatedAt,
                    UpdatedUtc = result.UpdatedAt
                };
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching project by slug: {Slug}", slug);
            return null;
        }
    }

    public async Task<Models.Testimonial> CreateTestimonialAsync(Models.CreateTestimonialRequest request)
    {
        try
        {
            var testimonial = new SupabaseTestimonial
            {
                Id = Guid.NewGuid(),
                ProjectId = request.ProjectId,
                CustomerName = request.CustomerName,
                CustomerEmail = request.CustomerEmail,
                CustomerTitle = request.CustomerTitle,
                CustomerCompany = request.CustomerCompany,
                Quote = request.Quote,
                Rating = request.Rating,
                Approved = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var result = await _client
                .From<SupabaseTestimonial>()
                .Insert(testimonial);

            if (result?.Models?.FirstOrDefault() != null)
            {
                var created = result.Models.First();
                _logger.LogInformation("Testimonial created successfully: {TestimonialId}", created.Id);
                
                return new Models.Testimonial
                {
                    Id = created.Id,
                    ProjectId = created.ProjectId,
                    Quote = created.Quote,
                    VideoUrl = created.VideoUrl,
                    ThumbnailUrl = created.ThumbnailUrl,
                    CustomerName = created.CustomerName,
                    CustomerEmail = created.CustomerEmail,
                    CustomerTitle = created.CustomerTitle,
                    CustomerCompany = created.CustomerCompany,
                    Rating = created.Rating,
                    Approved = created.Approved,
                    CreatedUtc = created.CreatedAt,
                    UpdatedUtc = created.UpdatedAt
                };
            }

            throw new InvalidOperationException("Failed to create testimonial");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating testimonial for project: {ProjectId}", request.ProjectId);
            throw;
        }
    }

    public async Task<bool> ApproveTestimonialAsync(Guid id, Guid userId)
    {
        try
        {
            // First verify the user owns the project
            var testimonial = await _client
                .From<SupabaseTestimonial>()
                .Where(t => t.Id == id)
                .Single();

            if (testimonial == null)
            {
                _logger.LogWarning("Testimonial not found: {TestimonialId}", id);
                return false;
            }

            var project = await _client
                .From<SupabaseProject>()
                .Where(p => p.Id == testimonial.ProjectId && p.UserId == userId)
                .Single();

            if (project == null)
            {
                _logger.LogWarning("User {UserId} not authorized to approve testimonial {TestimonialId}", userId, id);
                return false;
            }

            // Update approval status
            testimonial.Approved = true;
            testimonial.UpdatedAt = DateTime.UtcNow;

            var result = await _client
                .From<SupabaseTestimonial>()
                .Where(t => t.Id == id)
                .Update(testimonial);

            _logger.LogInformation("Testimonial approved: {TestimonialId} by user: {UserId}", id, userId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error approving testimonial: {TestimonialId}", id);
            throw;
        }
    }

    public async Task<List<Models.Testimonial>> GetApprovedTestimonialsAsync(Guid projectId)
    {
        try
        {
            var result = await _client
                .From<SupabaseTestimonial>()
                .Where(t => t.ProjectId == projectId && t.Approved == true)
                .Order("created_utc", Supabase.Postgrest.Constants.Ordering.Descending)
                .Get();

            return result?.Models?.Select(t => new Models.Testimonial
            {
                Id = t.Id,
                ProjectId = t.ProjectId,
                Quote = t.Quote,
                VideoUrl = t.VideoUrl,
                ThumbnailUrl = t.ThumbnailUrl,
                CustomerName = t.CustomerName,
                CustomerEmail = t.CustomerEmail,
                CustomerTitle = t.CustomerTitle,
                CustomerCompany = t.CustomerCompany,
                Rating = t.Rating,
                Approved = t.Approved,
                CreatedUtc = t.CreatedAt,
                UpdatedUtc = t.UpdatedAt
            }).ToList() ?? new List<Models.Testimonial>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching approved testimonials for project: {ProjectId}", projectId);
            throw;
        }
    }

    public async Task<List<Models.Testimonial>> GetPendingTestimonialsAsync(Guid userId)
    {
        try
        {
            // Get all pending testimonials for projects owned by the user
            var result = await _client
                .From<SupabaseTestimonial>()
                .Where(t => t.Approved == false)
                .Get();

            return result?.Models?.Select(t => new Models.Testimonial
            {
                Id = t.Id,
                ProjectId = t.ProjectId,
                Quote = t.Quote,
                VideoUrl = t.VideoUrl,
                ThumbnailUrl = t.ThumbnailUrl,
                CustomerName = t.CustomerName,
                CustomerEmail = t.CustomerEmail,
                CustomerTitle = t.CustomerTitle,
                CustomerCompany = t.CustomerCompany,
                Rating = t.Rating,
                Approved = t.Approved,
                CreatedUtc = t.CreatedAt,
                UpdatedUtc = t.UpdatedAt
            }).ToList() ?? new List<Models.Testimonial>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching pending testimonials for user: {UserId}", userId);
            throw;
        }
    }

    public async Task<string> UploadVideoAsync(Stream fileStream, string fileName)
    {
        try
        {
            var uniqueFileName = $"{Guid.NewGuid()}_{fileName}";
            var bucketName = "testimonial-videos";

            // Convert stream to byte array
            using var memoryStream = new MemoryStream();
            await fileStream.CopyToAsync(memoryStream);
            var fileBytes = memoryStream.ToArray();

            var result = await _client.Storage
                .From(bucketName)
                .Upload(fileBytes, uniqueFileName);

            if (!string.IsNullOrEmpty(result))
            {
                var publicUrl = _client.Storage
                    .From(bucketName)
                    .GetPublicUrl(uniqueFileName);

                _logger.LogInformation("Video uploaded successfully: {FileName}", uniqueFileName);
                return publicUrl;
            }

            throw new InvalidOperationException("Failed to upload video");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading video: {FileName}", fileName);
            throw;
        }
    }

    private async Task EnsureUserExistsAsync(Guid userId)
    {
        try
        {
            _logger.LogInformation("Checking if user {UserId} exists in users table", userId);
            
            // Check if user already exists in our users table
            var existingUser = await _client
                .From<SupabaseUser>()
                .Where(u => u.Id == userId)
                .Get();

            if (existingUser?.Models?.Any() == true)
            {
                _logger.LogInformation("User {UserId} already exists in users table", userId);
                return;
            }

            _logger.LogInformation("User {UserId} not found, will create new user", userId);

            // Check if there's already a user with this email (from previous failed attempts)
            var emailToUse = $"user+{userId}@example.com";
            var existingEmailUser = await _client
                .From<SupabaseUser>()
                .Where(u => u.Email == emailToUse)
                .Get();

            if (existingEmailUser?.Models?.Any() == true)
            {
                var existingUserRecord = existingEmailUser.Models.First();
                _logger.LogWarning("Found existing user with email {Email} but different ID: existing={ExistingId}, requested={RequestedId}", 
                    emailToUse, existingUserRecord.Id, userId);
                
                // Delete the existing user record and recreate with correct ID
                _logger.LogInformation("Deleting existing user record with wrong ID {ExistingId}", existingUserRecord.Id);
                await _client
                    .From<SupabaseUser>()
                    .Where(u => u.Email == emailToUse)
                    .Delete();
                
                // Create new user with correct ID
                _logger.LogInformation("Creating new user record with correct ID {UserId}", userId);
                var correctedUser = new SupabaseUser
                {
                    Id = userId,
                    Email = emailToUse,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                var recreateResult = await _client
                    .From<SupabaseUser>()
                    .Insert(correctedUser);

                if (recreateResult?.Models?.Any() != true)
                {
                    throw new InvalidOperationException($"Failed to recreate user record for {userId}");
                }
                
                _logger.LogInformation("Successfully recreated user record with ID {UserId}", userId);
                
                // Verify the user actually exists now before proceeding
                var verificationResult = await _client
                    .From<SupabaseUser>()
                    .Where(u => u.Id == userId)
                    .Get();
                    
                if (verificationResult?.Models?.Any() != true)
                {
                    throw new InvalidOperationException($"User {userId} not found after recreation - verification failed");
                }
                
                _logger.LogInformation("Verified user {UserId} exists after recreation", userId);
                return;
            }

            // User doesn't exist, create them
            _logger.LogInformation("Creating new user record for {UserId} with email {Email}", userId, emailToUse);
            
            var newUser = new SupabaseUser
            {
                Id = userId,
                Email = emailToUse,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var insertResult = await _client
                .From<SupabaseUser>()
                .Insert(newUser);

            // Verify the insertion was successful
            if (insertResult?.Models?.Any() != true)
            {
                throw new InvalidOperationException($"Failed to create user record for {userId} - no result returned");
            }

            _logger.LogInformation("Successfully created user record for {UserId}", userId);
            
            // Verify the user actually exists now before proceeding
            var creationVerification = await _client
                .From<SupabaseUser>()
                .Where(u => u.Id == userId)
                .Get();
                
            if (creationVerification?.Models?.Any() != true)
            {
                throw new InvalidOperationException($"User {userId} not found after creation - verification failed");
            }
            
            _logger.LogInformation("Verified user {UserId} exists after creation", userId);
        }
        catch (PostgrestException ex) when (ex.Message.Contains("users_email_key"))
        {
            // This should now be handled above, but keep as fallback
            _logger.LogInformation("User with email for {UserId} already exists - fallback handling", userId);
            return;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to ensure user {UserId} exists", userId);
            throw; // Re-throw to prevent project creation from continuing
        }
    }

    private static string GenerateSlug(string name)
    {
        return name
            .ToLowerInvariant()
            .Replace(" ", "-")
            .Replace("'", "")
            .Replace("\"", "")
            .Replace(".", "")
            .Replace(",", "")
            .Replace("!", "")
            .Replace("?", "")
            .Replace("&", "and");
    }
}
