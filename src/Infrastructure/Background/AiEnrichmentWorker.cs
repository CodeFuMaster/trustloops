using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Infrastructure.Services;
using TrustLoops.Infrastructure.Services;
using Infrastructure.Models;

namespace Infrastructure.Background;

public class AiEnrichmentWorker : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<AiEnrichmentWorker> _logger;

    public AiEnrichmentWorker(IServiceProvider services, ILogger<AiEnrichmentWorker> logger)
    {
        _services = services;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("AI Enrichment Worker started");
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessJobsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AI Worker error");
            }

            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }

    private async Task ProcessJobsAsync(CancellationToken ct)
    {
        using var scope = _services.CreateScope();
        var supabase = scope.ServiceProvider.GetRequiredService<ISupabaseClient>();
        // Minimal stub: nothing to do until proper job querying is wired.
        await Task.CompletedTask;
    }
}
