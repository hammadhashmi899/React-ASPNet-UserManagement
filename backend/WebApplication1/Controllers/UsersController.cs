
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WebApplication1.Data;
using WebApplication1.DTOs;
using WebApplication1.Models;
using WebApplication1.Services;

namespace WebApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly AuditLogService _auditLog;

        public UsersController(
            AppDbContext context,
            AuditLogService auditLog)
        {
            _context = context;
            _auditLog = auditLog;
        }

        // ==========================================
        // GET USERS + SEARCH + FILTER + SORT + PAGINATION
        // ==========================================
        [HttpGet]
        public async Task<IActionResult> GetAllUsers(
            string? search = null,
            string? role = null,
            bool? isActive = null,
            int page = 1,
            int pageSize = 5,
            string sortBy = "id",
            string sortOrder = "desc")
        {
            if (page < 1)
            {
                page = 1;
            }

            if (pageSize < 1)
            {
                pageSize = 5;
            }

            if (pageSize > 100)
            {
                pageSize = 100;
            }

            var query = _context.Users
                .AsNoTracking()
                .AsQueryable();

            // SEARCH FILTER
            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.Trim().ToLower();

                query = query.Where(x =>
                    x.Name.ToLower().Contains(search) ||
                    x.Email.ToLower().Contains(search)
                );
            }

            // ROLE FILTER
            if (!string.IsNullOrWhiteSpace(role) &&
                !role.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                role = role.Trim();

                query = query.Where(x =>
                    x.Role.ToLower() == role.ToLower()
                );
            }

            // ACTIVE / INACTIVE FILTER
            if (isActive.HasValue)
            {
                query = query.Where(x =>
                    x.IsActive == isActive.Value
                );
            }

            // SORT ORDER
            bool descending = sortOrder.Equals(
                "desc",
                StringComparison.OrdinalIgnoreCase
            );

            // SORT COLUMN
            sortBy = sortBy.Trim().ToLower();

            switch (sortBy)
            {
                case "name":
                    query = descending
                        ? query.OrderByDescending(x => x.Name).ThenBy(x => x.Id)
                        : query.OrderBy(x => x.Name).ThenBy(x => x.Id);
                    break;

                case "email":
                    query = descending
                        ? query.OrderByDescending(x => x.Email).ThenBy(x => x.Id)
                        : query.OrderBy(x => x.Email).ThenBy(x => x.Id);
                    break;

                case "role":
                    query = descending
                        ? query.OrderByDescending(x => x.Role).ThenBy(x => x.Id)
                        : query.OrderBy(x => x.Role).ThenBy(x => x.Id);
                    break;

                case "isactive":
                    query = descending
                        ? query.OrderByDescending(x => x.IsActive).ThenBy(x => x.Id)
                        : query.OrderBy(x => x.IsActive).ThenBy(x => x.Id);
                    break;

                case "id":
                default:
                    sortBy = "id";

                    query = descending
                        ? query.OrderByDescending(x => x.Id)
                        : query.OrderBy(x => x.Id);
                    break;
            }

            // COUNT FILTERED USERS
            var totalUsers = await query.CountAsync();

            var totalPages = (int)Math.Ceiling(
                totalUsers / (double)pageSize
            );

            // GET CURRENT PAGE
            var users = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(x => new
                {
                    x.Id,
                    x.Name,
                    x.Email,
                    x.Role,
                    x.IsActive
                })
                .ToListAsync();

            return Ok(new
            {
                data = users,
                page,
                pageSize,
                totalUsers,
                totalPages,
                sortBy,
                sortOrder = descending ? "desc" : "asc"
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
                    x.Role,
                    x.IsActive
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
        // CREATE USER - ADMIN ONLY
        // ==========================================
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateUser(UserCreateDto model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            string email = model.Email.Trim().ToLower();

            var existingUser = await _context.Users
                .FirstOrDefaultAsync(x => x.Email == email);

            if (existingUser != null)
            {
                return BadRequest(new
                {
                    message = "Email already exists."
                });
            }

            if (model.Role != "User" &&
                model.Role != "Admin")
            {
                return BadRequest(new
                {
                    message = "Role must be User or Admin."
                });
            }

            var user = new UserModel
            {
                Name = model.Name.Trim(),
                Email = email,
                Password = BCrypt.Net.BCrypt.HashPassword(
                    model.Password
                ),
                Role = model.Role,
                IsActive = true
            };

            _context.Users.Add(user);

            await _context.SaveChangesAsync();

            // AUDIT LOG: USER CREATED
            await _auditLog.LogAsync(
                GetCurrentUserId(),
                GetCurrentUserName(),
                GetCurrentUserEmail(),
                "User Created",
                $"Created user ID {user.Id}, Name: {user.Name}, Email: {user.Email}, Role: {user.Role}.",
                HttpContext.Connection.RemoteIpAddress?.ToString()
            );

            return Ok(new
            {
                message = "User created successfully.",
                user = new
                {
                    user.Id,
                    user.Name,
                    user.Email,
                    user.Role,
                    user.IsActive
                }
            });
        }

        // ==========================================
        // UPDATE USER - ADMIN ONLY
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

            if (string.IsNullOrWhiteSpace(model.Name))
            {
                return BadRequest(new
                {
                    message = "Name is required."
                });
            }

            if (string.IsNullOrWhiteSpace(model.Email))
            {
                return BadRequest(new
                {
                    message = "Email is required."
                });
            }

            string email = model.Email.Trim().ToLower();

            var emailExists = await _context.Users
                .AnyAsync(x =>
                    x.Email == email &&
                    x.Id != id
                );

            if (emailExists)
            {
                return BadRequest(new
                {
                    message = "Email already exists."
                });
            }

            string oldName = user.Name;
            string oldEmail = user.Email;

            user.Name = model.Name.Trim();
            user.Email = email;

            await _context.SaveChangesAsync();

            // AUDIT LOG: USER UPDATED
            await _auditLog.LogAsync(
                GetCurrentUserId(),
                GetCurrentUserName(),
                GetCurrentUserEmail(),
                "User Updated",
                $"Updated user ID {user.Id}. Previous Name: {oldName}, New Name: {user.Name}, Previous Email: {oldEmail}, New Email: {user.Email}.",
                HttpContext.Connection.RemoteIpAddress?.ToString()
            );

            return Ok(new
            {
                message = "User updated successfully.",
                user = new
                {
                    user.Id,
                    user.Name,
                    user.Email,
                    user.Role,
                    user.IsActive
                }
            });
        }

        // ==========================================
        // BULK ACTIVATE / DEACTIVATE - ADMIN ONLY
        // PUT: api/Users/bulk/status
        // ==========================================
        [HttpPut("bulk/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> BulkUpdateUserStatus(
            [FromBody] BulkUserStatusDto model)
        {
            if (model.Ids == null || model.Ids.Count == 0)
            {
                return BadRequest(new
                {
                    message = "Select at least one user."
                });
            }

            if (model.Ids.Count > 100)
            {
                return BadRequest(new
                {
                    message = "You can select a maximum of 100 users at a time."
                });
            }

            if (model.Ids.Any(id => id <= 0))
            {
                return BadRequest(new
                {
                    message = "User IDs must be positive numbers."
                });
            }

            var ids = model.Ids.Distinct().ToList();
            var currentUserId = GetCurrentUserId();

            var users = await _context.Users
                .Where(x => ids.Contains(x.Id))
                .ToListAsync();

            var foundIds = users.Select(x => x.Id).ToHashSet();
            var notFoundIds = ids.Where(id => !foundIds.Contains(id)).ToList();

            // Admin ko apna account deactivate karne se roko.
            var protectedIds = new List<int>();

            if (!model.IsActive && currentUserId.HasValue)
            {
                protectedIds = users
                    .Where(x => x.Id == currentUserId.Value)
                    .Select(x => x.Id)
                    .ToList();
            }

            var protectedSet = protectedIds.ToHashSet();

            var changedUsers = users
                .Where(x =>
                    !protectedSet.Contains(x.Id) &&
                    x.IsActive != model.IsActive)
                .ToList();

            foreach (var user in changedUsers)
            {
                user.IsActive = model.IsActive;
            }

            await _context.SaveChangesAsync();

            foreach (var user in changedUsers)
            {
                await _auditLog.LogAsync(
                    currentUserId,
                    GetCurrentUserName(),
                    GetCurrentUserEmail(),
                    model.IsActive ? "User Activated" : "User Deactivated",
                    $"Bulk operation: user ID {user.Id}, Name: {user.Name}, Email: {user.Email}. New status: {(model.IsActive ? "Active" : "Inactive")}.",
                    HttpContext.Connection.RemoteIpAddress?.ToString()
                );
            }

            return Ok(new
            {
                message = model.IsActive
                    ? "Bulk activation completed."
                    : "Bulk deactivation completed.",
                requested = ids.Count,
                changed = changedUsers.Count,
                alreadyInRequestedState = users.Count(x =>
                    !protectedSet.Contains(x.Id) &&
                    x.IsActive == model.IsActive),
                protectedIds,
                notFoundIds
            });
        }

        // ==========================================
        // BULK DELETE - ADMIN ONLY
        // POST: api/Users/bulk-delete
        // ==========================================
        [HttpPost("bulk-delete")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> BulkDeleteUsers(
            [FromBody] BulkUserIdsDto model)
        {
            if (model.Ids == null || model.Ids.Count == 0)
            {
                return BadRequest(new
                {
                    message = "Select at least one user."
                });
            }

            if (model.Ids.Count > 100)
            {
                return BadRequest(new
                {
                    message = "You can select a maximum of 100 users at a time."
                });
            }

            if (model.Ids.Any(id => id <= 0))
            {
                return BadRequest(new
                {
                    message = "User IDs must be positive numbers."
                });
            }

            var ids = model.Ids.Distinct().ToList();
            var currentUserId = GetCurrentUserId();

            var users = await _context.Users
                .Where(x => ids.Contains(x.Id))
                .ToListAsync();

            var foundIds = users.Select(x => x.Id).ToHashSet();
            var notFoundIds = ids.Where(id => !foundIds.Contains(id)).ToList();

            // Safety: current user aur Admin accounts bulk delete nahi honge.
            var protectedUsers = users
                .Where(x =>
                    (currentUserId.HasValue && x.Id == currentUserId.Value) ||
                    string.Equals(x.Role, "Admin", StringComparison.OrdinalIgnoreCase))
                .ToList();

            var protectedIds = protectedUsers
                .Select(x => x.Id)
                .ToHashSet();

            var usersToDelete = users
                .Where(x => !protectedIds.Contains(x.Id))
                .ToList();

            foreach (var user in usersToDelete)
            {
                await _auditLog.LogAsync(
                    currentUserId,
                    GetCurrentUserName(),
                    GetCurrentUserEmail(),
                    "User Deleted",
                    $"Bulk delete: user ID {user.Id}, Name: {user.Name}, Email: {user.Email}, Role: {user.Role}.",
                    HttpContext.Connection.RemoteIpAddress?.ToString()
                );
            }

            if (usersToDelete.Count > 0)
            {
                _context.Users.RemoveRange(usersToDelete);
                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                message = "Bulk delete operation completed.",
                requested = ids.Count,
                deleted = usersToDelete.Count,
                protectedIds = protectedIds.ToList(),
                notFoundIds
            });
        }

        // ==========================================
        // ACTIVATE / DEACTIVATE - ADMIN ONLY
        // ==========================================
        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateUserStatus(
            int id,
            bool isActive)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            if (user.IsActive == isActive)
            {
                return Ok(new
                {
                    message = isActive
                        ? "User is already active."
                        : "User is already inactive.",

                    user = new
                    {
                        user.Id,
                        user.Name,
                        user.Email,
                        user.Role,
                        user.IsActive
                    }
                });
            }

            user.IsActive = isActive;

            await _context.SaveChangesAsync();

            string action = isActive
                ? "User Activated"
                : "User Deactivated";

            // AUDIT LOG: STATUS CHANGE
            await _auditLog.LogAsync(
                GetCurrentUserId(),
                GetCurrentUserName(),
                GetCurrentUserEmail(),
                action,
                $"Admin changed status of user ID {user.Id}, Name: {user.Name}, Email: {user.Email}. New status: {(isActive ? "Active" : "Inactive")}.",
                HttpContext.Connection.RemoteIpAddress?.ToString()
            );

            return Ok(new
            {
                message = isActive
                    ? "User activated successfully."
                    : "User deactivated successfully.",

                user = new
                {
                    user.Id,
                    user.Name,
                    user.Email,
                    user.Role,
                    user.IsActive
                }
            });
        }



        // ==========================================
        // GET MY PROFILE
        // GET: api/Users/me
        // ==========================================
        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile()
        {
            var currentUserId = GetCurrentUserId();

            if (!currentUserId.HasValue)
            {
                return Unauthorized(new
                {
                    message = "Unable to identify the logged-in user."
                });
            }

            var user = await _context.Users
                .AsNoTracking()
                .Where(x => x.Id == currentUserId.Value)
                .Select(x => new
                {
                    x.Id,
                    x.Name,
                    x.Email,
                    x.Role,
                    x.IsActive
                })
                .FirstOrDefaultAsync();

            if (user == null)
            {
                return NotFound(new
                {
                    message = "Your account was not found."
                });
            }

            return Ok(user);
        }


        // ==========================================
        // CHANGE PASSWORD - LOGGED-IN USER
        // PUT: api/Users/me/change-password
        // ==========================================
        [HttpPut("me/change-password")]
        public async Task<IActionResult> ChangePassword(
            [FromBody] ChangePasswordDto model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var currentUserId = GetCurrentUserId();

            if (!currentUserId.HasValue)
            {
                return Unauthorized(new
                {
                    message = "Unable to identify the logged-in user."
                });
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(
                    x => x.Id == currentUserId.Value
                );

            if (user == null)
            {
                return NotFound(new
                {
                    message = "Your account was not found."
                });
            }

            // Verify current password against its BCrypt hash.
            bool currentPasswordValid;

            try
            {
                currentPasswordValid =
                    BCrypt.Net.BCrypt.Verify(
                        model.CurrentPassword,
                        user.Password
                    );
            }
            catch (BCrypt.Net.SaltParseException)
            {
                currentPasswordValid = false;
            }

            if (!currentPasswordValid)
            {
                return BadRequest(new
                {
                    message = "Current password is incorrect."
                });
            }

            if (model.NewPassword == model.CurrentPassword)
            {
                return BadRequest(new
                {
                    message = "New password must be different from the current password."
                });
            }

            string oldName = user.Name;

            // Hash the new password before saving it.
            user.Password = BCrypt.Net.BCrypt.HashPassword(
                model.NewPassword
            );

            await _context.SaveChangesAsync();

            await _auditLog.LogAsync(
                currentUserId,
                GetCurrentUserName(),
                GetCurrentUserEmail(),
                "Password Changed",
                $"User ID {user.Id} changed their password.",
                HttpContext.Connection.RemoteIpAddress?.ToString()
            );

            return Ok(new
            {
                message = "Password changed successfully."
            });
        }


        // ==========================================
        // UPDATE MY PROFILE
        // PUT: api/Users/me
        // ==========================================
        [HttpPut("me")]
        public async Task<IActionResult> UpdateMyProfile(
            [FromBody] UserProfileUpdateDto model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var currentUserId = GetCurrentUserId();

            if (!currentUserId.HasValue)
            {
                return Unauthorized(new
                {
                    message = "Unable to identify the logged-in user."
                });
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(
                    x => x.Id == currentUserId.Value
                );

            if (user == null)
            {
                return NotFound(new
                {
                    message = "Your account was not found."
                });
            }

            string name = model.Name.Trim();
            string email = model.Email.Trim().ToLowerInvariant();

            if (name.Length < 2 || name.Length > 100)
            {
                return BadRequest(new
                {
                    message = "Name must contain 2 to 100 characters."
                });
            }

            bool emailExists = await _context.Users
                .AnyAsync(x =>
                    x.Email.ToLower() == email &&
                    x.Id != user.Id
                );

            if (emailExists)
            {
                return BadRequest(new
                {
                    message = "Email already exists."
                });
            }

            string oldName = user.Name;
            string oldEmail = user.Email;

            user.Name = name;
            user.Email = email;

            await _context.SaveChangesAsync();

            await _auditLog.LogAsync(
                GetCurrentUserId(),
                GetCurrentUserName(),
                GetCurrentUserEmail(),
                "Profile Updated",
                $"User updated their own profile. User ID: {user.Id}. " +
                $"Previous Name: {oldName}, New Name: {user.Name}, " +
                $"Previous Email: {oldEmail}, New Email: {user.Email}.",
                HttpContext.Connection.RemoteIpAddress?.ToString()
            );

            return Ok(new
            {
                message = "Profile updated successfully.",
                user = new
                {
                    user.Id,
                    user.Name,
                    user.Email,
                    user.Role,
                    user.IsActive
                }
            });
        }



        // ==========================================
        // CURRENT LOGGED-IN USER DETAILS
        // ==========================================
        private int? GetCurrentUserId()
        {
            string? id = User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

            return int.TryParse(id, out int userId)
                ? userId
                : null;
        }

        private string GetCurrentUserName()
        {
            return User.FindFirstValue(ClaimTypes.Name)
                ?? "Unknown";
        }

        private string GetCurrentUserEmail()
        {
            return User.FindFirstValue(ClaimTypes.Email)
                ?? "Unknown";
        }
    }
}