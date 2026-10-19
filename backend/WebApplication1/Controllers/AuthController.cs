
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using WebApplication1.Data;
using WebApplication1.DTOs;
using WebApplication1.Models;
using WebApplication1.Services;

namespace WebApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly AuditLogService _auditLog;

        public AuthController(
            AppDbContext context,
            IConfiguration configuration,
            AuditLogService auditLog)
        {
            _context = context;
            _configuration = configuration;
            _auditLog = auditLog;
        }

        // ==========================================
        // SIGNUP
        // ==========================================
        [HttpPost("signup")]
        public async Task<IActionResult> Signup(SignupDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            string email = dto.Email.Trim().ToLower();

            var existingUser = await _context.Users
                .FirstOrDefaultAsync(x => x.Email == email);

            if (existingUser != null)
            {
                return BadRequest(new
                {
                    message = "Email already exists."
                });
            }

            var user = new UserModel
            {
                Name = dto.Name.Trim(),
                Email = email,
                Password = BCrypt.Net.BCrypt.HashPassword(
                    dto.Password
                ),
                Role = "User",
                IsActive = true
            };

            _context.Users.Add(user);

            await _context.SaveChangesAsync();

            // AUDIT LOG: SIGNUP
            await _auditLog.LogAsync(
                user.Id,
                user.Name,
                user.Email,
                "Signup",
                "New user registered successfully.",
                HttpContext.Connection.RemoteIpAddress?.ToString()
            );

            return Ok(new
            {
                message = "Signup successful",
                userId = user.Id,
                name = user.Name,
                email = user.Email,
                role = user.Role,
                isActive = user.IsActive
            });
        }

        // ==========================================
        // LOGIN
        // ==========================================
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            string email = dto.Email.Trim().ToLower();

            var user = await _context.Users
                .FirstOrDefaultAsync(x => x.Email == email);

            if (user == null)
            {
                await _auditLog.LogAsync(
                    null,
                    "Unknown",
                    email,
                    "Failed Login",
                    "Login attempt with an unknown email.",
                    HttpContext.Connection.RemoteIpAddress?.ToString()
                );

                return Unauthorized(new
                {
                    message = "Invalid email or password."
                });
            }

            bool passwordValid;

            try
            {
                passwordValid = BCrypt.Net.BCrypt.Verify(
                    dto.Password,
                    user.Password
                );
            }
            catch
            {
                passwordValid = false;
            }

            if (!passwordValid)
            {
                await _auditLog.LogAsync(
                    user.Id,
                    user.Name,
                    user.Email,
                    "Failed Login",
                    "Incorrect password entered.",
                    HttpContext.Connection.RemoteIpAddress?.ToString()
                );

                return Unauthorized(new
                {
                    message = "Invalid email or password."
                });
            }

            // CHECK ACTIVE / INACTIVE STATUS
            if (!user.IsActive)
            {
                await _auditLog.LogAsync(
                    user.Id,
                    user.Name,
                    user.Email,
                    "Failed Login",
                    "Login blocked because account is inactive.",
                    HttpContext.Connection.RemoteIpAddress?.ToString()
                );

                return Unauthorized(new
                {
                    message = "Your account is inactive. Please contact an administrator."
                });
            }

            string token = GenerateToken(user);

            // AUDIT LOG: SUCCESSFUL LOGIN
            await _auditLog.LogAsync(
                user.Id,
                user.Name,
                user.Email,
                "Login",
                "User logged in successfully.",
                HttpContext.Connection.RemoteIpAddress?.ToString()
            );

            return Ok(new
            {
                message = "Login successful",
                token,
                userId = user.Id,
                name = user.Name,
                email = user.Email,
                role = user.Role,
                isActive = user.IsActive
            });
        }

        // ==========================================
        // FORGOT PASSWORD
        // ==========================================
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword(
            ForgotPasswordRequest request)
        {
            string email = request.Email.Trim().ToLower();

            var user = await _context.Users
                .FirstOrDefaultAsync(x =>
                    x.Email == email && x.IsActive);

            if (user == null)
            {
                return Ok(new
                {
                    message = "If an active account exists, password reset instructions will be provided."
                });
            }

            byte[] randomBytes = RandomNumberGenerator.GetBytes(32);

            string resetToken = Convert.ToBase64String(randomBytes)
                .Replace("+", "-")
                .Replace("/", "_")
                .Replace("=", "");

            string tokenHash = Convert.ToHexString(
                SHA256.HashData(
                    Encoding.UTF8.GetBytes(resetToken)
                )
            );

            user.PasswordResetTokenHash = tokenHash;

            user.PasswordResetTokenExpiryUtc =
                DateTime.UtcNow.AddMinutes(15);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Password reset token generated for development testing.",
                resetToken,
                expiresInMinutes = 15
            });
        }

        // ==========================================
        // RESET PASSWORD
        // ==========================================
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(
            ResetPasswordRequest request)
        {
            string email = request.Email.Trim().ToLower();

            var user = await _context.Users
                .FirstOrDefaultAsync(x => x.Email == email);

            if (user == null ||
                string.IsNullOrWhiteSpace(user.PasswordResetTokenHash) ||
                user.PasswordResetTokenExpiryUtc == null ||
                user.PasswordResetTokenExpiryUtc <= DateTime.UtcNow)
            {
                return BadRequest(new
                {
                    message = "Invalid or expired password reset token."
                });
            }

            string providedTokenHash = Convert.ToHexString(
                SHA256.HashData(
                    Encoding.UTF8.GetBytes(request.Token)
                )
            );

            bool tokenValid = string.Equals(
                providedTokenHash,
                user.PasswordResetTokenHash,
                StringComparison.Ordinal
            );

            if (!tokenValid)
            {
                return BadRequest(new
                {
                    message = "Invalid or expired password reset token."
                });
            }

            user.Password = BCrypt.Net.BCrypt.HashPassword(
                request.NewPassword
            );

            user.PasswordResetTokenHash = null;
            user.PasswordResetTokenExpiryUtc = null;

            await _context.SaveChangesAsync();

            // AUDIT LOG: PASSWORD RESET
            await _auditLog.LogAsync(
                user.Id,
                user.Name,
                user.Email,
                "Password Reset",
                "User reset password successfully.",
                HttpContext.Connection.RemoteIpAddress?.ToString()
            );

            return Ok(new
            {
                message = "Password reset successful. You can now login with your new password."
            });
        }

        // ==========================================
        // GENERATE JWT TOKEN
        // ==========================================
        private string GenerateToken(UserModel user)
        {
            string key = _configuration["Jwt:Key"]
                ?? throw new InvalidOperationException(
                    "JWT Key is missing."
                );

            string issuer = _configuration["Jwt:Issuer"]
                ?? throw new InvalidOperationException(
                    "JWT Issuer is missing."
                );

            string audience = _configuration["Jwt:Audience"]
                ?? throw new InvalidOperationException(
                    "JWT Audience is missing."
                );

            var claims = new[]
            {
                new Claim(
                    ClaimTypes.NameIdentifier,
                    user.Id.ToString()
                ),

                new Claim(
                    ClaimTypes.Name,
                    user.Name
                ),

                new Claim(
                    ClaimTypes.Email,
                    user.Email
                ),

                new Claim(
                    ClaimTypes.Role,
                    user.Role
                )
            };

            var keyBytes = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(key)
            );

            var credentials = new SigningCredentials(
                keyBytes,
                SecurityAlgorithms.HmacSha256
            );

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(2),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler()
                .WriteToken(token);
        }
    }

    // ==========================================
    // FORGOT PASSWORD REQUEST
    // ==========================================
    public class ForgotPasswordRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }

    // ==========================================
    // RESET PASSWORD REQUEST
    // ==========================================
    public class ResetPasswordRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Token { get; set; } = string.Empty;

        [Required]
        [MinLength(8)]
        public string NewPassword { get; set; } = string.Empty;
    }
}