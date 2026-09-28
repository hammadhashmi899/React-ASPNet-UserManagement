using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;
using WebApplication1.DTOs;

namespace WebApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        // GET ALL USERS + SEARCH + PAGINATION
        [HttpGet]
        public async Task<IActionResult> GetAllUsers(
            string? search = null,
            int page = 1,
            int pageSize = 5)
        {
            // Page validation
            if (page < 1)
            {
                page = 1;
            }

            if (pageSize < 1)
            {
                pageSize = 5;
            }

            // Users query
            var query = _context.Users
                .AsNoTracking()
                .AsQueryable();


            // ==========================================
            // SEARCH
            // ==========================================
            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.Trim().ToLower();

                query = query.Where(x =>
                    x.Name.ToLower().Contains(search) ||
                    x.Email.ToLower().Contains(search)
                );
            }


            // ==========================================
            // TOTAL USERS
            // ==========================================
            var totalUsers = await query.CountAsync();


            // ==========================================
            // TOTAL PAGES
            // ==========================================
            var totalPages = (int)Math.Ceiling(
                totalUsers / (double)pageSize
            );


            // ==========================================
            // GET CURRENT PAGE USERS
            // ==========================================
            var users = await query
                .OrderByDescending(x => x.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(x => new
                {
                    x.Id,
                    x.Name,
                    x.Email,
                    x.Role
                })
                .ToListAsync();


            // ==========================================
            // RESPONSE
            // ==========================================
            return Ok(new
            {
                data = users,
                page = page,
                pageSize = pageSize,
                totalUsers = totalUsers,
                totalPages = totalPages
            });
        }


        // ==========================================
        // GET USER BY ID
        // ==========================================
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUserById(int id)
        {
            var user = await _context.Users
                .Where(x => x.Id == id)
                .Select(x => new
                {
                    x.Id,
                    x.Name,
                    x.Email,
                    x.Role
                })
                .FirstOrDefaultAsync();

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            return Ok(user);
        }


        // ==========================================
        // UPDATE USER
        // ADMIN ONLY
        // ==========================================
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateUser(
            int id,
            UserUpdateDto model)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }


            // Name validation
            if (string.IsNullOrWhiteSpace(model.Name))
            {
                return BadRequest(new
                {
                    message = "Name is required."
                });
            }


            // Email validation
            if (string.IsNullOrWhiteSpace(model.Email))
            {
                return BadRequest(new
                {
                    message = "Email is required."
                });
            }


            // Update only Name and Email
            user.Name = model.Name.Trim();

            user.Email = model.Email
                .Trim()
                .ToLower();


            // Save to SQL database
            await _context.SaveChangesAsync();


            return Ok(new
            {
                message = "User updated successfully.",

                user = new
                {
                    user.Id,
                    user.Name,
                    user.Email,
                    user.Role
                }
            });
        }
    }
}

