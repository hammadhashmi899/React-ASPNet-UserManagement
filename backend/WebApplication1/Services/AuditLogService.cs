
using WebApplication1.Data;
using WebApplication1.Models;

namespace WebApplication1.Services
{
    public class AuditLogService
    {
        private readonly AppDbContext _context;

        public AuditLogService(AppDbContext context)
        {
            _context = context;
        }

        public async Task LogAsync(
            int? userId,
            string userName,
            string userEmail,
            string action,
            string? description = null,
            string? ipAddress = null)
        {
            var auditLog = new AuditLogModel
            {
                UserId = userId,
                UserName = userName,
                UserEmail = userEmail,
                Action = action,
                Description = description,
                IpAddress = ipAddress,
                CreatedAtUtc = DateTime.UtcNow
            };

            _context.AuditLogs.Add(auditLog);

            await _context.SaveChangesAsync();
        }
    }
}