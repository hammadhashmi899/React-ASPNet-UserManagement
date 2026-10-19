
using System.ComponentModel.DataAnnotations;

namespace WebApplication1.DTOs
{
    public class UserProfileUpdateDto
    {
        [Required]
        [StringLength(100, MinimumLength = 2)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [StringLength(256)]
        public string Email { get; set; } = string.Empty;
    }
}
