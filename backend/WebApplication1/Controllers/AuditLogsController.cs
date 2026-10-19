using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;

namespace WebApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AuditLogsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuditLogsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: /api/AuditLogs
        [HttpGet]
        public async Task<IActionResult> GetAuditLogs(
            string? search = null,
            string? action = null,
            int page = 1,
            int pageSize = 10)
        {
            page = Math.Max(page, 1);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = _context.AuditLogs.AsNoTracking();

            // Search
            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(x =>
                    x.UserName.Contains(search) ||
                    x.UserEmail.Contains(search) ||
                    (x.Description != null &&
                     x.Description.Contains(search)));
            }

            // Action filter
            if (!string.IsNullOrWhiteSpace(action))
            {
                query = query.Where(x => x.Action == action);
            }

            var totalLogs = await query.CountAsync();

            var logs = await query
                .OrderByDescending(x => x.CreatedAtUtc)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(x => new
                {
                    x.Id,
                    x.UserId,
                    x.UserName,
                    x.UserEmail,
                    x.Action,
                    x.Description,
                    x.IpAddress,
                    x.CreatedAtUtc
                })
                .ToListAsync();

            // Get available actions for filter
            var actions = await _context.AuditLogs
                .Select(x => x.Action)
                .Distinct()
                .OrderBy(x => x)
                .ToListAsync();

            return Ok(new
            {
                data = logs,
                totalLogs,
                totalPages = (int)Math.Ceiling(
                    totalLogs / (double)pageSize
                ),
                currentPage = page,
                pageSize,
                actions
            });
        }

        // DELETE: /api/AuditLogs/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAuditLog(int id)
        {
            var auditLog = await _context.AuditLogs
                .FirstOrDefaultAsync(x => x.Id == id);

            if (auditLog == null)
            {
                return NotFound(new
                {
                    message = "Audit log not found."
                });
            }

            _context.AuditLogs.Remove(auditLog);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Audit log deleted successfully."
            });
        }
    }
}