// File: src/Infrastructure/Extensions/ServiceCollectionExtensions.cs
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Infrastructure.Services;

namespace Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Register Supabase client
        services.AddSingleton<Supabase.Client>(provider =>
        {
            var url = configuration["Supabase:Url"] ?? throw new InvalidOperationException("Supabase URL not configured");
            var key = configuration["Supabase:AnonKey"] ?? throw new InvalidOperationException("Supabase Anon Key not configured");
            
            var options = new Supabase.SupabaseOptions
            {
                AutoRefreshToken = true,
                AutoConnectRealtime = false
            };
            
            return new Supabase.Client(url, key, options);
        });

        // Register storage service
        services.AddScoped<IStorageService, SupabaseStorageService>();
        
        // Register Supabase client wrapper
        services.AddScoped<ISupabaseClientWrapper, SupabaseClientWrapper>();
        
        // Register repository services
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IProjectRepository, ProjectRepository>();
        services.AddScoped<ITestimonialRepository, TestimonialRepository>();

        return services;
    }
}
