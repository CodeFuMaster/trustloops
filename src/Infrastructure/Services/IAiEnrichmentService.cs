using Shared.Models;

namespace Infrastructure.Services;

public interface IAiEnrichmentService
{
    Task<Guid> EnqueueAsync(Guid testimonialId);
}

internal class AiEnrichmentService : IAiEnrichmentService
{
    private readonly TrustLoops.Infrastructure.Services.ISupabaseClient _supabaseClient;

    public AiEnrichmentService(TrustLoops.Infrastructure.Services.ISupabaseClient supabaseClient)
    {
        _supabaseClient = supabaseClient;
    }

    public async Task<Guid> EnqueueAsync(Guid testimonialId)
    {
        // TODO: Insert into ai_jobs via Supabase client when exposed; stub returns a new job id.
        return await Task.FromResult(Guid.NewGuid());
    }
}
