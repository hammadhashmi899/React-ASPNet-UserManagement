using System.ComponentModel.DataAnnotations;

namespace WebApplication1.DTOs
{
    public class EmailDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }
}