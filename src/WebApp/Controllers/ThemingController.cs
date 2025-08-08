using Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Models = Shared.Models;

namespace WebApp.Controllers;

[ApiController]
[Route("api/themes")]
[Authorize]
public class ThemingController : ControllerBase
{
    private readonly IThemingService _themingService;
    private readonly ILogger<ThemingController> _logger;

    public ThemingController(IThemingService themingService, ILogger<ThemingController> logger)
    {
        _themingService = themingService;
        _logger = logger;
    }

    [HttpPost("project/{projectId}")]
    public async Task<ActionResult<Models.ProjectTheme>> CreateTheme(
        Guid projectId,
        [FromBody] Models.CreateThemeRequest request)
    {
        try
        {
            var theme = await _themingService.CreateThemeAsync(projectId, request);
            return Ok(theme);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating theme for project {ProjectId}", projectId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("project/{projectId}")]
    public async Task<ActionResult<List<Models.ProjectTheme>>> GetProjectThemes(Guid projectId)
    {
        try
        {
            var themes = await _themingService.GetProjectThemesAsync(projectId);
            return Ok(themes);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting themes for project {ProjectId}", projectId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("project/{projectId}/active")]
    [AllowAnonymous]
    public async Task<ActionResult<Models.ProjectTheme>> GetActiveTheme(Guid projectId)
    {
        try
        {
            var theme = await _themingService.GetActiveThemeAsync(projectId);
            if (theme == null)
            {
                return NotFound("No active theme found");
            }
            return Ok(theme);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting active theme for project {ProjectId}", projectId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("project/{projectId}/css")]
    [AllowAnonymous]
    public async Task<ActionResult<string>> GetThemeCss(Guid projectId)
    {
        try
        {
            var theme = await _themingService.GetActiveThemeAsync(projectId);
            if (theme == null)
            {
                return NotFound("No active theme found");
            }

            var css = await _themingService.GenerateThemeCssAsync(theme);
            return Content(css, "text/css");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting theme CSS for project {ProjectId}", projectId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("{themeId}/activate")]
    public async Task<IActionResult> ActivateTheme(Guid themeId)
    {
        try
        {
            var userId = GetUserId();
            var success = await _themingService.ActivateThemeAsync(themeId, userId);
            
            if (!success)
            {
                return NotFound("Theme not found or access denied");
            }

            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error activating theme {ThemeId}", themeId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("{themeId}")]
    public async Task<ActionResult<Models.ProjectTheme>> UpdateTheme(
        Guid themeId,
        [FromBody] Models.UpdateThemeRequest request)
    {
        try
        {
            var userId = GetUserId();
            var theme = await _themingService.UpdateThemeAsync(themeId, request, userId);
            
            if (theme == null)
            {
                return NotFound("Theme not found or access denied");
            }

            return Ok(theme);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating theme {ThemeId}", themeId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{themeId}")]
    public async Task<IActionResult> DeleteTheme(Guid themeId)
    {
        try
        {
            var userId = GetUserId();
            var success = await _themingService.DeleteThemeAsync(themeId, userId);
            
            if (!success)
            {
                return NotFound("Theme not found or access denied");
            }

            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting theme {ThemeId}", themeId);
            return StatusCode(500, "Internal server error");
        }
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
    }
}
