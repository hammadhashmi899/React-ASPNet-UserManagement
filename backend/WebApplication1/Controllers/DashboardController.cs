using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;

namespace WebApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DashboardController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var totalUsers = await _context.Users.CountAsync();

            var activeUsers = await _context.Users
                .CountAsync(x => x.IsActive);

            var inactiveUsers = await _context.Users
                .CountAsync(x => !x.IsActive);

            return Ok(new
            {
                totalUsers,
                activeUsers,
                inactiveUsers
            });
        }
    }
}