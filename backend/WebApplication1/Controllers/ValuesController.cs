using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;
using WebApplication1.DTOs;
using WebApplication1.Models;

namespace WebApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    
    public class ValuesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ValuesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Values
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var emails = await _context.Emails
                .OrderByDescending(x => x.Id)
                .ToListAsync();

            return Ok(emails);
        }

        // GET: api/Values/1
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var email = await _context.Emails
                .FindAsync(id);

            if (email == null)
            {
                return NotFound(new
                {
                    message = "Email not found."
                });
            }

            return Ok(email);
        }

        // POST: api/Values
        [HttpPost]
        public async Task<IActionResult> Create(EmailModel model)
        {
            if (string.IsNullOrWhiteSpace(model.Email))
            {
                return BadRequest(new
                {
                    message = "Email is required."
                });
            }

            var email = new EmailModel
            {
                Email = model.Email.Trim(),
                Description = model.Description?.Trim() ?? string.Empty
            };

            _context.Emails.Add(email);

            await _context.SaveChangesAsync();

            return Ok(email);
        }

        // PUT: api/Values/1
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            EmailModel model)
        {
            var existingEmail = await _context.Emails
                .FindAsync(id);

            if (existingEmail == null)
            {
                return NotFound(new
                {
                    message = "Email not found."
                });
            }

            if (string.IsNullOrWhiteSpace(model.Email))
            {
                return BadRequest(new
                {
                    message = "Email is required."
                });
            }

            existingEmail.Email = model.Email.Trim();

            existingEmail.Description =
                model.Description?.Trim() ?? string.Empty;

            await _context.SaveChangesAsync();

            return Ok(existingEmail);
        }

        // DELETE: api/Values/1
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var email = await _context.Emails
                .FindAsync(id);

            if (email == null)
            {
                return NotFound(new
                {
                    message = "Email not found."
                });
            }

            _context.Emails.Remove(email);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Deleted successfully."
            });
        }
    }
}