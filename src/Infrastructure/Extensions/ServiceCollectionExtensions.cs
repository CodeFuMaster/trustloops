// File: src/Infrastructure/Extensions/ServiceCollectionExtensions.cs
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Infrastructure.Services;

namespace Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Register Supabase client wrapper (simplified for testing)
        services.AddScoped<ISupabaseClientWrapper, SupabaseClientWrapper>();

        return services;
    }
}
