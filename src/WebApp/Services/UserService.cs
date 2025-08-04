// File: src/WebApp/Services/UserService.cs
using Shared.Models;
using FluentResults;

namespace WebApp.Services;

public class UserService
{
    private readonly ILogger<UserService> _logger;

    public UserService(ILogger<UserService> logger)
    {
        _logger = logger;
    }

    public Task<Result<User>> GetUserByIdAsync(Guid userId)
    {
        // TODO: Implement get user by ID from Supabase
        _logger.LogInformation("Getting user {UserId}", userId);
        
        throw new NotImplementedException("Get user by ID not yet implemented");
    }

    public Task<Result<User>> CreateUserAsync(CreateUserRequest request)
    {
        // TODO: Implement user creation with Supabase
        _logger.LogInformation("Creating user {Email}", request.Email);
        
        throw new NotImplementedException("User creation not yet implemented");
    }
}
