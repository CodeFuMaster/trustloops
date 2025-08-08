// File: src/Infrastructure/Extensions/ServiceCollectionExtensions.cs
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Infrastructure.Services;
using TrustLoops.Infrastructure.Services;
using Supabase;
using Infrastructure.Background;

namespace Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Register Supabase client wrapper (simplified for testing)
        services.AddScoped<ISupabaseClientWrapper, SupabaseClientWrapper>();
        
        // Register Email Service
        services.AddScoped<IEmailService, EmailService>();
        
        // Register Analytics Service
        services.AddScoped<IAnalyticsService, AnalyticsService>();
        
        // Register Theming Service
        services.AddScoped<IThemingService, ThemingService>();
        
        // Register Social Sharing Service
        services.AddScoped<ISocialSharingService, SocialSharingService>();

    // AI Enrichment services
    services.AddScoped<IAiEnrichmentService, AiEnrichmentService>();
    services.AddHostedService<AiEnrichmentWorker>();
        
        // Register new Supabase client - re-enabled with proper error handling
        var supabaseUrl = configuration["Supabase:Url"];
        var supabaseKey = configuration["Supabase:ServiceKey"];
        
        if (!string.IsNullOrEmpty(supabaseUrl) && !string.IsNullOrEmpty(supabaseKey))
        {
            try
            {
                services.AddScoped<Supabase.Client>(provider => 
                {
                    var options = new SupabaseOptions
                    {
                        AutoRefreshToken = true,
                        AutoConnectRealtime = false // Disable realtime for now
                    };
                    return new Supabase.Client(supabaseUrl, supabaseKey, options);
                });
                
                services.AddScoped<TrustLoops.Infrastructure.Services.ISupabaseClient, TrustLoops.Infrastructure.Services.SupabaseClient>();
                Console.WriteLine("Supabase client services registered successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Warning: Supabase client registration failed: {ex.Message}");
                // Fallback - don't register SupabaseClient if there's an issue
                // This will allow the app to start with just the mock wrapper
            }
        }
        else
        {
            Console.WriteLine("Supabase configuration not found, using mock wrapper only");
        }

        return services;
    }
}
