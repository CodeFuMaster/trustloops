using Infrastructure.Models;
using Microsoft.Extensions.Logging;
using Shared.Models;
using TrustLoops.Infrastructure.Services;

namespace Infrastructure.Services;

public interface IThemingService
{
    Task<ProjectTheme> CreateThemeAsync(Guid projectId, CreateThemeRequest request);
    Task<ProjectTheme?> GetActiveThemeAsync(Guid projectId);
    Task<List<ProjectTheme>> GetProjectThemesAsync(Guid projectId);
    Task<bool> ActivateThemeAsync(Guid themeId, Guid userId);
    Task<bool> DeleteThemeAsync(Guid themeId, Guid userId);
    Task<ProjectTheme?> UpdateThemeAsync(Guid themeId, UpdateThemeRequest request, Guid userId);
    Task<string> GenerateThemeCssAsync(ProjectTheme theme);
}

public class ThemingService : IThemingService
{
    private readonly ISupabaseClient _supabaseClient;
    private readonly ILogger<ThemingService> _logger;
    private readonly Supabase.Client _client;

    public ThemingService(ISupabaseClient supabaseClient, ILogger<ThemingService> logger, Supabase.Client client)
    {
        _supabaseClient = supabaseClient;
        _logger = logger;
        _client = client;
    }

    public async Task<ProjectTheme> CreateThemeAsync(Guid projectId, CreateThemeRequest request)
    {
        try
        {
            // Verify project exists and user has access
            var project = await _supabaseClient.GetProjectAsync(projectId);
            if (project == null)
            {
                throw new ArgumentException($"Project not found: {projectId}");
            }

            // Deactivate existing active themes if this should be active
            if (request.IsActive)
            {
                await DeactivateAllThemesAsync(projectId);
            }

            var theme = new SupabaseProjectTheme
            {
                Id = Guid.NewGuid(),
                ProjectId = projectId,
                ThemeName = request.ThemeName,
                PrimaryColor = request.PrimaryColor ?? "#007AFF",
                SecondaryColor = request.SecondaryColor ?? "#34C759",
                BackgroundColor = request.BackgroundColor ?? "#FFFFFF",
                TextColor = request.TextColor ?? "#000000",
                AccentColor = request.AccentColor ?? "#FF9500",
                FontFamily = request.FontFamily ?? "Inter, system-ui, sans-serif",
                LogoUrl = request.LogoUrl,
                CustomCss = request.CustomCss,
                IsActive = request.IsActive,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var result = await _client
                .From<SupabaseProjectTheme>()
                .Insert(theme);

            var createdTheme = result?.Models?.FirstOrDefault() ?? theme;

            _logger.LogInformation("Created theme {ThemeId} for project {ProjectId}", createdTheme.Id, projectId);

            return MapToProjectTheme(createdTheme);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating theme for project: {ProjectId}", projectId);
            throw;
        }
    }

    public async Task<ProjectTheme?> GetActiveThemeAsync(Guid projectId)
    {
        try
        {
            var result = await _client
                .From<SupabaseProjectTheme>()
                .Where(t => t.ProjectId == projectId && t.IsActive == true)
                .Get();

            var theme = result?.Models?.FirstOrDefault();
            return theme != null ? MapToProjectTheme(theme) : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting active theme for project: {ProjectId}", projectId);
            return null;
        }
    }

    public async Task<List<ProjectTheme>> GetProjectThemesAsync(Guid projectId)
    {
        try
        {
            var result = await _client
                .From<SupabaseProjectTheme>()
                .Where(t => t.ProjectId == projectId)
                .Order("created_utc", Supabase.Postgrest.Constants.Ordering.Descending)
                .Get();

            return result?.Models?.Select(MapToProjectTheme).ToList() ?? new List<ProjectTheme>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting themes for project: {ProjectId}", projectId);
            return new List<ProjectTheme>();
        }
    }

    public async Task<bool> ActivateThemeAsync(Guid themeId, Guid userId)
    {
        try
        {
            // Get the theme and verify access
            var themeResult = await _client
                .From<SupabaseProjectTheme>()
                .Where(t => t.Id == themeId)
                .Single();

            if (themeResult == null) return false;

            // Verify user owns the project
            var project = await _supabaseClient.GetProjectAsync(themeResult.ProjectId);
            if (project == null || project.UserId != userId) return false;

            // Deactivate all other themes for this project
            await DeactivateAllThemesAsync(themeResult.ProjectId);

            // Activate this theme
            themeResult.IsActive = true;
            themeResult.UpdatedAt = DateTime.UtcNow;

            await _client
                .From<SupabaseProjectTheme>()
                .Where(t => t.Id == themeId)
                .Update(themeResult);

            _logger.LogInformation("Activated theme {ThemeId} for project {ProjectId}", themeId, themeResult.ProjectId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error activating theme: {ThemeId}", themeId);
            return false;
        }
    }

    public async Task<bool> DeleteThemeAsync(Guid themeId, Guid userId)
    {
        try
        {
            // Get the theme and verify access
            var themeResult = await _client
                .From<SupabaseProjectTheme>()
                .Where(t => t.Id == themeId)
                .Single();

            if (themeResult == null) return false;

            // Verify user owns the project
            var project = await _supabaseClient.GetProjectAsync(themeResult.ProjectId);
            if (project == null || project.UserId != userId) return false;

            // Delete the theme
            await _client
                .From<SupabaseProjectTheme>()
                .Where(t => t.Id == themeId)
                .Delete();

            _logger.LogInformation("Deleted theme {ThemeId} for project {ProjectId}", themeId, themeResult.ProjectId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting theme: {ThemeId}", themeId);
            return false;
        }
    }

    public async Task<ProjectTheme?> UpdateThemeAsync(Guid themeId, UpdateThemeRequest request, Guid userId)
    {
        try
        {
            var themeResult = await _client
                .From<SupabaseProjectTheme>()
                .Where(t => t.Id == themeId)
                .Single();

            if (themeResult == null) return null;

            // Verify user owns the project
            var project = await _supabaseClient.GetProjectAsync(themeResult.ProjectId);
            if (project == null || project.UserId != userId) return null;

            // Update theme properties
            if (!string.IsNullOrEmpty(request.ThemeName)) themeResult.ThemeName = request.ThemeName;
            if (!string.IsNullOrEmpty(request.PrimaryColor)) themeResult.PrimaryColor = request.PrimaryColor;
            if (!string.IsNullOrEmpty(request.SecondaryColor)) themeResult.SecondaryColor = request.SecondaryColor;
            if (!string.IsNullOrEmpty(request.BackgroundColor)) themeResult.BackgroundColor = request.BackgroundColor;
            if (!string.IsNullOrEmpty(request.TextColor)) themeResult.TextColor = request.TextColor;
            if (!string.IsNullOrEmpty(request.AccentColor)) themeResult.AccentColor = request.AccentColor;
            if (!string.IsNullOrEmpty(request.FontFamily)) themeResult.FontFamily = request.FontFamily;
            if (request.LogoUrl != null) themeResult.LogoUrl = request.LogoUrl;
            if (request.CustomCss != null) themeResult.CustomCss = request.CustomCss;

            themeResult.UpdatedAt = DateTime.UtcNow;

            var result = await _client
                .From<SupabaseProjectTheme>()
                .Where(t => t.Id == themeId)
                .Update(themeResult);

            _logger.LogInformation("Updated theme {ThemeId} for project {ProjectId}", themeId, themeResult.ProjectId);

            return MapToProjectTheme(result?.Models?.FirstOrDefault() ?? themeResult);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating theme: {ThemeId}", themeId);
            return null;
        }
    }

    public Task<string> GenerateThemeCssAsync(ProjectTheme theme)
    {
        var css = $@"
        :root {{
            --primary-color: {theme.PrimaryColor};
            --secondary-color: {theme.SecondaryColor};
            --background-color: {theme.BackgroundColor};
            --text-color: {theme.TextColor};
            --accent-color: {theme.AccentColor};
            --font-family: {theme.FontFamily};
        }}

        .testimonial-wall {{
            background-color: var(--background-color);
            color: var(--text-color);
            font-family: var(--font-family);
        }}

        .testimonial-card {{
            border: 1px solid var(--primary-color);
            border-radius: 12px;
            background: var(--background-color);
            color: var(--text-color);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }}

        .testimonial-header {{
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            color: white;
            padding: 1rem;
            border-radius: 12px 12px 0 0;
        }}

        .rating-stars {{
            color: var(--accent-color);
        }}

        .cta-button {{
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            color: white;
            border: none;
            border-radius: 8px;
            padding: 0.75rem 1.5rem;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s ease;
        }}

        .cta-button:hover {{
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }}

        .testimonial-quote {{
            font-style: italic;
            font-size: 1.1rem;
            line-height: 1.6;
            color: var(--text-color);
            margin: 1.5rem 0;
        }}

        .customer-info {{
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 0 0 12px 12px;
        }}

        {theme.CustomCss ?? ""}
        ";

        return Task.FromResult(css.Trim());
    }

    private async Task DeactivateAllThemesAsync(Guid projectId)
    {
        try
        {
            var activeThemes = await _client
                .From<SupabaseProjectTheme>()
                .Where(t => t.ProjectId == projectId && t.IsActive == true)
                .Get();

            if (activeThemes?.Models != null)
            {
                foreach (var theme in activeThemes.Models)
                {
                    theme.IsActive = false;
                    theme.UpdatedAt = DateTime.UtcNow;
                    
                    await _client
                        .From<SupabaseProjectTheme>()
                        .Where(t => t.Id == theme.Id)
                        .Update(theme);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deactivating themes for project: {ProjectId}", projectId);
        }
    }

    private ProjectTheme MapToProjectTheme(SupabaseProjectTheme theme)
    {
        return new ProjectTheme
        {
            Id = theme.Id,
            ProjectId = theme.ProjectId,
            ThemeName = theme.ThemeName,
            PrimaryColor = theme.PrimaryColor,
            SecondaryColor = theme.SecondaryColor,
            BackgroundColor = theme.BackgroundColor,
            TextColor = theme.TextColor,
            AccentColor = theme.AccentColor,
            FontFamily = theme.FontFamily,
            LogoUrl = theme.LogoUrl,
            CustomCss = theme.CustomCss,
            IsActive = theme.IsActive,
            CreatedAt = theme.CreatedAt,
            UpdatedAt = theme.UpdatedAt
        };
    }
}
