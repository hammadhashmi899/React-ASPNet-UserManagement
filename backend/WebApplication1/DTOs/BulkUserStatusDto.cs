using System.ComponentModel.DataAnnotations;

namespace WebApplication1.DTOs
{
    public class BulkUserStatusDto
    {
        [Required]
        [MinLength(1, ErrorMessage = "Select at least one user.")]
        public List<int> Ids { get; set; } = new();

        public bool IsActive { get; set; }
    }
}