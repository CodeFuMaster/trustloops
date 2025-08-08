using Microsoft.AspNetCore.SignalR;

namespace TrustLoops.WebApp.Features.Status;

public class StatusHub : Hub
{
    public async Task JoinStatusPage(string statusPageId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"status-{statusPageId}");
    }

    public async Task LeaveStatusPage(string statusPageId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"status-{statusPageId}");
    }

    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }
}
